# Decision 0059: Michigan source-map admission hold

Date: 2026-09-07

Status: accepted for diagnostic comparison; candidate admission rejected

The v0.29D statewide source audit found 20 self-intersecting original precinct geometries, 27 overlap pairs when exclusion footprints are included, and one stale 2023 election-year attribute in the pinned 2024 precinct dataset. A generic admitted block-to-precinct bundle cannot honestly be produced under decision 0057 without addressing these source issues.

Preserve that failure rather than weakening the admission contract. Produce a separate, explicitly nonadmitted statewide GEOS diagnostic so the evidence comparison can still account for every block, precinct, county, and off-map result. It has different schemas from the v0.29A artifact and trace; the generic bundle reader rejects it. It is never imported by the app or written under `public/`.

Quarantine every invalid, overlapping, or vintage-exception target. Use `make_valid` only to construct conservative exclusion footprints; never allocate to a repaired target. Any block touching those footprints retains its full profile as unavailable. Remaining valid blocks use whole containment, then an in-block Census internal point, with strict county identity. Missing, invalid, ambiguous, or unsupported placements remain unavailable. There is no area or registered-voter fallback. A precinct touched by unresolved source evidence is partial, and its partial population cannot be used as a complete denominator.

The diagnostic accounts for 254,730 blocks and all 4,340 precincts. It recovers complete evidence for 59 formerly unavailable units, but has only 3,645 complete precincts, 635 partial, and 60 unavailable. Complete-unit VAP is 6,640,546 versus 6,998,065 in the admitted bridge. This does not demonstrate strictly better statewide evidence. All 74 off-map units and 142,574 votes remain unchanged.

Retain the existing Michigan runtime. The next prerequisite is a reviewed, versioned source-map correction/normalization policy and review of the Flint Township Precinct 2 vintage exception. After that, compile an admitted candidate and repeat the comparison. v0.29E cannot automatically admit the diagnostic or treat this hold as a successful source-map gate.

See [full comparison](../review/v0.29d-michigan-comparison/COMPARISON.md). No application migration, statewide rollout, user-visible capability change, or individual-behavior inference is authorized by this decision.
