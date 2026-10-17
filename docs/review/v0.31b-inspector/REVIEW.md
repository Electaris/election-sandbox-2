# Hybrid Premium: reading scale and inspector hierarchy

Date: 2026-10-12. Local UI phase; packaging remains `0.30.0-rc.1`.

The analysis rail now places Harris and Trump's Electoral College totals first, with the three other candidate totals below. National popular-vote composition is available through a native keyboard-accessible disclosure, closed on entry. Scenario status and copied-link feedback remain visible outside it.

The shared reading scale uses 11px metadata, 12px labels and numeric ledgers, 14px explanatory text, and 40px primary electoral totals. Inspector labels, assumption effects, majority requirements, and state consequences use this scale. Candidate selection controls have a 36px minimum height on desktop and 44px on compact screens. Focus indicators and disabled states are shared. The selected-geography ledger explicitly labels Actual, Scenario, and Change, keeps numeric columns aligned, and gives source and denominator explanations more space.

The owner's slide-up overlay dock remains collapsed on entry, with its previous Working/Expanded presets and drag behavior. The ivory surface, navy/teal interface, editorial typefaces, geographic map, party colors, and election calculations are retained.

## Verification

The immutable local candidate is `ff8fbeb8f973e277adbbd30cce2a1d10ddb744a813e407ff54152440946e7bc0`, in `outputs/0.30.0-rc.1/<content-id>/app`. The localhost preview on port 4173 serves this candidate.

- TypeScript and production build passed; the existing large-chunk advisory remains.
- Lint passed.
- Foundation retention and immutable-package verification passed: PA, MI, and WI remain on their existing foundations.
- Both new inspector cases passed against the diagnostic frontend and the exact production package: keyboard disclosure, baseline 226/312 totals, numeric/control sizing, unchanged scenario URL, and mobile page width.
- The main diagnostic run finished with 13 passed / one failed. The isolated laptop rerun passed, giving passing evidence for all 14 selected cases across the two runs: two inspector cases, six shell viewport cases, one scenario/replay/camera/dock preservation case, three three-state/keyboard/URL acceptance cases, and two integrated Election Night/Home cases. These are 14 unique cases, not 17 unique cases when duplicate reruns and production checks are counted.
- One initial 1366×768 diagnostic case reported “The three-state election-night worker could not start” and timed out waiting for Play. The trace contained no console or recorded request error explaining its cause. The isolated rerun passed without a source change. This is an intermittent startup failure observed during validation, not a proven UI defect or a proven infrastructure cause. Preserve it if it recurs; do not report the original batch as entirely green.

Screenshots are in `screenshots/`; build, lint, package, and browser logs are in `work/v031b-*.log`. No complete model-suite rerun or human usability study is claimed.

## Next phase

Polish the Swingometer's assumption editor and contributor navigation around the same reading and control scale, with clearer grouping and interaction states. Then bring Election Night's returns desk and replay controls through the corresponding visual pass. This phase does not represent completion of the entire Hybrid Premium specification or human usability acceptance.
