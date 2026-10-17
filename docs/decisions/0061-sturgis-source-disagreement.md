# 0061: Separate Sturgis allocation sensitivity from boundary authority

Date: 2026-09-08

Status: accepted for source review and unapproved sensitivity only

## Decision

Retain the Sturgis quarantine and existing Michigan foundation. Published sources disagree about the approximately 1.23 m² triangle: state 2022 geometry places it on the city side, while city-published GIS places it outside the city. Coordinate discrepancies exceed the overlap width, and available metadata does not certify an effective 2024 legal line.

Two unapproved local ownership hypotheses yield identical replacement records for all 202 quarantined blocks and would recover 4,580 VAP without changing election totals. This demonstrates insensitivity to those two edits for this dataset. It does not authorize a correction, establish ownership, or admit a replacement foundation.

## Consequences

- Preserve production data, both earlier candidates, and the source normalization policy.
- Keep sensitivity outputs in a distinct review schema with admission and migration false, bound to the original sources and hashes.
- Obtain effective-date and boundary evidence through the prepared clarification packet before selecting a correction. The draft remains unsent without user authorization.
- Prioritize the 33 partial precincts touching positive VAP. Preserve partial status for the 349 touching only zero-VAP blocks; changing completeness semantics requires separate contract review.
- Preserve Flint's larger geography/vintage review. v0.29E cannot bypass the source hold because the sensitivity is numerically stable.

Evidence: [source review](../review/v0.29d2-sturgis-source-review/SOURCE-REVIEW.md), [hypotheses](../review/v0.29d2-sturgis-source-review/hypothetical-comparison.json), [partial review](../review/v0.29d2-sturgis-source-review/partial-evidence-review.json), [verification](../review/v0.29d2-sturgis-source-review/VERIFICATION.md).
