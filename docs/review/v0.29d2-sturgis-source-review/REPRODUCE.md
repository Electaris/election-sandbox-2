# Reproduce the Sturgis source-resolution review

The review reads the frozen v0.29D.1 candidate and trace, audits additional published geometry, and evaluates two explicitly unapproved ownership hypotheses. It does not change the source correction policy, either earlier candidate, or application data.

```bash
npm run data:v029d2:review
npm run data:v029d2:review -- --verify --reverse
npm run test:v029d2:review
node --experimental-strip-types --test tests/sturgis-source-review.test.mjs
```

Use the same Python GIS environment as v0.29D.1, with NumPy and Matplotlib additionally installed. The launcher uses `C:/OSGeo4W/bin/python-qgis.bat` on this workstation, or `SANDBOX_GEO_PYTHON` elsewhere. Its font cache stays in `work/v029d2/matplotlib-cache`. Matplotlib's SVG IDs and metadata are fixed for reproduction; the diagram explicitly exaggerates vertical scale.

## Sources and retrieval

The [source registry](../../../data-sources/michigan/v029d2-sturgis-review-sources.json) contains every consumed file's SHA-256 and the discovery URLs. The prerequisite Census and native-state source cache is documented in [v0.29D.1 reproduction](../v0.29d1-michigan-normalization/REPRODUCE.md). Preserve the exact additional files under `work/v029d2/`; the public services are mutable and a fresh response may have different bytes. Raw caches are not committed.

The city website links Experience Builder item `ecebc5569b1d46f584a647542603b0f5`, which references web map `24cbb290ee244767907389485533e990`. The county website links legacy app `8d6560c68a084badaa7120f44499075e`, whose web map is `bb0399c25cbc41cdaf33e5e3cfc6d9c4`. Both maps identify the city's precinct service. The current and legacy city-limit layers were also inspected. These are two discovery paths to city-published data, not two independent surveys.

ArcGIS item configurations use `https://www.arcgis.com/sharing/rest/content/items/{itemId}/data?f=json`; the precinct service item's metadata uses item `deb453826b424b0cb6427d434b12a0b1` with `?f=pjson` and no `/data`. Feature-layer metadata uses `?f=pjson`. Geometry queries append `/query?where=1%3D1&outFields=*&outSR=3078&f=geojson` to the registry's layer URL.

The state 2022 query selects only `PRECINCTID IN ('WP-149-76980-00001','WP-149-76960-00002')`, with `outFields=*`, `outSR=3078`, and `f=geojson`. The published precinct PDF is downloaded from the registry's city document URL. It was rendered and visually inspected; its printed date is February 3, 2012. The static PDF supplies context rather than centimetre-scale boundary evidence.

## Computation

1. Check all source, runtime, and baseline hashes. Reproduce the v0.29D.1 normalization audit exactly before any sensitivity calculation.
2. Extract only the positive-area polygon from the Sturgis overlap geometry collection. Shared line segments are not part of the disputed surface.
3. Compare that triangle with the two 2022 state features, two 2024 state features, city-published precinct 2 union, and city-limit union. Invalid surfaces in comparison sources use polygonal `make_valid` only for this source study; those comparison geometries never become allocation targets.
4. For each hypothesis, subtract the triangle from one of the two v0.29D.1 targets, while preserving all other terrain. Check the complete hypothetical map for invalid polygons and overlaps.
5. Reallocate the 202 blocks previously quarantined by the pair using their original Census geometry, internal points, and full six-cell profiles. All other trace records remain fixed. This bounded reallocation is sufficient because each hypothetical edit only removes area and the original quarantine already captured every intersecting block; no new intersection elsewhere can be created.
6. Reconstruct statewide accounting and compare every mapped and off-map election total through the original comparison checks. Both outputs are labeled as hypotheses with admission and migration unauthorized.
7. Build a separate review of all 382 baseline partial precincts, including the 14 regressions from v0.29D. Touching VAP is unresolved exposure, not ownership or an additive precinct total. Zero-VAP uncertainty does not change the baseline status.

`--reverse` reverses native input and the order in which affected blocks are processed. All six output files must match byte for byte: source review, GIS comparison geometry, hypothetical comparison, partial-evidence review, PNG, and SVG. `--verify` never rewrites them.

No fresh admitted candidate can be emitted from this review. Raw rebuilds require the pinned cache; Node tests independently reconcile the checked sensitivity outputs against the full checked baseline trace without GIS downloads.
