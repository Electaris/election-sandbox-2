# v0.28B verification: Group-specific turnout

Date: 2026-08-25

## Release boundary

This gate verifies explicit group turnout assumptions for Pennsylvania and Michigan. It does not add demographic candidate preference, forecast calibration, probability, or Wisconsin group composition.

## Required findings

- Pennsylvania and Michigan group additions reconcile exactly from group request through unit, county, state, portfolio, and replay endpoint.
- Statewide and group turnout share the same local remaining VAP capacity without over-allocation.
- Input collection order cannot change allocation.
- A changed seed or replay chronology cannot change the scenario endpoint.
- Michigan unavailable bridges and off-map units receive no invented group composition or turnout.
- Wisconsin fails closed in the model, the shared URL decoder, and the UI.
- Candidate allocation remains a separate explicit setting.
- Schema 3 round-trips every group value and schema 2 links remain compatible with zero group assumptions.
- The mobile expanded editor remains single-column and produces no document overflow.

## Results

- Focused demographic turnout model tests: 6 of 6 passed.
- Focused model and URL compatibility tests: 61 of 61 passed.
- Focused browser journeys: 3 of 3 passed.
- Aggregate model, data-contract, replay, and analytics tests: 245 of 245 passed in 1,405,538.8088 ms.
- Frozen Pennsylvania, Michigan, national composition, reducer, seek, playback, worker, and analytics fingerprints remain unchanged.
- ESLint passed.
- TypeScript and the Vite production build passed.
- The existing Vite deck.gl chunk-size warning remains informational.

## Verification commands

```bash
node --experimental-strip-types --test tests/demographic-turnout-model.test.mjs
node --experimental-strip-types --test tests/election-model.test.mjs tests/demographic-turnout-model.test.mjs
npx playwright test tests/browser/demographic-turnout.spec.ts
npm test
npm run lint
npm run build
```
