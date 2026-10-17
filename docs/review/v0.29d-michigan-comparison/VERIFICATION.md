# v0.29D verification

Date: 2026-09-07

## Passed gates

- 31 of 31 Node contract, reference-compiler, Pennsylvania comparison, and Michigan comparison tests passed.
- 11 of 11 Python diagnostic geometry and actual-data comparison tests passed.
- All raw archives, consumed members, original precinct geometry, admitted demographics, and result linkage files matched pinned checksums.
- Full statewide reproduction with reversed target input and reversed block processing produced byte-identical candidate JSON, comparison JSON, and compressed full trace.
- Every one of 254,730 source blocks is unique and retains its full six-cell profile. All 83 counties are present. All groups reconcile exactly through allocated and unavailable evidence, and every unit profile reconstructs from the trace.
- No allocated block crosses county identity or enters a quarantined unit. Partial and unavailable units remain distinguishable; unavailable profiles and comparisons are null.
- Geometry tests cover containment, Census internal points, unsupported splits, tiny positive overlaps, self-intersections, stale vintage, ambiguous boundary points, county conflicts, invalid/out-of-block source evidence, and input-order independence.
- Actual-data tests reject mapped-vote and off-map candidate-total tampering. All 74 residual identities and their candidate totals remain identical to the admitted runtime inventory.
- The diagnostic is rejected by the generic v0.29A bundle reader. Existing reference-compiler fingerprints and Pennsylvania comparison tests remain green.
- Full ESLint, TypeScript, and Vite production build passed. The existing large-chunk warning remains informational.
- Diff whitespace checks passed.
- Frontend started at `http://127.0.0.1:4173/app/` and returned HTTP 200. It remains on the admitted runtime data.

The full aggregate replay/model suite and browser suite were not rerun. This gate verifies headless data work and frontend startup; it does not claim a new UI acceptance pass.

## Reproduction and test commands

```bash
node scripts/run-v029d-michigan-candidate.mjs
npm run data:v029d:mi -- --verify --reverse
npm run test:v029d:geometry
node --experimental-strip-types --test tests/precinct-demographic-artifact.test.mjs tests/reference-precinct-demographic-compiler.test.mjs tests/pennsylvania-candidate-comparison.test.mjs tests/michigan-candidate-comparison.test.mjs
npm run lint
npm run build
git diff --check
```

## Frozen identities

| Output | SHA-256 |
|---|---|
| Diagnostic candidate | ed2c94740c25468bd72d404bfa450b81f6f3652f76bf9a0de5080c1135ccee13 |
| Uncompressed trace | b9dd91f239ad5a18912d3fa7750b7c79b1e112cfde62600b757e16ef32bae2dd |
| Compressed trace | 875d16ab037bf5de9900e571bda58f1e51e8509b971297d7bb06389924cfca3b |

These hashes describe diagnostic file bytes, including the final newline, rather than the universal bundle's canonical hashing scheme. The full source and dependency details are in the checked candidate and [source inventory](../../../data-sources/michigan/v029d-candidate-sources.json).

## Admission result

**Rejected / retain existing Michigan foundation.** Twenty invalid polygons, 27 overlap pairs, and the stale-vintage precinct fail source admission. The full diagnostic comparison is complete, while the admitted statewide candidate remains blocked pending source-map review. Neither a repaired production map nor a migrated demographic foundation was created.
