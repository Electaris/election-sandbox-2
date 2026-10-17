# v0.29C verification: bounded Pennsylvania comparison

Date: 2026-09-07

## Results

- 28 of 28 combined v0.29A contract, v0.29B compiler, and v0.29C comparison tests passed (seven new comparison tests).
- Original Census archives and consumed extracted members passed pinned SHA-256 verification. Re-running preparation reproduced the frozen normalized input hash exactly.
- The candidate was compiled from 3,879 real source blocks and 50 VTDs. All five groups and VAP agree with the admitted foundation at every VTD.
- 3,837 blocks / 81,671 VAP use whole-block containment; 42 blocks / 1,334 VAP use Census internal points. No split, unavailable, or cross-county population.
- Reversing every block and target-unit input regenerated the bundle, comparison JSON, and Markdown report byte-identically. Comparison tests also reverse admitted rows, result rows, crosswalk rows, and link order.
- The complete trace round-trips through generic contract validation. Every original block profile and block identity matches the pinned normalized source.
- Tampered demographic evidence, cross-county allocation, altered result votes, invalid match methods, duplicate result linkage, and missing terrain fail. Unavailable comparison units retain null profiles and null differences, rather than zero or an exact-match claim.
- The native NAD83 extension preserves the frozen v0.29B synthetic result. Unsupported projected CRS still fails.
- Full ESLint passed.
- TypeScript and Vite production build passed. The existing large-chunk warning remains.
- Diff whitespace checks passed.
- The admitted Pennsylvania demographic artifact, results, geometry manifest, and crosswalk still match their pre-comparison hashes. No application data, runtime import, behavior control, or result was migrated by this chapter.

This gate is scoped to the headless data comparison. The full aggregate replay/model suite and browser suite were not rerun; the earlier v0.29B results remain historical evidence. No new UI or browser behavior is claimed.

## Commands executed

```bash
npm run data:v029c:prepare
npm run data:v029c:pa
npm run data:v029c:pa -- --verify --reverse
node --experimental-strip-types --test tests/precinct-demographic-artifact.test.mjs tests/reference-precinct-demographic-compiler.test.mjs tests/pennsylvania-candidate-comparison.test.mjs
npm run lint
npm run build
git diff --check
```

## Frozen identities

| Output | SHA-256 |
|---|---|
| Normalized input (uncompressed) | e5607e09d96e5811f2f3740fdcd78fab2f709dfb82cbd7c4e9bdf1cfb6ccddfe |
| Artifact | d4885494d7582a353882ac57d504dd5e36535d51948cdaa7d4f3ceab7bb579c7 |
| Trace | eafeaca56b6ff8b09f60b977f03db397fa19533182b9a97e166148135e36897a |
| Bundle | c8179739748e16b31eca412c4c6391e3f94b494bda26eafdae38f950a24ce0f4 |

The contract's canonical fingerprints exclude output-file trailing newlines. [comparison.json](comparison.json) also records consumed admitted-file hashes and byte sizes; [REPRODUCE.md](REPRODUCE.md) describes original-source and offline reproduction.

## Admission outcome

**Retain the existing VTD foundation.** Adams County proves equivalent composition and linkage with added build-time trace. It does not establish strictly better statewide evidence. No migration is authorized or performed.
