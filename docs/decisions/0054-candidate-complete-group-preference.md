# Decision 0054: Candidate-complete group preference applies only to newly added ballots

Date: 2026-08-26

## Decision

A custom demographic candidate-choice vector may allocate only the new ballots created by that same group's explicit turnout assumption. It may not relabel, transfer, or otherwise assign a demographic identity to certified ballots.

The vector contains Harris, Trump, Stein, Oliver, and residual Other/write-in. All five shares are explicit nonnegative percentages and must sum to exactly 100 percent. A group without a custom vector inherits the existing visible Harris-Trump split for added ballots.

## Reason

The admitted foundation contains aggregate group composition by geography, not individual ballot identities or observed group vote choice. Applying a group vector to certified ballots would require ecological inference. Restricting it to newly authored turnout keeps the operation a transparent counterfactual assumption.

## Allocation law

Statewide turnout runs first. Group turnout then allocates exact integer ballots through admitted composition and remaining local VAP capacity in canonical group order. Candidate allocation occurs after each group's realized ballot total is known and conserves every ballot across the five candidate buckets at group and reporting-unit level.

Later statewide preference transfer and named third-party exchange operations may move ballots again. The demographic contribution panel therefore describes the turnout operation at insertion time, not an unverifiable final ballot lineage.

## Capability and persistence

Pennsylvania and Michigan may use the operation where admitted local composition exists. Wisconsin remains unavailable and fails closed. Scenario URL schema 4 persists all five group vectors. Schemas 2 and 3 remain compatible by restoring every custom vector to `inherit`.

## Prohibitions

The model does not estimate historical group preference, infer individual behavior from geography, calibrate to surveys, predict turnout, or assign candidate preference to unavailable or off-map units.
