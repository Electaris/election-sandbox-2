# v0.27B verification: Geographic third-party behavior

Date: 2026-08-23

## Verdict

**PASS.** Geographic third-party exchange is deterministic, locally expressive, exactly conserving, and correct from reporting unit through statewide Electoral College allocation.

## Contract checks

Focused headless tests prove:

1. the allocation profile has a stable versioned identity;
2. certified local support affects where selected-candidate gains land;
3. a named candidate can earn a genuine local plurality;
4. positive and negative exchanges are input-order independent;
5. reporting-unit, county, and statewide five-bucket totals reconcile;
6. off-map units remain off-map;
7. duplicate identities and unknown profiles fail closed;
8. Stein, Oliver, aggregate Other, ties, and incomplete vectors receive honest colors;
9. third-party colors use winner-over-runner-up margin buckets rather than a single flat color;
10. statewide third-party winners retain their EV and target paths use the true current leader;
11. the scenario ledger rejects Electoral College allocations that disagree with the five-candidate plurality;
12. a balanced third-party state flip still identifies the decisive operation when Harris-Trump movement is zero;
13. election-night state, county, and unit vectors use only named votes published in the visible prefix.

The accepted legacy Pennsylvania endpoint fingerprint and compiled-stream fingerprint remain unchanged under the explicit historical allocation profile.

The full aggregate model, data, analytics, compiler, reducer, and replay suite passes 228 of 228 tests in 715.307 seconds.

## Browser check

Two focused Playwright journeys pass. One restores an extreme Pennsylvania Stein scenario, selects Philadelphia County, confirms a visible `Stein +` local readout and the named legend, then confirms that Shift remains Harris-versus-Trump movement. The second creates a statewide Stein plurality and verifies the statewide readout, separate 19 EV allocation, causal ledger, and national `226-293-19` score.

## Build checks

- ESLint passes.
- TypeScript and the production Vite build pass.
- The existing deck.gl chunk-size warning remains; v0.27B adds no renderer or map lifecycle.

## Verification commands

```bash
node --experimental-strip-types --test tests/third-party-geography.test.mjs
node --experimental-strip-types --test tests/election-replay.test.mjs
npx playwright test tests/browser/third-party-geography.spec.ts
npm test
npm run lint
npm run build
git diff --check
```
