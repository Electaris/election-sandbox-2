# v0.30 AI technical acceptance review

Reviewer: Codex (AI). Review started 2026-10-11; fixes and final verification on 2026-10-12, America/Toronto. This is an informed technical review, not human acceptance or an unfamiliar-user comprehension study. The human-result column in ACCEPTANCE.md remains NOT RUN.

Original package: `352d36a638bdf273f4cdfdc702691c9759b3306ebd6818d8cd71e6745b538dc9`.

Corrected package: `8307b9313f6e06d4d1419ce1ccdc696615f269263f926cfb0d72bf35b00d4759`, version `0.30.0-rc.1`. Both immutable directories are retained. The corrected package has 246 files, 50,816,584 file-content bytes, and 367 recorded inputs. Its manifest preserves the unpassed human and external-delivery gates.

## Findings

### F1 — P1: a queued timer tick could resume a paused count (A8)

Environment: local Chromium, desktop 1440 × 900 and mobile viewport 390 × 844. Entry: `http://127.0.0.1:4173/app/`, Pennsylvania, Election Night. The existing replay workflow selected the volatile-waves profile, added an Allegheny County timing override, restarted, played, then clicked Pause.

Expected: the clock and reported count remain paused until an explicit Play action. Actual: the captured desktop and mobile screens still showed Pause and the clock continued advancing. See the original [desktop capture](screenshots/integrated-election-night-desktop.png) and [mobile capture](screenshots/integrated-election-night-mobile.png).

Cause: the worker accepted an ADVANCE_LOGICAL_TIME message queued behind PAUSE and set its status back to playing. The deterministic regression reproduced `paused → playing` and a 180,000 ms clock advance after PAUSE.

Fix: the worker accepts timer advances only while already playing. Explicit Play still resumes the count; seeking and stepping remain available while paused. Regression coverage checks queued ticks after Pause, Reset, Seek, and completion, plus exact three-state endpoint ballots (16,145,836). The integrated browser check now requires the clock to remain stationary for multiple timer intervals and through a mobile resize.

Retest: PASS on the corrected package, 2026-10-12. The deterministic regression and integrated browser case passed. Corrected [desktop](screenshots/fixed/integrated-election-night-desktop.png) and [mobile](screenshots/fixed/integrated-election-night-mobile.png) captures show Play and the same paused clock time. Finding closed.

### F2 — P2: a long local-unit breadcrumb overflowed mobile (A9)

Environment: local Chromium, 390 × 844. Entry: `/app/`, Pennsylvania → turnout increase → Contributors → a county → VTDs → PITTSBURGH WARD 01 DISTRICT 01. The evidence capture's companion JSON preserves its scenario URL.

Expected: selected geography and controls fit the mobile page. Actual: the national/state/county/local breadcrumb created 217 px of horizontal page overflow. See [original local inspection](screenshots/acceptance-mobile-local-turnout.png).

Fix: allow the breadcrumb to wrap, let its containing flex item shrink, and wrap long labels within the available width. The acceptance case checks keyboard edits, county/local navigation, exact reset, and no horizontal page overflow.

Retest: PASS on the corrected package, 2026-10-12. The 390 × 844 workflow passed the no-overflow assertion; [reset capture](screenshots/fixed/acceptance-mobile-exact-reset.png) visually confirms the wrapping breadcrumb and exact local ledger. Finding closed.

### Test maintenance, not product findings

Two older alpha assertions expected retired wording (`70,588 D` and `35,294 ballots transferred`). The current UI correctly showed `70,588 toward Harris` and `35,294 of 35,294 requested ballots transferred`; numerical expectations were unchanged. These assertions now check the current wording. A new copied-link assertion initially compared innerText with textContent; it now compares innerText consistently. Neither required a product change.

## Checklist coverage

Final browser retest: **27 passed in 4.1 minutes** against the corrected package. Technical disposition: PASS for the exercised A1–A9 workflows, with the stated coverage limits. Both identified product findings are closed. A10 is an informed AI explanation only; human comprehension and the human checklist remain NOT RUN.

