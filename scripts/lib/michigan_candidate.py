"""Conservative diagnostic allocation. Never emits an admitted v0.29A bundle."""
from collections import Counter

import shapely
from shapely.geometry import Point, shape
from shapely.strtree import STRtree

GROUPS = ["hispanic_any_race", "non_hispanic_white", "non_hispanic_black", "non_hispanic_asian", "non_hispanic_other"]
FIELDS = ["totalVotingAgePopulation", *GROUPS]


def empty_profile():
    return dict.fromkeys(FIELDS, 0)


def add_profile(target, source):
    for key in FIELDS:
        target[key] += source[key]
    return target


def validate_profile(profile):
    if set(profile) != set(FIELDS) or any(type(v) is not int or v < 0 for v in profile.values()):
        raise ValueError("Profile must have exactly six nonnegative integer cells")
    if sum(profile[key] for key in GROUPS) != profile["totalVotingAgePopulation"]:
        raise ValueError("Five groups do not reconcile to VAP")


class DiagnosticMap:
    def __init__(self, features, *, precision_grid=None, vintage_overrides=None):
        ordered = sorted(features, key=lambda f: f["properties"]["PRECINCTID"])
        self.ids = [f["properties"]["PRECINCTID"] for f in ordered]
        if len(set(self.ids)) != len(self.ids):
            raise ValueError("Duplicate map identity")
        self.counties = ["26" + f["properties"]["COUNTYFIPS"] for f in ordered]
        self.geometries = [shape(f["geometry"]) for f in ordered]
        if precision_grid is not None:
            self.geometries = [shapely.set_precision(g, precision_grid) for g in self.geometries]
        overrides = vintage_overrides or {}
        if any(unit_id not in self.ids or year != 2024 for unit_id, year in overrides.items()):
            raise ValueError("Invalid effective-vintage override")
        if any(not c.startswith("26") or len(c) != 5 for c in self.counties):
            raise ValueError("Invalid Michigan county")
        vintage_exceptions = [{"unitId": self.ids[i], "sourceElectionYear": f["properties"].get("ELECTIONYE")}
                              for i, f in enumerate(ordered) if overrides.get(self.ids[i], f["properties"].get("ELECTIONYE")) != 2024]
        self.quarantine = {i for i, f in enumerate(ordered) if overrides.get(self.ids[i], f["properties"].get("ELECTIONYE")) != 2024}
        invalid = []
        for i, geom in enumerate(self.geometries):
            if geom.geom_type not in ("Polygon", "MultiPolygon") or geom.is_empty:
                raise ValueError(f"Unusable map footprint {self.ids[i]}")
            if not geom.is_valid:
                self.quarantine.add(i)
                invalid.append({"unitId": self.ids[i], "reason": shapely.is_valid_reason(geom)})
        # make_valid defines exclusion footprints only. Repaired targets NEVER receive population.
        self.footprints = [shapely.make_valid(g) if i in self.quarantine else g for i, g in enumerate(self.geometries)]
        self.tree = STRtree(self.footprints)
        overlaps = []
        for i, geom in enumerate(self.footprints):
            for j in self.tree.query(geom):
                j = int(j)
                if j <= i:
                    continue
                overlap = geom.intersection(self.footprints[j])
                if overlap.area > 0:
                    self.quarantine.update([i, j])
                    overlaps.append({"left": self.ids[i], "right": self.ids[j], "areaSquareDegrees": overlap.area})
        self.audit = {"invalidUnits": invalid, "positiveAreaOverlaps": overlaps, "vintageExceptions": vintage_exceptions,
                      "quarantinedUnitIds": sorted(self.ids[i] for i in self.quarantine),
                      "repairPolicy": "make_valid for exclusion footprints only; never repair an allocation target",
                      "overlapPolicy": "all strictly positive polygon intersections quarantine both targets; no area threshold or area weighting"}

    def allocate(self, block, geometry, internal_point):
        validate_profile(block["profile"])
        record = {"blockGeoid": block["blockGeoid"], "countyFips": block["countyFips"],
                  "sourceProfile": block["profile"], "disposition": "unavailable", "method": None,
                  "unitId": None, "reason": None, "affectedUnitIds": []}
        if not block["blockGeoid"].startswith(block["countyFips"]) or len(block["blockGeoid"]) != 15:
            raise ValueError("Invalid source block/county identity")
        if geometry is None:
            record["reason"] = "missing_source_geometry"
            return record
        if not geometry.is_valid or geometry.is_empty or geometry.geom_type not in ("Polygon", "MultiPolygon"):
            record["reason"] = "invalid_source_geometry"
            # Bounding-box candidates are conservative only; no invalid geometry allocation.
            record["affectedUnitIds"] = sorted(self.ids[int(i)] for i in self.tree.query(geometry))
            return record
        touching = [int(i) for i in self.tree.query(geometry, predicate="intersects")]
        record["affectedUnitIds"] = sorted(self.ids[i] for i in touching)
        if any(i in self.quarantine for i in touching):
            record["reason"] = "quarantined_map_geometry"
            return record
        point = Point(internal_point) if internal_point is not None else None
        if point is not None and not geometry.covers(point):
            record["reason"] = "internal_point_outside_source"
            return record
        same_county = [i for i in touching if self.counties[i] == block["countyFips"]]
        contained = [i for i in same_county if self.geometries[i].covers(geometry)]
        target = None
        if len(contained) > 1:
            record["reason"] = "ambiguous_map_assignment"
            return record
        if len(contained) == 1:
            target, record["method"] = contained[0], "whole_block_containment"
        elif point is not None:
            point_targets = [int(i) for i in self.tree.query(point, predicate="intersects")]
            if len(point_targets) > 1:
                record["reason"] = "ambiguous_map_assignment"
                return record
            if point_targets:
                target = point_targets[0]
                if self.counties[target] != block["countyFips"]:
                    record["reason"] = "county_boundary_conflict"
                    return record
                record["method"] = "census_internal_point"
        if target is None:
            record["reason"] = "zero_information_split" if len(same_county) > 1 else "no_compatible_geometry"
            return record
        record.update(disposition="allocated", unitId=self.ids[target], affectedUnitIds=[])
        return record


