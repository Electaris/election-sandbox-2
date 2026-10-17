# Reproduce the normalized Michigan diagnostic

Use the Node and Python GIS environment documented in the [original diagnostic instructions](../v0.29d-michigan-comparison/REPRODUCE.md). The checked run used Shapely 2.1.2 and pyproj 3.7.2 through `C:/OSGeo4W/bin/python-qgis.bat`. The candidate records the GEOS version and exact projection pipeline. Set `SANDBOX_GEO_PYTHON` elsewhere when needed.

```bash
npm run data:v029d1:mi
npm run data:v029d1:mi -- --verify --reverse
npm run test:v029d1:geometry
npm run test:v029d:geometry
node --experimental-strip-types --test tests/precinct-demographic-artifact.test.mjs tests/reference-precinct-demographic-compiler.test.mjs tests/pennsylvania-candidate-comparison.test.mjs tests/michigan-candidate-comparison.test.mjs tests/michigan-normalization-comparison.test.mjs
```

The normalized flag writes only `candidate.json`, `comparison.json`, `block-trace.json.gz`, and `normalization-audit.json` in this review directory. The original `data:v029d:mi` command and original output bytes remain unchanged. `--verify` compares without rewriting; `--reverse` independently reverses source-block processing and native target input before canonical ordering. Gzip uses a zero timestamp.

## Required inputs

The [normalization source registry](../../../data-sources/michigan/v029d1-normalization-sources.json) pins the original statewide inputs plus five native-coordinate pages, layer metadata, the Flint evidence PDF, the Sturgis curve investigation response, and the earlier candidate. All file hashes are checked before allocation. The reviewed Flint property digest is checked separately; native attributes must match the historical export.

The five pages were retrieved from the registry's official native query URL with offsets 0, 1000, 2000, 3000, and 4000, ordered by OBJECTID, with `outSR=3078`, `outFields=*`, and `resultRecordCount=1000`. Their filenames are `work/v029d1/native-0000.geojson` through `native-4000.geojson`. Metadata is the layer URL with `?f=pjson`, saved as `official-layer.json`. The registry records the Flint PDF URL and exact cached path.

For the investigative response, query the same layer with `where=PRECINCTID IN ('WP-149-76980-00001','WP-149-76960-00002')`, `outFields=*`, `outSR=3078`, `returnTrueCurves=true`, and `f=pjson`; the cached file is `work/v029d1/sturgis-true-curves.json`.

These services are mutable. A fresh request may not reproduce the pinned bytes; preserve the reviewed cache. Raw source files under `work/` are not checked into the repository, so a raw rebuild requires that cache or byte-identical downloads. Do not update hashes merely to accept a new response. The checked candidates, audits, and compressed traces can be independently reconciled with the Node tests without raw GIS inputs.

## Deterministic method

Normalization is implemented in `scripts/lib/michigan_normalization.py`; allocation and comparison remain in the shared diagnostic compiler. See [the policy and source interpretation](COMPARISON.md). All overlap decisions are geometric containment within both boundary-tolerance buffers, not a global area threshold. Exclusions are simultaneous and independent of feature order. The final map gate still rejects the remaining positive-area conflict.

The registry binds the exact NAD83 projection pipeline. An unexpected datum or operation fails before processing blocks. Source resolution applies to reviewed target geometry; Census block coordinates and internal points are projected without artificially snapping them to the target grid. Full block records preserve unavailable profiles, county identity, methods, and affected targets. No election results participate in demographic placement.
