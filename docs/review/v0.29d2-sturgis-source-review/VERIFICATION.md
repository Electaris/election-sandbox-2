# v0.29D.2 verification

Date: 2026-09-08

## Passed checks

- 39 focused Node tests: evidence contracts, reference compiler, Pennsylvania comparison, both earlier Michigan comparisons, and four Sturgis source/sensitivity tests.
- 21 Python tests: 11 diagnostic, seven normalization, and three hypothesis-safety tests.
- Forward generation and reversed-input byte reproduction of all six review outputs, including PNG and SVG.
- All pinned raw sources, both earlier candidates, and admitted runtime inputs retain their SHA-256 identities. The v0.29D.1 normalization audit is regenerated and compared byte for byte before each sensitivity run.
- Both hypothetical maps have no invalid target polygons or remaining positive-area overlaps. Neither result is approved or admitted.
- Each hypothesis reprocesses exactly the 202 quarantined source blocks and preserves every original six-cell profile. All replacement records are identical between hypotheses.
- Independent Node reconstruction combines the full 254,730-block baseline trace with each replacement inventory and verifies statewide profiles, every unit profile/status, and exact allocated/unavailable accounting.
- Original comparison checks verify all mapped and off-map election identities and candidate totals for each hypothesis. The 74 off-map units and 142,574 votes are unchanged.
- The partial-evidence queue independently reconciles every unresolved touching block for all 382 baseline partial precincts. It preserves 14 regression identities and never upgrades a zero-VAP case.
- Unit tests reject hypothetical edits that add area, erase a target, choose an unknown target, or involve missing/duplicate identities; baseline input is never mutated.
- Generic v0.29A deserialization rejects the sensitivity schema.
- The official city PDF was rendered and inspected; the generated comparison diagram was visually inspected, with explicit vertical exaggeration and readable labels.
- TypeScript/Vite production build passes, retaining the existing large-chunk warning. The frontend at `http://127.0.0.1:4173/app/` returns HTTP 200.
- Full ESLint and tracked diff whitespace checks pass.

The aggregate model/replay suite and browser suite were not rerun. This is a source investigation and sensitivity review, not a UI acceptance pass or a successful candidate-admission decision. No source clarification was sent.

## Commands

```bash
npm run data:v029d2:review
npm run data:v029d2:review -- --verify --reverse
npm run test:v029d2:review
npm run test:v029d1:geometry
npm run test:v029d:geometry
node --experimental-strip-types --test tests/precinct-demographic-artifact.test.mjs tests/reference-precinct-demographic-compiler.test.mjs tests/pennsylvania-candidate-comparison.test.mjs tests/michigan-candidate-comparison.test.mjs tests/michigan-normalization-comparison.test.mjs tests/sturgis-source-review.test.mjs
npm run lint
npm run build
git diff --check
```

The tested plotting runtime is Matplotlib 3.11.0 with NumPy 2.4.6, alongside the v0.29D.1 GIS environment. [Reproduction instructions](REPRODUCE.md) describe the source-cache prerequisites.

## Frozen SHA-256 identities

| File | SHA-256 |
|---|---|
| source-review.json | c7f0073220f7d4ec2e9bab349185aee5da1432bcbb48aedfbc8fc97a91433b80 |
| source-comparison.geojson | 56cd434c7cf216093897dd8d468f6945a872e7247ab4027eb88e44cf26caffe2 |
| hypothetical-comparison.json | abe7c66e49be83dacdeff9edfd52cca97465ad3ed19228f43418cacfd9f7f15c |
| partial-evidence-review.json | 9b0d2b0fb334cbd1b31fb4b67017c06714dfb8f7dd6b21c1d23f774736021f82 |
| boundary-comparison.png | e50c464e2ab312fbf5ceb17ff2678621c538aee3c07fa75035e355232fe91cac |
| boundary-comparison.svg | 2c291f4400b12be478567320d422b54980aaaa8961a484acecd3cea4edc9871f |

These hash file bytes, not universal bundle objects. Admission remains unauthorized under [decision 0061](../../decisions/0061-sturgis-source-disagreement.md).
