# v0.38 — Statewide editing and local inspection

Date: 2026-10-17. Implements the remaining R4–R7 findings from the [informed review](../v0.37-technical-review/REVIEW.md). This is an interaction refinement of the existing editorial direction, not a new visual theme or model release.

## Changes

- Turnout now follows participation → shared Harris split → operation summary → exact reset. Group sliders, authored candidate vectors, and contribution/sensitivity detail follow in an optional native disclosure. Baseline scenarios start closed; restored group additions or custom candidate choices start open. The disclosure says when group additions are active, and closing it never resets a recipe. Wisconsin's capability explanation stays visible without implying compatible group cells exist.
- The drawer identifies **Statewide assumptions · [state]**. Behavior repeats the state scope; inspecting a county or local unit adds an explicit explanation that controls apply across the state. Editing remains statewide, with the existing capacity constraints and exact aggregation.
- Expanded/working drawer headings identify the current task instead of repeating a long selected-unit name. The Inspector's full geography name and context wrap. On phones, navigation ancestors use compact text above the selected geography, and comparison controls receive a separate row. Inspector actions move below its full identity.
- County map instructions use Pennsylvania voting districts, Michigan precincts, and Wisconsin reconstructed wards. Source contracts and reconstruction qualifications remain in place.

The original slide-up overlay dock retains collapsed/working/expanded positions, dragging, keyboard resize, and the existing reserved collapsed strip. No new animation was added. Certified results, demographic foundations, recipe schema, electoral allocation, replay arithmetic, camera behavior, and party palette are unchanged.

## Verification and candidate

- Final content ID: `1e9af572cd6923a7243535a7e80878f04ba01de77d08ef1f310681bd2726c608`.
- Local review: **http://127.0.0.1:4176/**. Port 4173 remains development; prior packages remain intact.
- Package version: `0.30.0-rc.1`, manifest source HEAD `62dd94f` with a recorded dirty working tree containing these changes and local review artifacts.
- Build, TypeScript, retained-foundation gate, and immutable package/input verification pass (`work/v038-package-final.log`, `work/v038-verify-final.log`). The existing Vite large-chunk advisory remains.
- ESLint passes for the changed source and tests (`work/v038-lint-final.log`). Git whitespace checks pass. No model/data changes required a fresh full model-suite run.
- Home and laboratory HTTP responses separately match their corresponding final packaged HTML files (`work/v038-http.log`).

The first package (`5f09bf707e9a6c853fc07e3560b10dcd38e615c77d2aeed0f3deeeda196c9bd2`) passed all **13 browser cases in 3.8 minutes** (`work/v038-browser.log`): five demographic cases, two interaction cases, the national-readout regression, three acceptance journeys, and two Home/replay journeys. After the final narrow-phone breadcrumb/caption adjustment, the interaction, acceptance, and replay journeys were rerun against the final package; the result is recorded below.

**Final retest: 7/7 pass in 2.8 minutes** (`work/v038-browser-final.log`). This includes the added 320-pixel no-overflow/header-height/full-name checks, keyboard edits and collapse/restore behavior, exact reset, PA/MI/WI county/local evidence, clipboard restoration, and desktop/phone replay. These seven overlap the first run; this is 13 distinct passing cases across the two packages, not 20 distinct cases. Final phone and narrow-phone captures were visually inspected.

To restart the final preview:

```powershell
npm.cmd run preview -- --outDir outputs/0.30.0-rc.1/1e9af572cd6923a7243535a7e80878f04ba01de77d08ef1f310681bd2726c608/app --host 127.0.0.1 --port 4176 --strictPort
```

The new browser cases exercise primary-control order, keyboard edits, opening/closing group controls without losing a recipe, restoring active group settings, exact reset, full phone Inspector identity, explicit statewide scope, and narrow-phone layout. Existing demographic, national-readout, release-acceptance, and full replay cases provide integration coverage.

Manual browser inspection covers ordinary compact width, 1440 × 900, 1024 × 768, 390 × 844, and 320 × 740. Reviewing the narrow-phone view prompted a second refinement: compact ancestors and a separate comparison row prevent the long local breadcrumb from competing with the mode controls. Keyboard End/Home still expands/collapses the laboratory drawer. Remaining map visibility while the working drawer is open follows the preserved overlay behavior; collapsing the drawer restores the full map area.

Generated screenshot evidence lives in `screenshots/` locally and is not committed. No human participant results are claimed. Human acceptance remains NOT RUN, external delivery remains held, and no hosted deployment or demographic migration was performed.

## Next validation

Use the [neutral task cards](../v0.36-usability-readiness/PARTICIPANT_TASKS.md) against this candidate. Pay particular attention to whether unfamiliar users recognize statewide authorship while inspecting local results and can discover the optional group controls. Preserve the documented delivery disposition and separate actual participant observations from informed technical checks.
