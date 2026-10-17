# Decision 0055: Demographic contribution and bounded sensitivity

Date: 2026-08-26

## Decision

Demographic explanation must be derived from the accepted scenario ledger, scoped to one authored group-turnout operation, and labeled as deterministic counterfactual arithmetic.

The interface may report requested, realized, and clipped ballots; the exact five-candidate allocation; signed Harris-minus-Trump movement; receiving geography; off-map ballots; and county or local-unit rankings.

## Sensitivity law

The only authorized sensitivity statistic in v0.28 is signed Harris-minus-Trump margin votes per 1,000 realized added ballots, calculated directly from the selected group's candidate vector. It is not a probability, forecast, persuasion score, elasticity estimate, or claim about real voters.

## Geographic law

Rankings aggregate exact reporting-unit contribution records. Unavailable demographic cells receive no allocation. Off-map contributions remain separate and are never assigned a polygon. The interface may say where the modeled operation occurs, but not that a demographic group caused an observed election result.

## Operation order

The explanation isolates turnout at insertion time. It must disclose that later statewide preference transfer and named third-party exchange operations may change the final candidate ownership of those ballots.
