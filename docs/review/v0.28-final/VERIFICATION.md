# v0.28 final verification: Demographic behavior

Date: 2026-08-26

## Release boundary

This gate completes v0.28A through v0.28D: evidence contracts, group-specific turnout, candidate-complete choice for newly added group ballots, and exact contribution and bounded sensitivity explanation.

It does not add observed group preference, Census-block reconstruction, voter-file inference, survey calibration, prediction, probability, or Wisconsin group composition.

## Required findings

- Pennsylvania and Michigan group turnout reconciles exactly through admitted local VAP capacity.
- Custom group candidate shares contain Harris, Trump, Stein, Oliver, and residual Other/write-in and sum to exactly 100 percent.
- Custom choice applies only to new ballots created by the same group-turnout assumption.
- Certified ballots are never assigned a demographic identity.
- Groups without a custom vector retain the visible shared Harris-Trump added-ballot split.
- Candidate totals reconcile exactly at group, unit, county, state, national, and Election Night endpoint levels.
- Wisconsin rejects both group turnout and custom group preference rather than inventing composition.
- Scenario URL schema 4 round-trips custom vectors while schemas 2 and 3 remain compatible.
- Contribution rankings use exact accepted unit records and disclose clipping, unavailable coverage, and off-map ballots.
- Sensitivity is deterministic Harris-minus-Trump arithmetic per 1,000 added ballots, not probability or forecast.
- Later preference and third-party operations remain separate and explicitly ordered.

## Results

- Focused demographic, model, URL, and scenario-ledger tests: 73 of 73 passed.
- Focused demographic browser journeys: 5 of 5 passed in 56.1 seconds.
- Candidate-complete browser journey, including Election Night initialization from the same schema-4 recipe: 1 of 1 passed on final isolation rerun.
- Aggregate model, data-contract, replay, reducer, worker, national composition, and analytics tests: 248 of 248 passed in 636,135.4888 ms.
- ESLint passed.
- TypeScript and the Vite production build passed.
- `git diff --check` passed; line-ending notices are informational.
- The existing Vite deck.gl chunk-size warning remains informational.

## Verification commands

```bash
node --experimental-strip-types --test tests/demographic-turnout-model.test.mjs tests/election-model.test.mjs tests/scenario-delta-ledger.test.mjs
npx playwright test tests/browser/demographic-turnout.spec.ts
npm test
npm run lint
npm run build
git diff --check
```
