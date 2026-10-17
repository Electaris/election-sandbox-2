# v0.28A verification: Demographic evidence and model contract

Date: 2026-08-24

## Release boundary

This gate verifies the headless evidence inventory only. No demographic control is rendered and no vote mutation is authorized.

## Required findings

- PA, MI, and WI compile into one canonical inventory regardless of input order.
- Pennsylvania statewide and modeled five-category counts reconcile exactly to their VAP denominators.
- Michigan statewide and modeled five-category counts reconcile exactly to their VAP denominators.
- Michigan preserves 4,050 direct bridges, 218 weighted splits, and 72 unavailable units.
- Wisconsin exposes 4,612,300 total VAP but correctly reports group composition unavailable across all 7,086 terrain units.
- Every state rejects CVAP, election-year eligibility, observed individual turnout, observed candidate preference, ecological inference, and vote-mutation claims.
- Partial inventories, duplicate states, unknown fields, contradictory coverage, invalid group totals, and tampering fail closed.

## Results

- Focused demographic contract tests: 6 of 6 passed in 2,070.9706 ms.
- Aggregate model, data-contract, replay, and analytics tests: 237 of 237 passed in 683,282.9417 ms.
- Frozen Pennsylvania, Michigan, national composition, reducer, seek, playback, worker, and analytics regressions remain unchanged.
- ESLint passed.
- TypeScript and the Vite production build passed.
- `git diff --check` passed. Windows line-ending notices are informational.

## Verification commands

```bash
node --experimental-strip-types --test tests/demographic-evidence-contract.test.mjs
npm test
npm run lint
npm run build
```

## Accepted warning

The existing Vite chunk-size warning remains. This headless contract adds no application bundle import and no renderer dependency.
