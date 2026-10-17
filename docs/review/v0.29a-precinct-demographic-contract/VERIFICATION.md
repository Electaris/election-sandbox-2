# v0.29A verification: Precinct demographic artifact contract

Date: 2026-08-28

## Release boundary

This gate verifies the state-independent compact election-unit artifact, complete Census-block allocation trace, and deterministic bundle admission contract.

It does not implement spatial intersection, process production state data, migrate an existing demographic foundation, or change application behavior.

## Required findings

- Each source block contains a complete five-group VAP vector that reconciles to total VAP.
- Every allocated block reconstructs its source vector exactly across target map units.
- Split targets preserve positive exact rational evidence weights with one shared denominator whose numerators sum to that denominator.
- Direct allocations carry one target and no invented split weight.
- Unavailable blocks preserve source population without a target.
- Compact unit profiles, unit provenance, allocation methods, split counts, coverage, and statewide modeled or unavailable profiles reconcile to the trace.
- Every target exists and remains inside the source block's county.
- Raw polygon-area weighting is not an admitted method.
- Demographic, geometry, and election-result source inputs carry canonical SHA-256 fingerprints and explicit vintages.
- Canonical output and fingerprints do not depend on input collection ordering.
- Unknown fields, methods, identities, fractional values, contradictory quality, ecological claims, and non-reconciling arithmetic fail closed.
- The package remains headless and contains no nondeterministic random call.

## Results

- Focused v0.29A adversarial contract tests: 8 of 8 passed on the final contract.
- Aggregate model, data-contract, replay, reducer, worker, national composition, and analytics tests: 256 of 256 passed in 592,504.3963 ms.
- TypeScript passed.
- ESLint passed.
- Vite production build passed.
- Diff integrity passed; line-ending notices are informational.
- Existing deck.gl chunk-size warning remains informational.

## Verification commands

```bash
node --experimental-strip-types --test tests/precinct-demographic-artifact.test.mjs
npm test
npm run lint
npm run build
git diff --check
```