def summarize_records(terrain, records):
    source, modeled, unavailable = empty_profile(), empty_profile(), empty_profile()
    units = {unit_id: {"unitId": unit_id, "countyFips": terrain.counties[i], "profile": empty_profile(),
                      "sourceBlockCount": 0, "unresolvedTouchingBlockCount": 0, "methods": Counter(),
                      "quarantined": i in terrain.quarantine} for i, unit_id in enumerate(terrain.ids)}
    reasons, methods = {}, {}
    seen = set()
    missing_counties = set()
    for record in records:
        if record["blockGeoid"] in seen:
            raise ValueError("Duplicate source block")
        seen.add(record["blockGeoid"])
        validate_profile(record["sourceProfile"])
        add_profile(source, record["sourceProfile"])
        if record["disposition"] == "allocated":
            unit = units[record["unitId"]]
            if unit["quarantined"] or unit["countyFips"] != record["countyFips"]:
                raise ValueError("Quarantined or cross-county allocation")
            add_profile(modeled, record["sourceProfile"])
            add_profile(unit["profile"], record["sourceProfile"])
            unit["sourceBlockCount"] += 1
            unit["methods"][record["method"]] += 1
            audit = methods.setdefault(record["method"], {"blockCount": 0, "profile": empty_profile()})
        else:
            if record["unitId"] is not None:
                raise ValueError("Unavailable block has a target")
            add_profile(unavailable, record["sourceProfile"])
            audit = reasons.setdefault(record["reason"], {"blockCount": 0, "profile": empty_profile()})
            if record["reason"] == "missing_source_geometry":
                missing_counties.add(record["countyFips"])
            for unit_id in record["affectedUnitIds"]:
                units[unit_id]["unresolvedTouchingBlockCount"] += 1
        audit["blockCount"] += 1
        add_profile(audit["profile"], record["sourceProfile"])
    for unit in units.values():
        unit["status"] = "unavailable" if unit["sourceBlockCount"] == 0 else (
            "partial" if unit["unresolvedTouchingBlockCount"] or unit["countyFips"] in missing_counties else "complete")
        if unit["sourceBlockCount"] == 0:
            unit["profile"] = None
        unit["methods"] = dict(sorted(unit["methods"].items()))
    if any(source[key] != modeled[key] + unavailable[key] for key in FIELDS):
        raise ValueError("Source accounting does not conserve")
    return {"sourceProfile": source, "modeledProfile": modeled, "unavailableProfile": unavailable,
            "sourceBlockCount": len(records), "allocatedBlockCount": sum(x["blockCount"] for x in methods.values()),
            "unavailableBlockCount": sum(x["blockCount"] for x in reasons.values()),
            "methods": methods, "unavailableReasons": reasons, "units": list(units.values())}
