# v0.29D.3 evidence-quality review

**Decision: retain the current PA, MI, and WI demographic foundations for the bounded three-state v1. No candidate migration.**

This completes the evidence triage. Michigan replacement admission remains held; this is not a source-boundary resolution or approval for public delivery.

## Unique unavailable evidence

| Reason | All blocks | Positive-VAP blocks | Unavailable VAP |
|---|---:|---:|---:|
| county_boundary_conflict | 74 | 18 | 214 |
| no_compatible_geometry | 1228 | 5 | 65 |
| quarantined_map_geometry | 202 | 153 | 4,580 |
| zero_information_split | 205 | 3 | 212 |

There are 179 positive-VAP unavailable blocks in total. Outside Sturgis quarantine, 26 unique blocks contain 491 VAP. The full six-cell profiles, source county, same-county and foreign touching IDs are retained in the JSON inventory. Touching exposure must not be summed across precincts.

## Completeness findings

Of 382 partial precincts, 33 touch positive VAP and 349 touch only zero VAP. All retain their original status. Of 14 complete-to-partial regressions, 1 touches positive VAP: City of Richmond Precinct 2 (2 VAP, county conflict).

| Source county | Unlocalized positive blocks | VAP | Precincts needing county context | Existing diagnostic statuses |
|---|---:|---:|---:|---|
| 26017 | 260172856004038 | 47 | 40 | {"complete": 30, "partial": 10} |
| 26073 | 260730001001158 | 1 | 23 | {"complete": 22, "partial": 1} |

These blocks touch no compatible same-county target. A precinct can therefore have a diagnostic complete label while its source county contains unlocalized positive evidence. The county flag records uncertainty; it neither identifies an owner nor distributes population. Even absence of this flag is not boundary certification.

The v0.29A artifact uses available/unavailable profile status; the Michigan diagnostic uses complete/partial/unavailable. They answer different questions. Keep profile availability, observed touching uncertainty, county localization, topology, and source-vintage admission separate. Zero VAP proves zero in the five P4 age-18+ groups only; it does not prove zero residents. No status is upgraded.

## Flint Township provenance

| Precinct | Existing VAP | Candidate VAP | Candidate contributions by 2020 Census VTD |
|---|---:|---:|---|
| Flint Township, Precinct 1 | 1,636 | 3,999 | 26049049111: 1,636, 26049049114: 2,168, 26049049118: 195 |
| Flint Township, Precinct 2 | 1,900 | 5,759 | 26049049116: 1,331, 26049049117: 1,900, 26049049119: 2,528 |
| Flint Township, Precinct 3 | 2,578 | 5,051 | 26049049112: 1,272, 26049049113: 2,578, 26049049116: 1,153, 26049049120: 48 |
| Flint Township, Precinct 4 | 1,082 | 1,046 | 26049049120: 1,034, 26049049207: 12 |
| Flint Township, Precinct 5 | 1,995 | 2,088 | 26049049115: 1,995, 26049049118: 93 |
| Flint Township, Precinct 6 | 1,024 | 1,085 | 26049049116: 61, 26049049121: 1,024 |
| Flint Township, Precinct 7 | 1,452 | 1,452 | 26049049122: 1,452 |
| Flint Township, Precinct 8 | 1,668 | 4,424 | 26049049123: 889, 26049049124: 1,867, 26049049125: 1,668 |

Township totals change from 13,335 to 24,904 VAP. Precinct 2 combines 1,900 from VTD 26049049117, 2,528 from 26049049119, and 1,331 from 26049049116. Its existing bridge uses only 26049049117. The JSON records each contributing block, all six counts, and the full source VTD profile. This explains the arithmetic and identifies a limitation in the existing bridge; it does not independently establish the correct 2024 boundary. The earlier resolution review establishes an effective cycle, not spatial certification.

## Retention and finite follow-up

- Pennsylvania: retain the Census VTD foundation. The Adams pilot matches exactly; statewide replacement quality remains unproven.
- Michigan: retain the existing approximate VTD bridge, including its disclosed weighted splits and unavailable evidence. The candidate is not admitted. Retention does not declare the bridge more accurate.
- Wisconsin: retain the LTSB ward denominator and its existing source/vintage disclosures. No Wisconsin replacement comparison was conducted in this phase.

For a future Michigan replacement: resolve Sturgis with effective-cycle source evidence; review the 26 other positive-VAP blocks by source county; address unlocalized county evidence and approve explicit completeness semantics; independently validate material local changes such as Flint; then recompile and compare before admission. These are replacement prerequisites, not a requirement to replace working foundations for v1.

Next: v0.29E should package reproducible admission **or retention** checks for the three states, then run integrated model/replay/frontend verification. Deferred human testing and the recorded delivery gates remain separate outstanding release work. The Sturgis clarification draft remains unsent.

Machine-readable evidence: [evidence-review.json](evidence-review.json). See [reproduction](REPRODUCE.md), [verification](VERIFICATION.md), and [decision 0062](../../decisions/0062-demographic-completeness-and-retention.md).
