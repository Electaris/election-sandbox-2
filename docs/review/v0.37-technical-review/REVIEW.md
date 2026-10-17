# v0.37 — Informed product review

Date: 2026-10-17. Reviewer: Codex, an informed AI technical reviewer. This is an actual interface walkthrough plus targeted automated verification, not a participant study or owner sign-off. Human sessions remain **0**; owner A1–A10 rows remain **NOT RUN**.

## Verdict

The editorial foundation is coherent enough to keep: the ivory/ink typography, restrained political palette, dimensional geography, and direct certified-to-scenario explanations form a recognizable product. A national-readout data-binding defect was found and corrected. Replay meaning and Wisconsin route definitions were clarified. The next design work should reduce the turnout editor's density and make the scope of statewide edits unmistakable inside county views.

No launch, migration, new election years, data replacement, or unfamiliar-human validation is implied by this review.

## Candidate identity

- Reviewed original: `d8580709d2c67909fc5d6094bae5b6964e7cf5125c7bbcca73db2962080e81db`, on loopback port 4174.
- Corrected and retested: `5250e5c7203b3168be988b89df21c1f10e8f406a4751f34bac035184e04339a8`, on **http://127.0.0.1:4175/**.
- Version: `0.30.0-rc.1`; manifest source HEAD: `2aaa6180cf92ce7930ab31b7cf575bf29bc6f971`, with local corrections and an honestly recorded dirty working tree.
- Directory: `outputs/0.30.0-rc.1/5250e5c7203b3168be988b89df21c1f10e8f406a4751f34bac035184e04339a8/`.
- The old package remains intact. Intermediate local packages were not used as final acceptance evidence.
- Retained gates: local owner review allowed, external delivery unauthorized, human acceptance incomplete, demographic migration disabled.

To restart this corrected package:

```powershell
npm.cmd run preview -- --outDir outputs/0.30.0-rc.1/5250e5c7203b3168be988b89df21c1f10e8f406a4751f34bac035184e04339a8/app --host 127.0.0.1 --port 4175 --strictPort
```

## Findings and disposition

| ID | Severity / status | Reproduction, observation, and action |
| --- | --- | --- |
| R1 | P1 · fixed | Open PA, transfer 2.5 preference points toward Harris, then return to United States. The national readout said Actual R +1.7 / Scenario D +0.8, which were PA's margins. Its national shift already said +0.1 points. The result vector fell back to the active detailed state when no state was selected. Bind the national view to national actual/scenario aggregates. Retest shows R +1.5 → R +1.4, +0.1 points, while reopening PA retains D +0.8. Electoral College and model arithmetic were not changed. |
| R2 | P2 · fixed | Open Election Night with the dock collapsed. “Historical scenario replay” and “Only published local returns” did not explicitly distinguish authored timing from the actual 2024 reporting chronology. The opening returns desk now states that timing and reporting order are synthetic and reveal modeled votes, not actual election-night chronology. Existing three-state exclusions and no-projection explanations remain. |
| R3 | P2 · fixed | Select the MI + WI route and open Wisconsin. Its state panel correctly described a WI scenario, but the common route definitions said only PA or MI could be Modeled. Both common definitions now include PA, MI, and WI. This corrects documentation of existing capability; it adds no new capability. |
| R4 | P2 · open design recommendation | At 390 × 844, open PA → Behavior → Turnout. The statewide participation slider is followed by five group sliders, candidate-choice customization, and group explanatory material before the shared Harris split and operation summary. Reset sits after the contribution/sensitivity ledger. The interface works, but completing a simple statewide addition requires navigating a large amount of unrelated advanced detail. Put the shared split and operation summary next to the statewide slider; reveal optional group controls progressively, preserving accessible labels and authored-choice explanations. This is reviewer inference, not measured human task failure. |
| R5 | P2 · open design recommendation | Select Allegheny County and open Behavior. The drawer says “Change Allegheny County,” while the editor's Geography line correctly says Pennsylvania and its control changes the statewide recipe. County inspection and statewide authorship coexist, but the leading instruction suggests a local edit. Make “Statewide assumptions · Pennsylvania” explicit in the editor and distinguish it from the selected inspection geography. Do not silently change controls to local behavior. |
| R6 | P3 · open wording issue | Michigan's county map instruction says selecting a county opens “voting-district terrain.” Michigan uses precincts; Wisconsin uses reconstructed wards. Use the manifest's geographic unit label, retaining Wisconsin's reconstruction qualification. The detailed evidence panels already use the correct geography. |
| R7 | P3 · open design recommendation | The phone local-unit capture repeats a long Pittsburgh ward/district name in both the page breadcrumb and drawer heading, while the Inspector's own identity is ellipsized to “PITTSBUR...”. The full name is available elsewhere, but repetition consumes map space without making the Inspector self-contained. Compact the repeated context and let the Inspector identity wrap, preserving the overlay dock behavior. |

