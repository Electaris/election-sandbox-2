# Reproduce v0.29D.3

Run from the repository root:

```sh
npm run data:v029d3:review -- --verify
npm run data:v029d3:review -- --verify --reverse
npm run test:v029d3:review
```

The registry pins the original and normalized candidate, full normalized block trace, comparison, prior reviews, contract, and all three retained runtime demographic artifacts. The Census geography source is the already-pinned `work/mi-2024-source/pl94/migeo2020.pl` from the Michigan archive used in v0.29D.1. Preserve or restore that cache using the earlier reproduction instructions; `work/` is ignored. No network fetch, GIS edit, or statewide spatial allocation runs here.

The launcher uses `SANDBOX_GEO_PYTHON`, the installed OSGeo4W Python on Windows, or `python3`. The shared profile helpers currently import Shapely, so that dependency must be available even though this review performs no geometric operation. Verified environment: OSGeo4W Python 3.12 / Shapely 2.1.2.

The script reconstructs all 254,730 source-block profiles and every target allocation/touching count before reviewing them. It reads block-to-2020-VTD identifiers from the pinned Census geography file (summary level 750, VTD field 77, matching the established importer), aggregates all six source cells by VTD, and reconstructs every Flint Township candidate profile from the contributing blocks. It makes no spatial claim from a VTD identifier.

Both `evidence-review.json` and `REVIEW.md` have canonical byte verification. `--reverse` reverses trace, candidate, original, and comparison collection order before generation; outputs must remain byte-identical. The source registry is intentionally fixed, not silently refreshed when data drift occurs. Tests include synthetic foreign-county exposure, shared-block accounting, invalid evidence rejection, and full frozen-data conservation/provenance checks.
