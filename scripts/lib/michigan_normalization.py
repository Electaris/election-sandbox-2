"""Versioned source-tolerance normalization; substantive conflicts stay unresolved."""
import hashlib
import json

import shapely
from shapely.geometry import mapping, shape
from shapely.strtree import STRtree

GRID = 0.0001  # native source resolution: 1 / xyUnits
TOLERANCE = 0.001  # official source XY tolerance, metres
VERSION = "mi-native-source-tolerance-normalization-v1"
FLINT = "WP-049-29020-00002"


def polygon_parts(geometry):
    if geometry.geom_type == "Polygon":
        return [geometry]
    if hasattr(geometry, "geoms"):
        return [p for child in geometry.geoms for p in polygon_parts(child)]
    return []


def geometry_hash(geometry):
    return "sha256:" + hashlib.sha256(shapely.to_wkb(shapely.normalize(geometry), byte_order=1)).hexdigest()


def normalize_map(features, metadata):
    sr = metadata["sourceSpatialReference"]
    if sr["latestWkid"] != 3078 or sr["xyTolerance"] != TOLERANCE or sr["xyUnits"] != 1 / GRID:
        raise ValueError("Unreviewed source precision metadata")
    ordered = sorted(features, key=lambda f: f["properties"]["PRECINCTID"])
    ids = [f["properties"]["PRECINCTID"] for f in ordered]
    if len(set(ids)) != len(ids):
        raise ValueError("Duplicate normalization identity")
    source = [shape(f["geometry"]) for f in ordered]
    normalized, unit_audit = [], []
    for unit_id, original in zip(ids, source):
        if original.geom_type not in ("Polygon", "MultiPolygon") or original.is_empty:
            raise ValueError("Missing polygon footprint")
        polygonal = shapely.union_all(polygon_parts(shapely.make_valid(original)))
        # The observed defects are repeated/self-touching ring representation, not crossed-area edits.
        if abs(polygonal.area - original.area) > 0.00001:
            raise ValueError("Material make_valid area change: " + unit_id)
        snapped = shapely.set_precision(polygonal, GRID)
        if snapped.is_empty or not snapped.is_valid:
            raise ValueError("Normalization collapses or invalidates a target")
        changed = shapely.set_precision(polygonal, 0).symmetric_difference(shapely.set_precision(snapped, 0))
        if not changed.difference(polygonal.boundary.buffer(TOLERANCE)).is_empty:
            raise ValueError("Normalization exceeds source tolerance: " + unit_id)
        normalized.append(snapped)
        unit_audit.append({"unitId": unit_id, "sourceValid": original.is_valid,
                          "sourceValidity": shapely.is_valid_reason(original), "sourceAreaM2": original.area,
                          "polygonalAreaM2": polygonal.area, "precisionAreaM2": snapped.area,
                          "sourceGeometryFingerprint": geometry_hash(original), "excludedOverlapAreaM2": 0})
    tree = STRtree(normalized)
    exclusions, overlaps = {}, []
    for i, geom in enumerate(normalized):
        for raw_j in sorted(tree.query(geom)):
            j = int(raw_j)
            if j <= i:
                continue
            overlap = geom.intersection(normalized[j])
            if overlap.area <= 0:
                continue
            bounded = all(overlap.difference(target.boundary.buffer(TOLERANCE)).is_empty for target in [geom, normalized[j]])
            overlaps.append({"left": ids[i], "right": ids[j], "areaM2": overlap.area,
                             "withinBothBoundaryTolerances": bounded,
                             "disposition": "excluded_from_both_targets" if bounded else "unresolved_source_conflict",
                             "geometry": mapping(overlap)})
            if bounded:
                exclusions.setdefault(i, []).append(overlap)
                exclusions.setdefault(j, []).append(overlap)
    # Simultaneous exclusion avoids an order-dependent winner for ambiguous strips.
    for i, pieces in exclusions.items():
        excluded = shapely.union_all(pieces, grid_size=GRID)
        unit_audit[i]["excludedOverlapAreaM2"] = excluded.area
        normalized[i] = normalized[i].difference(excluded)
    output = []
    for feature, geom, audit in zip(ordered, normalized, unit_audit):
        if geom.is_empty or not geom.is_valid:
            raise ValueError("Overlap exclusion produced invalid terrain")
        audit.update(normalizedAreaM2=geom.area, normalizedGeometryFingerprint=geometry_hash(geom))
        output.append({"type": "Feature", "properties": feature["properties"], "geometry": mapping(geom)})
    return output, {"schemaVersion": "mi-geometry-normalization-audit-v1", "profile": VERSION,
                    "coordinateReferenceSystem": "EPSG:3078", "sourceResolutionMetres": GRID,
                    "sourceToleranceMetres": TOLERANCE, "units": unit_audit, "overlaps": overlaps,
                    "invalidSourcesNormalized": sum(not a["sourceValid"] for a in unit_audit),
                    "boundedOverlapsExcluded": sum(o["withinBothBoundaryTolerances"] for o in overlaps),
                    "unresolvedOverlaps": sum(not o["withinBothBoundaryTolerances"] for o in overlaps),
                    "policy": "Polygonal make_valid only with <=0.00001 square metre area change; snap at native resolution; exclude only shared overlap strips within both source boundary tolerances; retain all larger conflicts."}


def verify_source_attributes(native, historical):
    previous = {f["properties"]["PRECINCTID"]: f["properties"] for f in historical}
    if len(previous) != len(historical) or len(native) != len(previous) or {f["properties"]["PRECINCTID"] for f in native} != set(previous):
        raise ValueError("Native/historical identity mismatch")
    aliases = {"ShapeSTArea": "Shape.STArea()", "ShapeSTLength": "Shape.STLength()"}
    for f in native:
        p = f["properties"]
        expected_keys = {aliases.get(k, k) for k in previous[p["PRECINCTID"]]}
        if set(p) != expected_keys:
            raise ValueError("Native/historical property schema drift")
        for key, value in previous[p["PRECINCTID"]].items():
            if p[aliases.get(key, key)] != value:
                raise ValueError("Native/historical source attribute drift: " + p["PRECINCTID"])


def validate_flint_resolution(features, policy):
    selected = [f for f in features if f["properties"]["PRECINCTID"] == FLINT]
    if len(selected) != 1 or policy["unitId"] != FLINT or policy["effectiveElectionYear"] != 2024:
        raise ValueError("Unreviewed vintage override")
    p = selected[0]["properties"]
    if p["ELECTIONYE"] != 2023 or p["COUNTYFIPS"] != "049" or p["MCDFIPS"] != "29020" or p["PRECINCT"] != "002":
        raise ValueError("Flint source identity/vintage changed")
    digest = hashlib.sha256(json.dumps(p, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
    if digest != policy["sourcePropertiesSha256"]:
        raise ValueError("Flint reviewed properties changed")
    return {FLINT: 2024}
