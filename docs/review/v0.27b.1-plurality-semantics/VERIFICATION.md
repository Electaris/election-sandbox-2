# v0.27B.1 verification: Five-candidate dock semantics

Date: 2026-08-23

## Result

PASS.

The reviewed Stein-leading Pennsylvania scenario is consistent across the Swingometer, the persistent 3D map, the completed 20,499-return Election Night replay, and every dock panel.

## Verified behavior

- Contributors states `Pennsylvania changes from Trump to Stein`.
- The decisive delta and ranked geography use Stein vote change.
- Philadelphia is identified from exact geographic Stein gains rather than an H-T rounding artifact.
- Election Night finishes with Pennsylvania reporting a Stein plurality.
- The Live state card, right-side desk, Returns summary, and Timeline visible-prefix readout agree.
- The primary timeline plots Harris, Trump, Stein, Oliver, and Other/write-in reported shares.
- Return-tape primary text uses the local return plurality and carries the complete five-candidate vector through the worker protocol.
- H-T movement remains available only under explicit H-T wording.
- The Electoral College desk exposes five candidate targets and five separate EV totals.
- A Stein-targeted shared URL restores Stein, credits Pennsylvania's 19 EV to Stein, reports 251 EV still needed, and computes deterministic mathematical routes against the strongest opponent in every state.
- The state-flip card recognizes that Stein already leads Pennsylvania while Harris and Trump retain their own independent requirements.
- Reporting velocity, state comparison, chronology controls, assumptions, provenance, and the candidate ledger retain their intended semantics.
- Drawer expansion, seek behavior, chart disposal, mobile layout, and return to the same mounted map remain intact.

## Gates

```text
npm test
228 / 228 passed
duration 852.032 s

npx playwright test tests/browser/third-party-geography.spec.ts
3 / 3 passed (including the Stein-targeted Electoral College and Path to 270 journey)

npx playwright test tests/browser/replay-experience.spec.ts -g "Election Night runs"
1 / 1 passed

npm run lint
passed

npm run build
passed
```

The existing Vite warning for the lazy deck.gl Atlas chunk remains accepted and unchanged.
