# v0.30 three-state release candidate: supported scope

Prepared: 2026-10-11. Candidate: `0.30.0-rc.1`. Intended use: local owner evaluation.

The product is a deterministic laboratory for counterfactual changes to the historical 2024 US presidential election. It connects authored assumptions to local changes, county/state totals, national popular vote, and Electoral College consequences. It is not a forecast or a model of observed individual voter behavior.

## Included

- National certified baseline and Electoral College context; detailed Pennsylvania, Michigan, and Wisconsin workspaces.
- Actual, Scenario, and Shift map views; county and supported local-unit inspection.
- Aggregate turnout, two-party preference, and named third-party controls; contribution explanations and multi-state portfolios.
- User-authored group turnout and candidate-share assumptions for Pennsylvania and Michigan. Wisconsin exposes total VAP only and rejects incompatible group assumptions.
- Deterministic scenario links, Path to 270, and the three-state Election Night replay with explicit reporting profiles and seeds.
- Desktop and mobile layouts, evidence disclosures, explicit off-map results, and unavailable demographic evidence.

## Retained evidence

| State | Local geography / denominator | Boundary to preserve |
|---|---|---|
| PA | 2020 Census VTDs and P4 composition linked to 2024 results | The Adams block pilot matched exactly; statewide replacement quality was not established. |
| MI | 2024 precinct terrain with an approximate 2020 VTD bridge, including weighted splits | The newer diagnostic remains held. Sturgis, positive evidence gaps, and material local boundary changes are unresolved. |
| WI | LTSB reconstruction of 2024 election data and 2020 VAP on January 2025 wards | Reconstructed ward values are not certified raw ward returns; compatible group composition is unavailable. |

The zero-change detailed totals remain PA 7,058,732, MI 5,664,186, and WI 3,422,918 ballots. National Actual remains 155,238,302 ballots and Harris 226 / Trump 312 electoral votes. Off-map ballots remain in totals without being painted onto arbitrary polygons.

## Outside this candidate

Additional detailed states, demographic migration, polling calibration, probabilities, projections or calls, voter-file inference, individual persuasion, observed group preferences, accounts, memberships, rooms, backend persistence, and public/paid detailed-state hosting.

## What is frozen

The generated local package includes the built application, this scope, the acceptance checklist, delivery plan, and a checksum manifest. Its identity covers the packaged bytes and recorded build inputs. It is a working-tree snapshot; it is not a Git tag or a claim that the repository is clean. The historical `v0.19.1-supervisor-review` candidate remains untouched.

September's v0.29E results are prior evidence: 296 Node tests and 21 selected browser cases passed across recorded runs. Fresh packaging checks are recorded separately in this phase's verification record. Human acceptance remains unperformed; a successful package check does not change that status.
