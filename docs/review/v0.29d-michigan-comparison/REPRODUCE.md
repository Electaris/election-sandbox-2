# Reproduce the Michigan diagnostic

Run from the repository root with locked Node dependencies and a Python environment containing GDAL/OGR, Shapely, and pyproj. The checked compiler used Shapely 2.1.2, the GEOS version recorded in `candidate.json`, and pyproj 3.7.2. On this workstation the npm launcher uses the existing `C:/OSGeo4W/bin/python-qgis.bat` environment. Elsewhere set `SANDBOX_GEO_PYTHON` to a configured Python executable; the fallback is `python3`.

```bash
npm run data:v029d:mi
npm run data:v029d:mi -- --verify --reverse
npm run test:v029d:geometry
node --experimental-strip-types --test tests/michigan-candidate-comparison.test.mjs
```

`--verify` compares output bytes without rewriting them. `--reverse` reverses target input and source-block processing before canonical output ordering. Outputs are fixed to this review directory: `candidate.json`, `comparison.json`, and `block-trace.json.gz`. The trace gzip has a fixed zero timestamp; fingerprints include each canonical UTF-8 file's trailing newline. These are diagnostic schema fingerprints, not v0.29A bundle fingerprints.

## Inputs

The [source registry](../../../data-sources/michigan/v029d-candidate-sources.json) lists every path and SHA-256. Place the official Census `mi2020.pl.zip` under `work/mi-2024-source/` and extract the geography and segment files into `work/mi-2024-source/pl94/`. Place the 2020 Michigan block archive under `work/v029d/tl_2020_26_tabblock20.zip` and extract it to `work/v029d/blocks/`.

The original Michigan geometry is the previously captured 48,819,142-byte `work/mi-2024-source/mi-2024-precincts.geojson`, SHA-256 `bbc331967ac5e2e1293e581bcdd9c0fa7c5c556faa1b6caaa5d984720be90c4b`. It is an original CRS84 GeoJSON export of the official service, not the application's projected/simplified map tiles. The service is mutable: a fresh export is not guaranteed to reproduce the historical bytes. Preserve this cached file for raw-source rebuilding; do not change the hash to accept a different export without source review.

All archives, consumed extracted members, geometry, admitted demographics, result crosswalk, geometry manifest, and normalized results must match their pinned hashes before processing. A source mismatch fails; an unavailable historical source is a reproducibility prerequisite, not a reason to relabel a newer source. The checked candidate and compressed trace can be verified by the Node tests without the raw statewide files or Python GIS runtime.

## Method

Read every Michigan P.L. 94-171 summary-level 750 block. Join P4 segment 2 through logical record number, validate all five nonnegative integer group cells and total VAP, and match full 15-digit block GEOIDs to original TIGER shapes. Original NAD83 geometry and Census internal points use the recorded PROJ transformation into CRS84; the expected operation has 4-metre stated accuracy and a no-op coordinate pipeline.

Audit the entire target map before allocating any blocks. Invalid surfaces and positive-area overlap partners are quarantined, as is the stale-vintage precinct. Intersections with their exclusion footprints produce unavailable block evidence. This is deliberately conservative, including boundary touches. No repaired target, raw area weight, or candidate vote field is used in demographic placement.

Every unallocated block remains in the full trace. Unresolved blocks mark touching precincts partial; a missing source geometry conservatively prevents complete status for its county. Candidate and admitted results are joined only after allocation, through the original audited result crosswalk. Exact counts, result methods, county identity, and off-map candidate totals are checked. No application artifact is emitted.
