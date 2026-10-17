# Decision 0053: Group-specific turnout assumptions

Date: 2026-08-25

## Decision

Sandbox may apply explicit group-specific turnout increases only where the admitted runtime contains compatible local aggregate composition and documented remaining VAP capacity.

The five admitted categories are Hispanic of any race, non-Hispanic White, non-Hispanic Black, non-Hispanic Asian, and non-Hispanic Other. These are aggregate 2020 population cells. They are not observed individual turnout, candidate preference, CVAP, registered voters, or an election-year eligibility estimate.

## Allocation law

The existing statewide turnout increase runs first. Each nonzero group request then adds an integer number of ballots proportionally across eligible local units using that group's admitted local VAP count. Every allocation is capped by the unit's remaining turnout capacity.

When multiple group requests compete for the same final local capacity, the engine uses the fixed canonical group order from the demographic evidence contract. The order is deterministic, documented in the UI, and independent of certified or scenario candidate performance.

Candidate allocation remains a separate explicit setting. The existing Harris share of added ballots divides all realized turnout additions between Harris and Trump. The model never derives candidate choice from aggregate group composition.

## State capability

- Pennsylvania applies group turnout on VTD-linked terrain with admitted 2020 Census composition.
- Michigan applies group turnout on precinct terrain where its admitted Census bridge provides composition. Unavailable bridges and off-map units receive no invented demographic allocation.
- Wisconsin remains eligible for aggregate turnout but is unavailable for group-specific turnout. The UI explains the boundary and scenario URL schema 3 rejects a nonzero Wisconsin group recipe.

## Persistence and compatibility

Scenario URL schema 3 serializes all five group settings in canonical order. Existing schema 2 portfolio links remain replayable and restore the new settings to zero. Recipe fingerprints preserve their prior value when all group settings are zero.

## Consequence

v0.28C may add candidate-complete group preference assumptions, but only after defining exactly which ballots the preference operation applies to. It may not infer group preference from certified geographic correlations.
