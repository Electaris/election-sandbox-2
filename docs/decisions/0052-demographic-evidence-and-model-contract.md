# Decision 0052: Demographic evidence and model contract

Date: 2026-08-24

## Decision

Sandbox admits demographic behavior only through a versioned, deterministic, fail-closed evidence contract. The contract records what population measure exists, where it exists, how it reaches the displayed geography, and what claims it cannot support.

The current denominator is population age 18 and over. It is not citizen voting-age population, a 2024 eligible-voter estimate, registered voters, or ballots. Aggregate Census or LTSB population composition is not observed individual turnout and is not observed candidate choice.

## State evidence

| State | Denominator | Geography relationship | Group composition |
| --- | --- | --- | --- |
| Pennsylvania | 2020 Census P.L. 94-171 P4 VAP | Direct 2020 Census VTD geography | Available in five mutually exclusive categories |
| Michigan | 2020 Census P.L. 94-171 P4 VAP | 2020 VTDs bridged to 2024 precincts, including registered-voter-weighted deterministic splits | Available where the bridge exists |
| Wisconsin | LTSB `PERSONS18`, derived from 2020 P.L. 94-171 | Official population reconstruction on January 2025 wards | Unavailable in the current runtime artifact |

Wisconsin remains eligible for existing aggregate turnout behavior. It is not eligible for future group-specific turnout or preference behavior until a separately admitted composition artifact exists.

## Assumption boundary

The evidence contract may establish aggregate population counts. Any future group turnout change or candidate preference must be labeled as a user-authored counterfactual assumption. The model may apply those assumptions in later releases, but it may never describe them as observed individual behavior or infer them silently from aggregate geography.

Ecological inference is prohibited by contract.

## Runtime law

The v0.28A schema:

- reconciles statewide and modeled group counts exactly to their VAP denominators;
- reconciles result-linked, no-result, observed, unavailable, turnout-ready, and capped terrain counts;
- preserves direct, allocated, reconstructed, and unavailable crosswalk methods separately;
- includes off-map election-unit counts;
- sorts state and method identities canonically;
- rejects unknown fields, partial state inventories, duplicate states, invalid integers, and contradictory capability claims;
- sets `voteMutationAuthorized` to `false`.

No control is rendered and no vote changes in v0.28A.

## Consequence

v0.28B may build group-specific turnout behavior for Pennsylvania and Michigan against this contract. Wisconsin must fail closed for that behavior. v0.28C may add explicitly authored group preference assumptions only after turnout conservation and explanation gates pass.
