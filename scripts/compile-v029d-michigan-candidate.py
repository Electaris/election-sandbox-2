"""Statewide pre-admission diagnostic; no application assets or admitted bundles are written."""
import argparse
import csv
import gzip
import hashlib
import json
from collections import Counter
from pathlib import Path

import pyproj
import shapely
from osgeo import ogr
from pyproj import Transformer

from lib.michigan_candidate import DiagnosticMap, FIELDS, GROUPS, add_profile, empty_profile, summarize_records, validate_profile

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs/review/v0.29d-michigan-comparison"
FIELD_MAP = dict(zip(FIELDS, ["votingAgePopulation", "hispanicAnyRace", "nonHispanicWhite", "nonHispanicBlack", "nonHispanicAsian", "nonHispanicOther"]))
VOTES = ["harrisVotes", "trumpVotes", "steinVotes", "oliverVotes", "residualOtherVotes"]


def read_json(path):
    return json.loads((ROOT / path).read_text(encoding="utf8"))


def encoded(value):
    return (json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False, allow_nan=False) + "\n").encode("utf8")


def fingerprint(data):
    return "sha256:" + hashlib.sha256(data).hexdigest()


def compare(candidate, foundation, crosswalk, results):
    rows = [dict(zip(foundation["precinctFields"], row)) for row in foundation["precinctRows"]]
    base = {row["geometryId"]: row for row in rows}
    if len(base) != len(rows) or set(base) != {u["unitId"] for u in candidate["units"]}:
        raise ValueError("Candidate and admitted terrain identities differ")
    by_result = {u["id"]: u for u in results["reportingUnits"]}
    if len(by_result) != len(results["reportingUnits"]):
        raise ValueError("Duplicate reporting unit")
    links, seen = {}, set()
    for match in crosswalk["matchedGeometry"]:
        key = match["geometryId"]
        if key not in base or key in links:
            raise ValueError("Unknown or duplicate crosswalk geometry")
        links[key] = match["reportingUnits"]
        for link in links[key]:
            result = by_result[link["reportingUnitId"]]
            if result["id"] in seen or result["countyFips"] != "26" + key.split("-")[1]:
                raise ValueError("Duplicate or cross-county election linkage")
            if link["matchMethod"] not in ("exact_official_ward_key", "unique_official_precinct_key"):
                raise ValueError("Unsupported election link method: " + link["matchMethod"])
            seen.add(result["id"])
    local = []
    transitions = Counter()
    for unit in candidate["units"]:
        row = base[unit["unitId"]]
        linked = links.get(unit["unitId"], [])
        for field in VOTES:
            if sum(by_result[x["reportingUnitId"]][field] for x in linked) != row[field]:
                raise ValueError("Mapped result votes drift")
        exact = sum(x["matchMethod"] == "exact_official_ward_key" for x in linked)
        if exact != row["exactSourceUnitCount"] or len(linked) - exact != row["canonicalSourceUnitCount"]:
            raise ValueError("Mapped result method drift")
        available = row["demographicMatchMethod"] != "unavailable"
        profile = {key: row[field] for key, field in FIELD_MAP.items()} if available else None
        if profile is not None:
            validate_profile(profile)
        allocation = unit["profile"]
        delta = {key: allocation[key] - profile[key] for key in FIELDS} if profile is not None and allocation is not None else None
        shares = {key: 100 * (allocation[key] / allocation[FIELDS[0]] - profile[key] / profile[FIELDS[0]]) for key in GROUPS} if profile and allocation and profile[FIELDS[0]] and allocation[FIELDS[0]] else None
        transitions[row["demographicMatchMethod"] + " -> " + unit["status"]] += 1
        local.append({"unitId": unit["unitId"], "countyFips": unit["countyFips"], "name": row["precinctName"],
                      "admittedMethod": row["demographicMatchMethod"], "admittedProfile": profile,
                      "candidateStatus": unit["status"], "candidateProfile": allocation, "delta": delta,
                      "groupShareDeltaPp": shares, "sourceBlockCount": unit["sourceBlockCount"],
                      "unresolvedTouchingBlockCount": unit["unresolvedTouchingBlockCount"],
                      "mappedVotes": sum(row[f] for f in VOTES), "resultSourceUnitCount": len(linked)})
    off_map = sorted([u for u in results["reportingUnits"] if u["id"] not in seen], key=lambda u: u["id"])
    saved_residuals = {u["id"]: u for u in foundation["residualUnits"]}
    if set(saved_residuals) != {u["id"] for u in off_map}:
        raise ValueError("Admitted off-map inventory drift")
    for unit in off_map:
        if any(unit[f] != saved_residuals[unit["id"]][f] for f in VOTES):
            raise ValueError("Off-map candidate totals drift")
    admitted_profile, complete_profile, partial_profile = empty_profile(), empty_profile(), empty_profile()
    counties = {}
    for row in local:
        county = counties.setdefault(row["countyFips"], {"countyFips": row["countyFips"], "precinctCount": 0,
            "admittedProfile": empty_profile(), "candidateCompleteProfile": empty_profile(), "candidatePartialProfile": empty_profile(),
            "candidateStatusCounts": Counter(), "admittedMethodCounts": Counter()})
        county["precinctCount"] += 1
        county["candidateStatusCounts"][row["candidateStatus"]] += 1
        county["admittedMethodCounts"][row["admittedMethod"]] += 1
        if row["admittedProfile"] is not None:
            add_profile(admitted_profile, row["admittedProfile"])
            add_profile(county["admittedProfile"], row["admittedProfile"])
        if row["candidateStatus"] == "complete":
            add_profile(complete_profile, row["candidateProfile"])
            add_profile(county["candidateCompleteProfile"], row["candidateProfile"])
        elif row["candidateStatus"] == "partial":
            add_profile(partial_profile, row["candidateProfile"])
            add_profile(county["candidatePartialProfile"], row["candidateProfile"])
    return {"admittedMethodCounts": dict(sorted(Counter(row["demographicMatchMethod"] for row in rows).items())),
            "statusTransitions": dict(sorted(transitions.items())),
            "candidateStatusCounts": dict(sorted(Counter(u["status"] for u in candidate["units"]).items())),
            "comparableUnitCount": sum(r["delta"] is not None for r in local),
            "identicalUnitCount": sum(r["delta"] is not None and not any(r["delta"].values()) for r in local),
            "changedUnitCount": sum(r["delta"] is not None and any(r["delta"].values()) for r in local),
            "recoveredCompleteUnitCount": sum(r["admittedProfile"] is None and r["candidateStatus"] == "complete" for r in local),
            "lostCompleteUnitCount": sum(r["admittedProfile"] is not None and r["candidateStatus"] != "complete" for r in local),
            "composition": {"censusSourceProfile": candidate["sourceProfile"], "admittedAllocatedProfile": admitted_profile,
                            "candidateCompleteProfile": complete_profile, "candidatePartialProfile": partial_profile,
                            "candidateUnallocatedProfile": candidate["unavailableProfile"]},
            "counties": sorted(counties.values(), key=lambda c: c["countyFips"]),
            "mappedVotes": sum(r["mappedVotes"] for r in local),
            "admittedDemographicallyAvailableMappedVotes": sum(r["mappedVotes"] for r in local if r["admittedProfile"] is not None),
            "candidateCompleteMappedVotes": sum(r["mappedVotes"] for r in local if r["candidateStatus"] == "complete"),
            "offMapUnitCount": len(off_map), "offMapVotes": sum(u["totalVotes"] for u in off_map),
            "offMapTypes": dict(sorted(Counter(u["type"] for u in off_map).items())),
            "offMapUnits": [{k: u[k] for k in ["id", "countyFips", "name", "type", *VOTES, "totalVotes"]} for u in off_map],
            "local": local}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--verify", action="store_true")
    parser.add_argument("--reverse", action="store_true")
    parser.add_argument("--normalized", action="store_true")
    args = parser.parse_args()
    output = ROOT / "docs/review/v0.29d1-michigan-normalization" if args.normalized else OUTPUT
    registry = read_json("data-sources/michigan/v029d1-normalization-sources.json" if args.normalized else "data-sources/michigan/v029d-candidate-sources.json")
    for path, expected in registry["files"].items():
        with (ROOT / path).open("rb") as source:
            if hashlib.file_digest(source, "sha256").hexdigest() != expected:
                raise ValueError("Source checksum drift: " + path)
    print("All archives, extracted members, geometry, and admitted result evidence verified.", flush=True)
    geometry = read_json("work/mi-2024-source/mi-2024-precincts.geojson")
    if geometry["crs"]["properties"]["name"] != "urn:ogc:def:crs:OGC:1.3:CRS84":
        raise ValueError("Expected original CRS84 precinct geometry")
    normalization = None
    if args.normalized:
        from lib.michigan_normalization import GRID, normalize_map, validate_flint_resolution, verify_source_attributes
        native = []
        for path in registry["nativePages"]:
            page = read_json(path)
            if page["crs"]["properties"]["name"] != "EPSG:3078":
                raise ValueError("Expected native EPSG:3078 source")
            native.extend(page["features"])
        verify_source_attributes(native, geometry["features"])
        overrides = validate_flint_resolution(native, registry["flintEffectiveCycleReview"])
        normalized, normalization = normalize_map(list(reversed(native)) if args.reverse else native, read_json(registry["layerMetadata"]))
        terrain = DiagnosticMap(normalized, precision_grid=GRID, vintage_overrides=overrides)
        for overlap in terrain.audit["positiveAreaOverlaps"]:
            overlap["areaSquareMetres"] = overlap.pop("areaSquareDegrees")
        terrain.audit["coordinateReferenceSystem"] = "EPSG:3078"
        terrain.audit["repairPolicy"] = "Versioned native source-tolerance normalization precedes this gate; unresolved conflicts remain quarantined"
    else:
        terrain = DiagnosticMap(list(reversed(geometry["features"])) if args.reverse else geometry["features"])
    print(f"Map gate: {len(terrain.audit['invalidUnits'])} invalid units; {len(terrain.audit['positiveAreaOverlaps'])} overlaps; {len(terrain.quarantine)} quarantined targets.", flush=True)
    by_record, blocks = {}, {}
    with (ROOT / "work/mi-2024-source/pl94/migeo2020.pl").open(encoding="utf8", newline="") as source:
        for f in csv.reader(source, delimiter="|"):
            if f[2] != "750" or f[12] != "26":
                continue
            if f[9] != f[12] + f[14] + f[32] + f[34] or f[7] in by_record or f[9] in blocks:
                raise ValueError("Invalid or duplicate block source identity")
            block = {"blockGeoid": f[9], "countyFips": f[12] + f[14], "internalPoint": [float(f[93]), float(f[92])], "profile": None}
            by_record[f[7]] = block
            blocks[f[9]] = block
    with (ROOT / "work/mi-2024-source/pl94/mi000022020.pl").open(encoding="utf8", newline="") as source:
        for f in csv.reader(source, delimiter="|"):
            if f[4] not in by_record:
                continue
            block = by_record[f[4]]
            if f[3] != "02" or block["profile"] is not None:
                raise ValueError("Duplicate or invalid P4 record")
            block["profile"] = dict(zip(FIELDS, [int(f[76]), int(f[77]), int(f[80]), int(f[81]), int(f[83]), sum(int(f[i]) for i in [82, 84, 85, 86])]))
            validate_profile(block["profile"])
    if not blocks or any(b["profile"] is None for b in blocks.values()):
        raise ValueError("Missing block P4")
    transform = Transformer.from_crs("EPSG:4269", "EPSG:3078" if args.normalized else "OGC:CRS84", always_xy=True)
    transform.transform(-85, 43)
    operation = transform.get_last_used_operation()
    if args.normalized and (transform.source_crs.datum != transform.target_crs.datum or operation.to_proj4() != registry["blockProjectionPipeline"]):
        raise ValueError("Unreviewed native NAD83 projection")
    if not args.normalized and (operation.to_proj4() != "+proj=noop" or operation.accuracy != 4):
        raise ValueError("Unexpected NAD83-to-WGS84 transformation; review required")
    ogr.UseExceptions()
    dataset = ogr.Open(str(ROOT / "work/v029d/blocks/tl_2020_26_tabblock20.shp"))
    layer = dataset.GetLayer(0)
    if layer.GetSpatialRef().GetAuthorityCode(None) != "4269":
        raise ValueError("Expected Census NAD83 block geometry")
    records, seen = [], set()
    # Reversing source processing is deliberately independent of canonical output sorting.
    features = list(layer) if args.reverse else layer
    iterable = reversed(features) if args.reverse else features
    for feature in iterable:
        geoid = feature.GetField("GEOID20")
        if geoid not in blocks or geoid in seen:
            raise ValueError("Unknown or duplicate block geometry")
        seen.add(geoid)
        block = blocks[geoid]
        geom = shapely.from_wkb(bytes(feature.GetGeometryRef().ExportToWkb()))
        geom = shapely.transform(geom, transform.transform, interleaved=False)
        point = transform.transform(*block["internalPoint"])
        records.append(terrain.allocate(block, geom, point))
        if len(records) % 25000 == 0:
            print(f"Diagnosed {len(records):,} / {len(blocks):,} blocks", flush=True)
    for geoid in sorted(set(blocks) - seen):
        records.append(terrain.allocate(blocks[geoid], None, None))
    records.sort(key=lambda r: r["blockGeoid"])
    candidate = summarize_records(terrain, records)
    foundation = read_json("public/data/mi/2020/precinct-demographics.json")
    expected = {key: foundation["totals"]["statewideDemographics"][field] for key, field in FIELD_MAP.items()}
    if candidate["sourceProfile"] != expected:
        raise ValueError("Full block source profile differs from admitted statewide Census totals")
    candidate.update(schemaVersion="sandbox-michigan-demographic-diagnostic-v1", artifactId=registry["id"],
                     admission={"status": "rejected", "migrationAuthorized": False, "reason": "Source map fails topology admission; diagnostic evidence is not a v0.29A bundle"},
                     engine={"name": "indexed-geos-conservative-diagnostic-v1", "shapely": shapely.__version__, "geos": shapely.geos_version_string, "pyproj": pyproj.__version__},
                     coordinateNormalization={"from": "EPSG:4269", "to": "OGC:CRS84", "operation": operation.description,
                                              "pipeline": operation.to_proj4(), "accuracyMetres": operation.accuracy,
                                              "limitation": "4-metre datum-operation accuracy; no sub-metre boundary accuracy is claimed"},
                     sources=registry["files"], mapAudit=terrain.audit,
                     limitations=["Diagnostic only: not an admitted PrecinctDemographicBundle or runtime replacement.",
                                  "Partial units contain only allocated evidence; null means unavailable, never zero population.",
                                  "Complete means no unresolved source block touches the unit under this diagnostic; it is not legal-boundary or runtime admission.",
                                  "Quarantined targets never receive population. Invalid footprints are normalized only to conservatively exclude intersecting blocks.",
                                  "No split population or housing evidence is available; no area weighting or registered-voter splitting is used.",
                                  "Whole-block containment precedes in-block Census internal points. Any ambiguous or quarantined intersection is unavailable.",
                                  "2020 VAP is not 2024 eligibility or citizenship. No individual behavior or candidate preference is inferred."])
    report = compare(candidate, foundation, read_json("data-sources/michigan/2024-precinct-crosswalk.json"), read_json("public/data/mi/2024/reporting-units.json"))
    report.update(schemaVersion="mi-demographic-candidate-comparison-v1", scope={"statewide": True, "countyCount": 83, "precinctCount": 4340},
                  verdict={"decision": "retain_existing_michigan_foundation", "migrationAuthorized": False,
                           "strictlyBetterEvidenceDemonstrated": False, "nextRequirement": "Review source map topology before an admitted statewide candidate can be compiled"})
    if args.normalized:
        candidate["coordinateNormalization"] = {"from": "EPSG:4269", "to": "EPSG:3078", "operation": operation.description,
            "pipeline": operation.to_proj4(), "accuracyMetres": None if operation.accuracy < 0 else operation.accuracy,
            "limitation": "Same-datum NAD83 projection; PROJ reports operation accuracy as unavailable. Native source grid and tolerance are computational metadata, not source boundary accuracy."}
        candidate["geometryNormalization"] = {k: v for k, v in normalization.items() if k not in ("units", "overlaps")}
        candidate["effectiveCycleReview"] = registry["flintEffectiveCycleReview"]
        candidate["admission"]["reason"] = "Unresolved Sturgis source overlap; normalized diagnostic is not a v0.29A bundle"
        candidate["limitations"].append("Bounded ambiguous overlap strips are excluded from both targets; the Sturgis pair remains quarantined. Flint's raw 2023 attribute is preserved with a documented effective-cycle interpretation.")
        previous = read_json("docs/review/v0.29d-michigan-comparison/candidate.json")
        previous_by_id = {u["unitId"]: u for u in previous["units"]}
        report["previousDiagnostic"] = {"artifactId": previous["artifactId"],
            "statusTransitions": dict(sorted(Counter(previous_by_id[u["unitId"]]["status"] + " -> " + u["status"] for u in candidate["units"]).items())),
            "allocatedBlockDelta": candidate["allocatedBlockCount"] - previous["allocatedBlockCount"],
            "allocatedProfileDelta": {f: candidate["modeledProfile"][f] - previous["modeledProfile"][f] for f in FIELDS}}
        report["verdict"]["nextRequirement"] = "Resolve City of Sturgis Precinct 2 / Sturgis Township Precinct 1 source overlap before admission; review partial-unit and source-vintage limitations before any migration"
    trace = {"schemaVersion": "mi-demographic-diagnostic-trace-v1", "artifactId": registry["id"], "blocks": records}
    candidate_bytes, trace_bytes = encoded(candidate), encoded(trace)
    trace_gzip = gzip.compress(trace_bytes, compresslevel=9, mtime=0)
    report["fingerprints"] = {"candidate": fingerprint(candidate_bytes), "trace": fingerprint(trace_bytes), "traceGzip": fingerprint(trace_gzip)}
    report["bytes"] = {"candidate": len(candidate_bytes), "trace": len(trace_bytes), "traceGzip": len(trace_gzip), "admittedRuntime": (ROOT / "public/data/mi/2020/precinct-demographics.json").stat().st_size}
    outputs = {"candidate.json": candidate_bytes, "block-trace.json.gz": trace_gzip, "comparison.json": encoded(report)}
    if normalization is not None:
        outputs["normalization-audit.json"] = encoded(normalization)
    if not args.verify:
        output.mkdir(parents=True, exist_ok=True)
    for name, content in outputs.items():
        if args.verify:
            if (output / name).read_bytes() != content:
                raise ValueError("Reproduction differs: " + name)
        else:
            (output / name).write_bytes(content)
    print(json.dumps({"verified": args.verify, "blocks": candidate["sourceBlockCount"], "allocatedBlocks": candidate["allocatedBlockCount"],
                      "unavailableBlocks": candidate["unavailableBlockCount"], "sourceVap": candidate["sourceProfile"][FIELDS[0]],
                      "modeledVap": candidate["modeledProfile"][FIELDS[0]], "unavailableVap": candidate["unavailableProfile"][FIELDS[0]],
                      "statusCounts": report["candidateStatusCounts"], "transitions": report["statusTransitions"],
                      "offMapVotes": report["offMapVotes"], "fingerprints": report["fingerprints"]}, indent=2), flush=True)


if __name__ == "__main__":
    main()
