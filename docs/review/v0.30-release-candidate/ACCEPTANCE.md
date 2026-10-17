# Local owner acceptance checklist

Candidate: `0.30.0-rc.1`. Record the complete content ID from `manifest.json` before reviewing. All results below start **NOT RUN**. Prior automated or AI reviews do not fill in human results.

Use the local candidate through the delivery instructions. Reset between tasks where indicated. Record the scenario URL, observed behavior, screenshot or reproducible steps, severity, and reviewer for each finding. This is an owner walkthrough; the deferred unfamiliar-user study remains separate.

| ID | Action | Expected observable result | Result |
|---|---|---|---|
| A1 | Open Home, then the laboratory, with no scenario. | National Actual: 155,238,302 ballots; Harris 226 / Trump 312 EV. The product is described as a counterfactual laboratory. | NOT RUN |
| A2 | Enter PA, MI, then WI; inspect a county and local unit in each. | State/local identity stays correct after switching. Evidence identifies PA VTDs, MI precincts/bridge limitations, and reconstructed WI wards. | NOT RUN |
| A3 | In PA, apply turnout and preference changes, then reset. | Changes propagate to local, county, state, and national totals. Reset returns the exact baseline. Turnout addition and vote transfer have distinct explanations. | NOT RUN |
| A4 | Add a PA or MI group-turnout assumption and authored candidate shares. Then inspect WI behavior controls. | PA/MI expose authored assumptions without claiming observed preferences. WI clearly lacks compatible group composition and cannot apply those controls. | NOT RUN |
| A5 | Make a multi-state scenario, copy its link, and reopen it in another local tab. | State recipes, selected geography, resulting totals, and electoral consequences restore. Current canonical links use schema 4. | NOT RUN |
| A6 | Use contribution rankings and Path to 270 before and after a state flips. | The user can explain which assumptions/geographies changed the result and distinguish Required, Modeled, and Satisfied. Unsupported detailed states are not implied to have precinct evidence. | NOT RUN |
| A7 | Inspect denominator and result coverage. | Unavailable evidence is explicit; off-map votes remain in totals without arbitrary map placement. VAP is not represented as current eligible voters or observed turnout. | NOT RUN |
| A8 | Enter Election Night; play, pause, seek backward/forward, change an explicit reporting profile, and return to the editor. | The map persists, the replay follows the authored endpoint, and displayed returns reflect the visible count. There are no forecast/call claims or statewide fallback returns for other states. | NOT RUN |
| A9 | Repeat a scenario edit, local inspection, and replay transition at mobile width; navigate core controls by keyboard. | Controls remain reachable, labels and focus are understandable, and horizontal page overflow does not prevent the tasks. Record any readability/accessibility problems. | NOT RUN |
| A10 | Explain the model without consulting documentation. | The reviewer distinguishes historical baseline, authored assumptions, reconstructed evidence, and deterministic reporting simulation from prediction or observed individual behavior. | NOT RUN |

## Finding record

Copy for each finding: content ID; task ID; reviewer/date; browser/device; scenario URL; steps; expected/actual; screenshot; severity; proposed correction; retest result.

- P0: data loss, exposure outside the allowed delivery boundary, or unusable primary workflow.
- P1: wrong baseline/consequence, broken replay/restore, misleading evidence claim, or inaccessible core task.
- P2: recoverable workflow/comprehension defect that materially impairs use.
- P3: minor presentation issue.

Do not mark a task passed merely because its automated counterpart passed. A changed build requires a new content ID and relevant retesting. Owner completion does not satisfy the unfamiliar-user study or resolve data-delivery authorization. A release decision must record open findings and the separate external-delivery gates.
