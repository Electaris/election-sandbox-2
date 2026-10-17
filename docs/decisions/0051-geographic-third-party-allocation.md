# Decision 0051: Geographic third-party allocation

Date: 2026-08-23

## Context

The third-party control previously changed the statewide candidate vector exactly but distributed exchanged ballots through each major party's statewide proportional footprint. That preserved totals, but it did not express the selected candidate's existing local geography. It also left the map unable to show an honest Stein or Oliver local plurality.

## Decision

The current Swingometer uses the versioned profile:

```text
certified-local-support-affinity-v1
```

For a positive selected-candidate exchange, the model:

1. calculates each reporting unit's certified selected-candidate share with a 25-ballot statewide prior;
2. squares that smoothed share to retain meaningful geographic concentration;
3. multiplies the affinity separately by local Harris and Trump vote capacity;
4. allocates the exact requested Harris and Trump losses through a capped largest-remainder process;
5. sorts allocation identities canonically before resolving integer remainders.

Candidate removal follows the selected candidate's existing local ballot distribution and uses the same canonical identity ordering. Changing source collection order cannot change the result.

Every reporting unit must retain:

```text
Harris + Trump + Stein + Oliver + residual Other = total ballots
```

County and state totals are sums of those exact local vectors. Off-map source units remain off-map. No polygon is invented for a residual or unmatched unit.

## Map semantics

- Stein receives green only when Stein has the strict local plurality.
- Oliver receives amber only when Oliver has the strict local plurality.
- residual Other/write-in receives a purple aggregate marker only when that aggregate bucket has the strict local plurality;
- a tie is neutral;
- an undifferentiated `otherVotes` total can never impersonate a named candidate;
- every plurality family uses the same explicit winner-over-runner-up margin buckets, with its own light-to-dark ramp;
- Shift remains the signed Harris-versus-Trump margin difference.

The plurality law applies at reporting-unit, county, and state level. A statewide Stein or Oliver plurality changes the state tile and assigns the state's electors to that named candidate. A residual Other/write-in plurality remains an aggregate bucket and is labeled as such. National Electoral College totals retain Harris, Trump, and explicit third-party or unresolved EV instead of silently assigning every state to a major party.

National popular-vote summaries remain Harris-versus-Trump comparisons because the 48 statewide-only baselines do not carry a complete named-candidate vector. Those summaries must say `Harris-Trump margin` rather than implying a full national plurality result.

## Version and compatibility

New scenario URLs identify `electaris-behavior-v2`. Links from the prior engine fail the existing compatibility gate instead of silently reconstructing different local geography.

The accepted v0.21 and v0.22 replay research fixtures retain their original `pa-behavior-v1` evidence and explicitly opt into:

```text
statewide-party-proportional-v1
```

That historical compatibility path exists only to preserve already accepted replay fingerprints. The interactive Swingometer does not select it.

## Consequences

- A large third-party scenario can now produce an honest county or reporting-unit plurality.
- A large third-party scenario can also change the statewide winner, state color, Electoral College allocation, and target candidate's true path requirement.
- Exact statewide exchange totals and source-party shares remain unchanged.
- Named-candidate local geography is deterministic and reproducible.
- The legend must explain all three local third-party outcomes without implying that aggregate Other is one candidate.
- Demographic behavior remains outside this decision.
