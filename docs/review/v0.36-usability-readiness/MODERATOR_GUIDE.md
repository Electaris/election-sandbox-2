# Assembled-product usability guide

Status: PREPARED; human sessions NOT RUN. Applies to the v0.35 editorial product packaged during v0.36 readiness. This is a current-build addendum to the [original human protocol](../../research/HUMAN_ALPHA_PROTOCOL.md), not a retroactive completion of its frozen historical cohort.

## Delivery and build identity

Use the exact immutable candidate and local URL recorded in [READINESS.md](READINESS.md). The supported current delivery is local owner review on this machine. Do not send the URL, artifacts, invitations, or recordings to participants until a documented delivery decision permits that audience and method. Loopback is only reachable on the serving machine; it is not a remotely shareable beta URL. Decision 0027 superseded the old development freeze, not the human-validation or delivery requirements.

Once a permitted study starts, keep its content ID fixed for a cohort. Record every changed build and relevant retest. Never silently replace the candidate during a session. The live source server on 4173 is for development; the review server uses 4174 and immutable packaged assets.

## Owner walkthrough first

The owner can use the packaged [v0.30 acceptance checklist](../v0.30-release-candidate/ACCEPTANCE.md), which still covers the assembled feature set. Record results separately from the automated evidence. Owner familiarity does not count toward the unfamiliar-user sample. Give the owner a 15-minute first pass: open Home, create a PA change, inspect its explanation and sources, copy/reopen it, pause/seek Election Night, and return to editing. Then complete the remaining acceptance rows, including MI/WI and group assumptions.

## Unfamiliar-user study once delivery is cleared

Recruit at least three genuinely new people; five to ten is preferable. Include a cautious novice, a casual election follower, and an experienced analytical reader. The owner, contributors, and previously coached users do not count. Do not recruit or send messages automatically from this preparation.

Allow 45–60 minutes for the homepage impression, five core tasks, replay and demographic probes, and debrief. Use the person's normal desktop/laptop; offer a phone follow-up. Record browser, viewport, ordinary input method, and reduced-motion preference. Use anonymous IDs and keep completed records outside this public repository. Obtain explicit consent before recording; a written observation sheet is sufficient.

Read the opening and then provide [one task card](PARTICIPANT_TASKS.md) at a time. Start at Home without scenario parameters. The first-impression observation is new; Tasks 1–5 preserve the original core task intentions. Tasks 6–7 assess features added since the historical protocol. Do not compare aggregate completion rates across these differently scoped cohorts.

## Facilitation

Do not demonstrate navigation or explain the terminology first. Neutral prompts: “What do you expect that to do?”, “What does that number mean?”, or repeat the task. Record failure or major help before teaching a solution. After each task, capture the person's explanation and confidence before correcting them. Reset to baseline between tasks only if needed and record the intervention. Supply a blank tab only after the participant independently attempts saving/sharing.

Use the [session template](SESSION_TEMPLATE.md). Record observable behavior, wrong turns, help, interpretation, and reproducible evidence separately from your inference. Report counts and recurring themes, not percentages from a tiny sample. Never fill a human result from browser automation or AI review.

## Moderator-only success criteria

| Task | Evidence of understanding |
| --- | --- |
| First impression | Recognizes historical exploration and authored counterfactuals; does not assume forecasting or live news. |
| 1 | Harris wins PA; contributor evidence supports the explanation rather than prior geographic beliefs. |
| 2 | PA improves but remains unflipped; identifies the current remaining margin-vote gap rather than the baseline gap. |
| 3 | Uses the net-margin-vote route metric; begins a supported state and distinguishes mathematical requirements from locally modeled states. |
| 4 | Restores the same recipes, selected geography, and EV consequences in a fresh tab; understands the versioned URL is the saved object. |
| 5 | Distinguishes Actual/Scenario and changed-but-not-flipped states from changed EV allocations. |
| 6 | Pause and seek behave as expected; editing restores the authored scenario. Explains synthetic reporting schedules, only three participating states, and the absence of forecasts or calls. |
| 7 | Understands group turnout and candidate shares as authored assumptions; does not infer individual behavior. Recognizes WI lacks compatible group composition. |

Ask the original comprehension questions about Required/Modeled/Satisfied, 50,000 transferred ballots versus 100,000 H–T margin movement, URL restoration, provenance, and geography. Include Wisconsin's reconstructed ward estimates, off-map votes remaining in totals, and VAP being neither CVAP nor current eligibility. Do not give these definitions before collecting answers.

## Triage and exit

P0: irreconcilable totals, lost/corrupted scenarios, invalid EV allocation, or data exposure. P1: a materially wrong mental model, broken/inaccessible primary task, or evidence overstated by the interface. P2: recoverable substantial friction. P3: minor polish/preference. Keep feature requests separate from defects.

Stop and fix a P0 before continuing. Triage repeated P1 findings before expanding scope. A software correction needs relevant model/browser checks; changed presentation needs responsive and keyboard review. A human comprehension finding also needs a subsequent human retest: automation alone cannot close it. Keep unresolved P2/P3 items with an explicit disposition.

The study is complete only after at least three new humans finish the five core tasks, the assembled-product probes are recorded, all P0 and repeated P1 findings are corrected and retested, and an explicit review accepts remaining issues. Delivery rights and a launch decision remain separate gates.