The first issue is a factual presentation defect, not an aesthetic preference. R4 and R5 should guide the next focused interaction pass; they do not justify another whole-site visual reset.

## Walkthrough observations

The live review used the in-app browser at its existing roughly 920-pixel width, explicit 1440 × 900 desktop, and 390 × 844 phone viewports. It covered Home, state entry, preference edits, analysis, Contributors, county selection, Data, URL reload, Election Night, a first return, seeking, return to editing, alternative routes, Wisconsin limits, and Michigan evidence. Keyboard activation was used extensively. A browser mouse-dispatch timeout was recovered with keyboard activation; it was not classified as a product defect. Browser-session clipboard access returned empty despite the app's copied notice, so manual review only establishes the notice and URL reload; the independent clipboard browser test establishes copied-link restoration.

- Home: the headline, national electoral totals, map, and legend have a clear hierarchy. Baseline 226/312 and 155,238,302 ballots remain exact. No historical-year switch exists in the current scope.
- PA stop-short task: +0.5 preference points transfers 17,647 ballots, producing 35,294 net margin votes. The sidebar correctly shows 84,973 still needed and 0 additional electoral votes.
- PA flip task: +2.5 points produces 176,468 net margin votes, D +0.8, and 19 electoral votes switching to Harris (245/293 nationally). Contributors identifies Preference as the driver, Allegheny as the strongest county, and the state flip as the electoral consequence.
- County inspection: Allegheny's ledger retains 720,504 total ballots, transfers 7,067 Trump ballots to Harris, and exposes 2,592 ballots outside terrain. The Data panel separately explains 125,172 off-map PA ballots and the 2020 VAP limitation.
- Restoration/replay: the PA recipe and Allegheny context survive URL reload; returning from replay preserves the modeled county ledger. Reported-so-far shares are explicitly limited to the three states and do not claim national results or projections.
- Routes: unsupported FL/TX paths remain mathematical requirements without local-model openers. MI/WI have detailed openers. Wisconsin has an explicit no-group-cells explanation, rather than substituted demographic controls.
- Phone: the original overlay dock remains usable, county breadcrumbs wrap, candidate values remain legible, and the map remains visible above the working drawer. Density and edit scope, rather than broken wrapping, are the remaining priorities.

## Verification

The corrected package passes TypeScript, production build, and retained-foundation verification (`work/v037-package-final.log`), then immutable inventory/input verification (`work/v037-verify.log`). Vite still reports the existing large-chunk advisory; this is not a new performance certification. No election data, model formulas, or map geometries changed.

HTTP responses for `/` and `/app/` on port 4175 separately match their corresponding packaged HTML entries. The national readout and synthetic replay disclosure were also retested through the live interface, and both Wisconsin route definitions were observed in the corrected build.

Fresh production-browser verification passes **6/6 in 2.2 minutes** (`work/v037-browser.log`): the national/state readout regression; three-state county/local identity and evidence; phone keyboard turnout/preference and exact reset; copied multi-state restoration in a separate tab; the complete desktop/phone replay journey; and Home entry. The replay journey includes play/pause, seeking, timing-profile changes, chart navigation, and return to editing, with new assertions for the synthetic-chronology disclosure.

Full-repository ESLint passed (`work/v037-lint.log`); the final changed source/test files were checked again (`work/v037-final-lint.log`). Git whitespace checks pass. Local captures in `screenshots/` cover Home, national baseline, PA/MI/WI county/local/evidence, mobile edit/reset, copied portfolio, and desktop/phone replay. Home, the desktop returns desk, and the phone local Inspector were visually inspected after the run; the latter informed R7. Generated packages and screenshot archives are not committed.

Prior v0.35 motion/reduced-motion checks and v0.36 demographic/route checks remain dated evidence, not newly rerun claims. This pass does not constitute a full browser/platform or screen-reader audit. The full model suite was not rerun for these presentation-only changes.

## Next work

Implement R4/R5 as a bounded interaction refinement, address R6 alongside it, and retest simple statewide edits against local inspection. Then use the existing neutral task cards with genuinely unfamiliar people once the documented delivery method permits it. Keep human observations separate from this technical review and preserve the external-delivery hold.
