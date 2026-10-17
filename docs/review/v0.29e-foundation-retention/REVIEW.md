# v0.29E foundation admission and retention checks

**All three existing foundations pass the recorded retention checks. No replacement is admitted.**

| State | Decision | Replacement gate | Terrain units | Group composition | Baseline ballots | Off-map ballots |
|---|---|---|---:|---|---:|---:|
| MI | retain_existing | source_hold | 4340 | available | 5664186 | 142574 |
| PA | retain_existing | no_demonstrated_improvement | 9178 | available | 7058732 | 125172 |
| WI | retain_existing | not_proposed | 7086 | unavailable | 3422918 | 0 |

## MI

Retain the disclosed approximate VTD bridge. The statewide diagnostic and ownership sensitivities remain unadmitted; topology, positive evidence localization, and material boundary changes require review. Retention is not a claim of greater accuracy.

Runtime: `data/mi/2020/precinct-demographics.json`. SHA-256: `2072a732924b5b6dec8da1822bfc8e4eb042e0c3fa22a411eed8d790ae5151e0`.

Compiler reproduction: `npm run data:mi:demographics -- <migeo2020.pl> <mi000022020.pl> <mi2020.pl.zip> <official-2024-precincts.geojson>`.

Evidence: [0059-michigan-diagnostic-admission-hold.md](../../../docs/decisions/0059-michigan-diagnostic-admission-hold.md), [0060-michigan-native-normalization-hold.md](../../../docs/decisions/0060-michigan-native-normalization-hold.md), [0061-sturgis-source-disagreement.md](../../../docs/decisions/0061-sturgis-source-disagreement.md), [0062-demographic-completeness-and-retention.md](../../../docs/decisions/0062-demographic-completeness-and-retention.md), [evidence-review.json](../../../docs/review/v0.29d3-evidence-quality/evidence-review.json).

## PA

Retain the Census VTD foundation. The 50-VTD Adams pilot matches exactly; it does not establish statewide replacement quality or better election linkage.

Runtime: `data/pa/2020/vtd-demographics.json`. SHA-256: `639341193ee9b44d25a1712d2e02979f54db41a312baa7df992db44df0e790f0`.

Compiler reproduction: `npm run data:pa:demographics -- <pageo2020.pl> <pa000022020.pl> <pa2020.pl.zip>`.

Evidence: [0058-pennsylvania-candidate-comparison.md](../../../docs/decisions/0058-pennsylvania-candidate-comparison.md), [0062-demographic-completeness-and-retention.md](../../../docs/decisions/0062-demographic-completeness-and-retention.md), [comparison.json](../../../docs/review/v0.29c-pennsylvania-comparison/comparison.json).

## WI

Retain the LTSB 2020 VAP denominator aggregated to January 2025 wards and the disclosure that ward election values are reconstructed. Compatible five-group composition remains unavailable; no replacement comparison was conducted.

Runtime: `data/wi/2020/ward-demographics.json`. SHA-256: `ea77ada6a292fcd3c468c06a9ea2042c7d6dbe39fc05befc3613910202e8f575`.

Compiler reproduction: `npm run data:wi`.

Evidence: [0026-wisconsin-ltsb-admission.md](../../../docs/decisions/0026-wisconsin-ltsb-admission.md), [0062-demographic-completeness-and-retention.md](../../../docs/decisions/0062-demographic-completeness-and-retention.md).

## What this check establishes

Pinned runtime artifacts, all 222 county map files, source registries, geometry manifests, compiler inputs, and review evidence match the retention decision. Actual runtime adapters decode the artifacts. The zero-change scenario preserves every model unit and reproduces both certified detailed totals and the national baseline. Off-map votes reconcile separately. A group-turnout probe verifies PA/MI capability and Wisconsin's explicit rejection of unsupported group assumptions.

This is an offline build-time check. It does not contact sources, reconstruct raw imports, certify boundaries, infer voter preferences, enable new capabilities, or migrate runtime data. Full source reproduction remains documented in the pinned state-specific compiler configuration. Michigan's candidate and Sturgis sensitivities remain held; Pennsylvania's comparison is Adams-only; Wisconsin has no replacement proposal.

## Replacement admission path

A replacement requires a reviewed source inventory and compiler configuration, a validated v0.29A artifact plus trace, conserved county-bounded allocation, comparison against the retained foundation, resolution of source/quality holds, and an explicit decision bound to the candidate fingerprints. Its runtime adapter and capabilities must then pass integrated tests. Changing a status flag or passing this retention checker cannot admit a candidate. This policy deliberately rejects replacement-admission requests; a future migration needs a new reviewed policy and runtime integration.

Both production build commands verify this report before compiling the app. Run `npm run verify:foundations`; regenerate reviewed outputs with `npm run data:v029e:review`. Do not refresh pins merely to make a failure pass.

Technical retention is separate from deferred human validation and the recorded public/paid delivery gates. Both remain incomplete. See [verification](VERIFICATION.md), [reproduction](REPRODUCE.md), and [decision 0063](../../decisions/0063-foundation-retention-build-gate.md).
