# v0.29D.1 verification

Date: 2026-09-08

## Passed checks

- 35 of 35 focused Node contract, reference compiler, Pennsylvania comparison, and both Michigan comparison tests.
- 18 of 18 Python tests: 11 existing diagnostic geometry/comparison tests and seven normalization tests.
- Complete normalized statewide reproduction with reversed native target input and reversed source-block processing: all four output files match byte for byte, including the per-target normalization audit.
- Original v0.29D statewide reproduction after the shared compiler changes: original candidate, comparison, and trace bytes remain identical.
- All pinned source files and admitted Michigan artifacts match their checksums. Native attributes and identities match the earlier export after the two allowed ArcGIS aliases.
- Both complete statewide traces independently reconstruct every precinct profile and all six source, allocated, and unavailable group totals. All 254,730 unique blocks and 83 counties are present; no quarantined target receives a block.
- The normalized gate has zero invalid polygons, one unresolved overlap, and two quarantined targets. The audit records all 4,340 source and normalized geometry fingerprints and exactly six bounded exclusions.
- Tests reject material geometry repairs, collapsed targets, source precision drift, duplicate identities, source-attribute drift, and unreviewed Flint property changes. A tolerance-bounded strip is excluded from both polygons; a larger overlap remains and quarantines both targets. Reversing input preserves the same geometry decisions.
- All 74 off-map units and each candidate total remain unchanged, as do every precinct's mapped votes, admitted profile, and runtime source hashes. Actual-data comparison tests reject election-total tampering.
- The generic v0.29A bundle reader rejects both diagnostic artifacts. Partial profiles and unavailable nulls remain distinguishable.
- Full ESLint and TypeScript/Vite production build pass. Vite retains its existing large-chunk warning.
- Frontend at `http://127.0.0.1:4173/app/` returns HTTP 200 on the existing listener.

The aggregate model/replay test suite and browser suite were not rerun. HTTP availability is a startup check, not a new visual or interaction acceptance pass. The map admission gate intentionally remains rejected; passing tests verify that rejection and the diagnostic accounting.

## Commands

```bash
npm run data:v029d1:mi
npm run data:v029d1:mi -- --verify --reverse
npm run data:v029d:mi -- --verify
npm run test:v029d1:geometry
npm run test:v029d:geometry
node --experimental-strip-types --test tests/precinct-demographic-artifact.test.mjs tests/reference-precinct-demographic-compiler.test.mjs tests/pennsylvania-candidate-comparison.test.mjs tests/michigan-candidate-comparison.test.mjs tests/michigan-normalization-comparison.test.mjs
npm run lint
npm run build
git diff --check
```

## Frozen file identities

| Output | SHA-256 |
|---|---|
| Candidate | 78f4ea07490427bef2f4cfc9c6f7a8fc794074fbfee8dbe70e49093ec6d1acee |
| Comparison | a3b2e0dd9a9af5a81200025dcb9f4608685a25b455eeec1502d863a4be664cc3 |
| Uncompressed trace | 84554b05a72276da805018a2d51ec4a115ed353fedfc91b4cd4041e672a62edc |
| Compressed trace | 0c1dfe8ca21de68b4d2d07f9eea2cca42290b42d1a5ebd5dd582c46f58a8e009 |
| Normalization audit | 60af4f3ea3b299f5ec95043d64cd24b89d0f39927fa97d44b9bb204903a37db1 |

Hashes cover canonical diagnostic file bytes including their final newline; gzip has a fixed zero timestamp. They are not universal bundle fingerprints. Source cache prerequisites and the exact GIS environment are described in [REPRODUCE.md](REPRODUCE.md).

## Admission result

**Rejected / retain the existing Michigan foundation.** One source overlap remains between City of Sturgis Precinct 2 and Sturgis Township Precinct 1. The correction audit and comparison are complete; an admitted statewide candidate and any migration still require further source evidence and review.