| Task | Technical coverage and limits |
|---|---|
| A1 | Home → laboratory; 155,238,302 national Actual ballots; Harris 226 / Trump 312 EV; historical counterfactual framing. |
| A2 | PA → MI → WI through UI navigation; county and local-unit inspectors; state identity and selected geography; each state's evidence ledger. MI direct, weighted-split, and unavailable bridge cases also exercised. |
| A3 | PA keyboard turnout edit, local ballot increase, preference transfer preserving local total, exact candidate-by-candidate reset, restored 226/312 EV. Fresh model tests cover unit/county/state/national arithmetic and explicit residuals. |
| A4 | PA/MI group turnout and candidate-share controls, normalization and deterministic URL restoration; WI incompatible group assumptions rejected. |
| A5 | Author PA and MI changes, copy the actual link, open a separate tab, restore schema 4 recipes, selected county and exact candidate ledger, and 260/278 EV. |
| A6 | Contribution explanations link operations, geography, and EV changes; Required → Modeled/Satisfied route behavior, reversibility, and unsupported detailed-state restrictions. |
| A7 | PA/MI/WI evidence and off-map counts; VAP disclosure; MI unavailable bridge; WI reconstructed ward data and absent compatible group composition. Foundation verifier checks unchanged admitted bytes and arithmetic. |
| A8 | Full replay workflow, persistent map, play/pause, backward/forward seek, profile save/reload and restart, no statewide fallback returns, return to editor. F1 fixed; deterministic worker regression also checks the endpoint. |
| A9 | Desktop and 390 × 844 mobile views; keyboard turnout slider, ranked-list navigation, focus into Inspector, keyboard reset, local inspection and replay. F2 fixed. This is selected keyboard/viewport coverage, not a comprehensive accessibility audit or physical-device test. |
| A10 | Informed explanation below. Blind human comprehension remains untested. |

## A10: explanation of what the app means

The starting point is the historical 2024 election result. The controls describe assumptions authored by the user: turnout adds ballots within the documented population capacity, while preference transfers existing ballots. The arithmetic shows the consequences of those choices; it does not estimate what particular individuals did or predict another election.

Local evidence differs by state. Pennsylvania links returns to Census VTDs. Michigan uses 2024 precinct geography with a documented approximate demographic bridge, including splits and unavailable cases. Wisconsin's ward values are reconstructed estimates and retain that label. Unmapped ballots remain in totals without being assigned to invented locations.

Election Night chooses how a fixed scenario is reported over time. Changing the reporting profile changes timing and order, not the authored final votes. Intermediate counts are deterministic simulated returns, not forecasts or election calls. Only PA, MI, and WI have detailed returns in this replay.

## Evidence and next action

Fresh model/replay verification: 80 tests passed. The seven browser files (`alpha-corrections`, `demographic-turnout`, `release-acceptance`, `replay-experience`, `scenario-explanation`, `scenario-replay`, and `wisconsin-detailed-state`) passed all 27 cases on the corrected package. Full ESLint, TypeScript/production build, foundation retention verifier, package integrity/current-input verifier, whitespace check, and final loopback HTTP check passed. The existing large-bundle build advisory remains. The initial package's 19 selected browser checks passed before the additional acceptance cases exposed F1/F2.

Local logs: `work/v030/acceptance-model.log`, `acceptance-fixed.log`, `acceptance-package.log`, `acceptance-lint.log`, and `pause-regression-before.log`. Corrected visual evidence is in `screenshots/fixed/`; the original evidence is preserved separately. The normal shell and interactive browser helpers failed at startup; approved shell execution ran the project's Playwright tests. No human session was simulated or recorded as passed.

Visual review included corrected mobile local inspection/reset, Wisconsin local inspection, desktop/mobile paused replay, and mobile timeline. The owner can now use the local app for a brief personal walkthrough and record whether its workflows make sense. The deferred unfamiliar-user study and external-delivery decisions remain separate work. No deployment, participant invitation, source-owner message, demographic migration, commit, or tag was performed.
