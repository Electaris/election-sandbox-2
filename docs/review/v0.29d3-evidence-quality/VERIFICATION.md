# v0.29D.3 verification

Date: 2026-09-08. Package version: 0.29.6.

| Check | Result |
|---|---|
| New evidence-review Python tests (`npm run test:v029d3:review`) | 8 passed |
| Focused Node contract, reference compiler, PA comparison, MI candidate/normalization, and Sturgis review suites | 39 passed |
| Review generation with pinned inputs | Both artifacts generated |
| Reverse-input byte reproduction (`npm run data:v029d3:review -- --verify --reverse`) | Both artifacts identical |
| Full ESLint (`npm run lint`) | Passed |
| TypeScript and production build (`npm run build`) | Passed; existing large-chunk advisory remains |
| Tracked whitespace check (`git -c core.safecrlf=false diff --check`) | Passed |

The new tests verify foreign-only exposure without reassignment or relabeling; shared-block conservation; zero-VAP group reconciliation; rejection of duplicate blocks/targets, unknown targets, cross-county allocation, and profile drift; exact positive-block inventory; all partial and regression rows; county exposure; every Flint Township contributing block; and source/runtime SHA-256 pins.

The six focused Node files are `precinct-demographic-artifact.test.mjs`, `reference-precinct-demographic-compiler.test.mjs`, `pennsylvania-candidate-comparison.test.mjs`, `michigan-candidate-comparison.test.mjs`, `michigan-normalization-comparison.test.mjs`, and `sturgis-source-review.test.mjs`. They independently reconstruct prior candidate profiles and preserve mapped/off-map election evidence.

No runtime source, demographic artifact, earlier candidate, normalization policy, or source geometry was edited in this phase. The all-model/replay and browser suites were not rerun; integrated three-state verification remains subsequent work. No human study, deployment, public-delivery approval, or source-owner contact occurred.
