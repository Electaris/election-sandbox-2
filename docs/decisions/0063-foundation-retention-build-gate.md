# 0063: Enforce the reviewed three-state retention decision at build time

Date: 2026-09-08

Status: accepted for the bounded PA/MI/WI product; no candidate migration

## Decision

Implement decision 0062 as a pinned, offline retention policy and deterministic report. Run its verification before both standard and Pages production builds. A missing state, changed artifact, incompatible loader, changed demographic capability, or inconsistent review fails the check rather than silently updating pins.

Use the application's existing runtime adapters and demographic evidence contracts. Reconstruct the zero-change scenario at every model unit, compare certified totals with the national baseline, reconcile off-map votes separately, and exercise group capability. Pennsylvania and Michigan retain aggregate group evidence; Wisconsin retains a total-VAP denominator without compatible group composition.

## Admission boundary

This version supports the reviewed retain-existing outcome for exactly the three registered states. It records each replacement gate: Pennsylvania has no demonstrated improvement beyond its bounded Adams pilot; Michigan remains under its source hold; Wisconsin has no replacement proposal. The policy rejects a replacement-admission flag. A new candidate requires a valid artifact and full trace, pinned sources/configuration, quality and comparison review, explicit fingerprint-bound approval, and tested runtime integration under a new policy.

Compiler commands and configuration paths remain in the inventory for source reproduction. This fast check does not re-download raw data, reconstruct GIS imports, adjudicate boundaries, or treat a structurally valid artifact as admitted. A successful build does not certify source quality beyond the recorded decision.

## Consequences

- Preserve existing PA/MI/WI runtime data and capabilities.
- Make unreviewed drift visible before a production bundle can be built through the supported commands.
- Keep the check out of frontend request paths; no new runtime download is added.
- Keep deterministic retention output separate from the execution record for integrated model/replay/browser checks.
- Preserve deferred human testing, the recorded public/paid delivery gates, and the unsent Sturgis source clarification.

Evidence: [retention report](../review/v0.29e-foundation-retention/REVIEW.md), [policy](../../data-sources/foundation-retention-policy.json), [verification](../review/v0.29e-foundation-retention/VERIFICATION.md).
