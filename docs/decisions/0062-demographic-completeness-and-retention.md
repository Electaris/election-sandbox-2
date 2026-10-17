# 0062: Separate completeness dimensions and retain the three-state foundations

Date: 2026-09-08

Status: accepted for evidence review and bounded v1 retention; no replacement admission

## Decision

Retain the current Pennsylvania, Michigan, and Wisconsin demographic artifacts for the bounded three-state v1. Replacement is optional and requires better, admitted evidence. This closes v0.29D.3 triage without asserting that the Michigan bridge is more accurate than the candidate.

Keep five distinct questions visible: profile availability, unresolved touching evidence, source-county localization, map topology, and effective source vintage. The v0.29A `available` status is not Michigan diagnostic `complete`, and neither alone grants admission. No contract or runtime status changes in this phase.

## Evidence

The Michigan trace contains 179 unavailable positive-VAP blocks. Of these, 153 belong to the existing Sturgis quarantine. The other 26 contain 491 VAP: 214 in county conflicts, 65 without compatible geometry, and 212 in zero-information splits. The 382 partial precincts comprise 33 touching positive VAP and 349 touching only zero VAP. The latter retain partial status: zero in five age-18+ groups does not prove zero residents or valid geography.

Two positive blocks have no same-county touching precinct: 47 VAP in Bay County and 1 in Isabella County. All 63 precincts in those source counties need this context; 52 currently have diagnostic complete labels. The review flags county context without assigning those people to any precinct or changing the frozen allocation.

Flint Township Precinct 2's candidate 5,759 VAP reconstructs as 1,900 + 2,528 + 1,331 from three 2020 VTDs. The existing official-field bridge selects only the first VTD. The new block/VTD provenance explains the difference, but validating the 2024 boundary remains necessary. All eight township precincts are included in the review.

## Consequences and next gate

- Pennsylvania retains its 2020 VTD foundation. The Adams pilot is identical; no statewide replacement-quality claim follows.
- Michigan retains its approximate VTD bridge, existing weighted splits, unavailable evidence, and disclosed limitations. Decisions 0059–0061 still hold the candidate out of runtime.
- Wisconsin retains the existing LTSB 2020 VAP denominator aggregated to 2025 wards. This phase does not provide a new Wisconsin source or replacement comparison.
- A future Michigan replacement must resolve Sturgis, localize the remaining positive evidence, review completeness semantics and material local changes, then reproduce the comparison before admission. No source-owner message has been sent.
- v0.29E may package repeatable **retention or admission** checks without requiring a migration. Next product work is integrated verification of the retained three-state foundation, followed by the separately deferred human testing and recorded delivery gates. Retention is not public-release authorization.

Evidence: [review](../review/v0.29d3-evidence-quality/REVIEW.md), [machine-readable inventory](../review/v0.29d3-evidence-quality/evidence-review.json), [source pins](../../data-sources/michigan/v029d3-evidence-review-sources.json).
