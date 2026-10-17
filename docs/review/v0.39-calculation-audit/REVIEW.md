# v0.39 — Calculation and methodology audit

Date: 2026-10-17. Scope: the current three-state product and a public partner-review build requested by the owner. This audits software arithmetic against admitted artifacts; it is not independent recertification, legal source clearance, demographic calibration, or human usability acceptance.

## Findings

1. **Corrected turnout contract.** The previous text said every third-party total stays fixed. That is true for the statewide Harris/Trump addition but false for custom five-candidate group additions. The contract now distinguishes these operations and preserves the actual invariant: existing ballots stay fixed during turnout.
2. **Corrected population basis wording.** Preference consumes current scenario ballots after turnout; third-party exchange consumes candidate ballots after turnout and preference. Calling these only 2024 counted ballots omitted earlier authored additions. Formulas are unchanged.
3. **Disclosed bounded route search.** The solver retains bounded Pareto candidates per electoral-vote bucket (48 for major-party targets, 4 for other targets). Ranking returned routes is deterministic but is not a certificate that every globally optimal combination was enumerated. The route panel and public methodology now say so. Individual net-margin requirements remain exact.
4. **Added accessible methodology.** `methodology.html`, linked from the application footer, explains operation order, denominators, rounding, five candidate buckets, capacity, local evidence, off-map totals, electoral allocation, route limitations, and synthetic replay.

No arithmetic defect was found in the independently recomputed aggregate cases. This is a bounded conclusion, not a claim that all possible inputs or scientific assumptions have been validated. No model formula or election dataset changed in this audit.

## Arithmetic evidence

`node --experimental-strip-types scripts/audit-calculations.mjs` independently sums the admitted runtime units and checks eight cases in each state: exact baseline, turnout, positive and negative preference, both supply-saturation directions, complete Stein withdrawal, and a combined operation. It asserts closed-form statewide totals/transfer effects, nonnegative integer candidate counts, five-candidate conservation, deterministic endpoints, and immutable certified inputs. The output is retained in `calculation-results.json`.

| Quantity | Verified value |
| --- | --- |
| National ballots / electoral allocation | 155,238,302 / Harris 226, Trump 312 |
| PA baseline / H−T difference | 7,058,732 / −120,266 |
| MI baseline / H−T difference | 5,664,186 / −80,103 |
| WI baseline / H−T difference | 3,422,918 / −29,397 |
| PA +2.5-point preference transfer | 88,234 transferred ballots / +176,468 margin movement |
| PA remaining margin after +0.5-point preference | 84,973 votes to move beyond a tie |

The national total and detailed-state ballot totals also match the [FEC official 2024 presidential results](https://www.fec.gov/resources/cms-content/documents/2024presgeresults.pdf). This check does not independently validate local geographic crosswalks. Foundation retention checks separately pin the existing artifacts and 222 county geometry files.

The full existing model/runtime suite passes **302/302 in 449.7 seconds** (`work/v039-model-tests.log`). Four focused semantics cases, including the added regression for candidate-complete group wording, pass after the text corrections (`work/v039-semantics.log`). The aggregate audit passes **24/24 cases** (`work/v039-calculations.log`). Full-repository lint and the Pages production build/type/foundation gate pass (`work/v039-lint.log`, `work/v039-pages-build.log`); final changed-file lint is recorded in `work/v039-lint-final.log`.

The Pages build passes its real `/election-sandbox-2/` subpath browser journey locally: methodology navigation, local worker/data loading, a PA flip, URL reload, replay preparation/first return, and returning to editing, with no same-origin HTTP errors (`work/v039-pages-browser.log`, 18.7 seconds). The public deployment and its live retest are recorded separately in `PAGES.md`.

## Methodology limits retained

- VAP is 2020 voting-age population or its documented bridge/estimate, not citizen VAP or 2024 eligibility. Local caps are documented model capacity, not a behavioral turnout forecast.
- Group geography is aggregate composition. Authored candidate shares are assumptions, not measured individual preferences. Canonical group order resolves shared capacity competition.
- Statewide turnout → group additions → preference → third-party exchange is a fixed sequence. Display rounding never drives arithmetic; integer requests use JavaScript `Math.round`, including its negative-half behavior.
- Third-party geographic affinity and legacy allocation profiles are deterministic modeling rules. They do not establish actual voter migration.
- PA/MI off-map ballots remain in totals without invented locations. Wisconsin's local ward values remain reconstructed estimates, and compatible group cells remain unavailable.
- All-ballot H−T margin and top-two plurality margin are different metrics. Net margin votes are not the same as transferred ballots. A transfer changes H−T by two votes per ballot.
- Maine/Nebraska certified allocations remain intact; route construction excludes their counterfactual district allocation. A tie is not an outright win. Unsupported states have mathematical requirements without a local behavior model.
- Replay timing is synthetic and its reported analytics use the visible prefix, not future candidate shares. No calls, forecasts, or calibrated probabilities are supplied.

## Partner testing

[Decision 0066](../../decisions/0066-partner-pages-review.md) records the owner's specific Pages request and the public review scope. Human study and source-rights dispositions are not marked passed. Deployment details belong in `PAGES.md`; no invitation or partner message is sent.
