# Decision 0056: Block-to-election-unit evidence contract

Date: 2026-08-28

## Decision

Every future precinct-demographic foundation must publish two deterministically linked artifacts:

1. A compact map-unit artifact used by the application.
2. A complete build-time trace containing one record per source Census block.

The trace is the authority for geographic allocation. The compact artifact is a validated derivative.

## Conservation law

For each Census block, Hispanic of any race, non-Hispanic White, non-Hispanic Black, non-Hispanic Asian, and non-Hispanic Other VAP must sum to total VAP. An allocated block's target vectors must reconstruct its source vector exactly. Statewide modeled plus unavailable vectors must reconstruct the source vector exactly.

Every compact map-unit profile must equal the sum of its trace allocations. Method counts, split counts, source-block counts, and statewide coverage must reconcile across both artifacts.

## Geographic law

Allocation may never cross a county boundary. Whole-block containment and Census internal-point assignment are direct methods. A genuine split may use only a versioned population-evidence or housing-evidence weighting method. Every split target preserves an exact rational evidence weight, all targets share one denominator, and their numerators sum to that denominator. Raw polygon area is not an admitted substitute for population.

Blocks without defensible placement remain unavailable. Election returns without terrain remain off-map. Neither may be attached to a convenient nearby polygon.

## Evidence and inference boundary

Input demographic, map, and election-result artifacts require canonical SHA-256 checksums and explicit vintages. The resulting composition remains aggregate population evidence. It does not identify voters, measure individual turnout, observe candidate preference, or authorize ecological inference.

## Determinism

Canonical ordering, serialization, validation, and fingerprints must be independent of input collection order. Unknown methods, fields, identities, fractional people, non-reconciling vectors, and cross-county targets fail before publication.
