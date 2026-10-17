# v0.29B verification: Reference spatial compiler

Date: 2026-08-29

## Release boundary

This gate verifies a headless deterministic compiler against a bounded synthetic fixture. It does not process a production state, migrate the current runtime, infer individual behavior, or alter the application result.

## Verified laws

- Whole containment, Census internal point, population split, and housing split all emit admitted v0.29A records.
- Every source, allocation, map-unit, method, and statewide five-group VAP vector reconciles exactly.
- Split weights are reduced exact rational values and equivalent ratios produce byte-identical output.
- Input block, map-unit, and evidence-point ordering cannot change compiler bytes or fingerprints.
- Zero-information overlaps remain unavailable and never fall back to raw area.
- Cross-county points remain unavailable and never paint population into another county.
- Invalid source geometry remains in the unavailable profile; invalid map geometry fails the build.
- Overlapping map units, duplicate identities, unsupported CRS, unsupported transform versions, invented split bases, fractional weights, and out-of-block evidence points fail closed.
- Source checksum drift changes evidence identity without changing population arithmetic.
- The checked compiler artifact round-trips byte-identically through generic bundle admission.
- The compiler remains headless, deterministic, candidate-blind, and UI-free.

## Frozen evidence

```text
artifact  sha256:0e18b49ba8b8e1352c5d2d72e7384d6d7990014a0f121c61ae8043c937109c96
trace     sha256:98d25c3b00c14a834c8937a9ee72eda804cd46216a380cf80ab8b5190f9cf96b
bundle    sha256:fd535fa04e7905f0141d9a9a327bae9be8b411e7ea63c2c012de12d8c2a53bc4
```

## Results

- Focused v0.29B compiler tests: 13 of 13 passed.
- Combined v0.29A contract and v0.29B compiler tests: 21 of 21 passed.
- Aggregate model, compiler, data-contract, replay, reducer, worker, national composition, and analytics tests: 269 of 269 passed in 986,891.7531 ms.
- TypeScript passed.
- Full ESLint passed.
- Vite production build passed.
- Checked compiler artifact regenerated with byte-identical fingerprints.
- The existing deck.gl chunk-size warning remains informational.

## Verification commands

```bash
npm run data:v029b:reference
node --experimental-strip-types --test tests/reference-precinct-demographic-compiler.test.mjs
node --experimental-strip-types --test tests/precinct-demographic-artifact.test.mjs tests/reference-precinct-demographic-compiler.test.mjs
npm test
npm run lint
npm run build
git diff --check
```
