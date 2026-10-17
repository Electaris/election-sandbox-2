# v0.36 — Local usability review readiness

**Current candidate:** the [v0.38 interaction refinement](../v0.38-interaction-refinement/REVIEW.md) addresses the remaining review findings. Use **http://127.0.0.1:4176/** for new sessions and record its final content ID from that review. Ports 4174/4175 below identify earlier evidence.

**Earlier technical review:** the [v0.37 informed review](../v0.37-technical-review/REVIEW.md) found and corrected a national-readout binding defect and clarified replay/route meaning. Its earlier corrected candidate uses port **4175**. The package identity and port 4174 below describe the original v0.36 evidence and remain historical.

Date: 2026-10-17. Human acceptance: **NOT RUN**. Unfamiliar-user sessions: **0**. This phase prepares and technically checks a candidate; it does not turn automated results into human evidence.

## Start here

Open **http://127.0.0.1:4174/** on this machine. This is the immutable production candidate. Port 4173 remains the development frontend and is not the study build. The packaged delivery document uses 4173 as an example; use 4174 for this review to keep the two servers distinct.

For the owner, begin with this 15-minute walkthrough:

1. Open Home and enter the laboratory. Explain what is certified and what you can change.
2. Change Pennsylvania, inspect what caused the movement, and check a source/coverage explanation.
3. Copy your scenario, open it in a new tab, and check the same assumptions and result return.
4. Open Election Night, pause and seek, then return to editing. Check that your scenario survived.
5. Repeat a core interaction at phone width. Record any confusing wording, wrong expectation, inaccessible control, or awkward navigation.

Then complete the [owner acceptance checklist](../v0.30-release-candidate/ACCEPTANCE.md), including Michigan, Wisconsin, group assumptions, and route construction. Keep owner results separate from unfamiliar-user results. For each finding, record the task, steps, expected/observed behavior, browser/device, severity, and this content ID. Completed records and personal details belong in a private research folder.

## Exact candidate

- Package version: `0.30.0-rc.1` (existing local candidate version; v0.36 names this readiness phase).
- Content ID: `d8580709d2c67909fc5d6094bae5b6964e7cf5125c7bbcca73db2962080e81db`.
- Source revision recorded in the manifest: `f28130cec8fb68008f7e98b7c01a6dadd2252110`.
- Directory: `outputs/0.30.0-rc.1/d8580709d2c67909fc5d6094bae5b6964e7cf5125c7bbcca73db2962080e81db/`.
- Manifest records a dirty working tree, including local review artifacts; this is not represented as a clean-checkout build.
- Verified with `npm run release:verify`; build inputs are unchanged and packaged inventory/hashes reconcile.
- Gate values: local owner review allowed; external delivery unauthorized; human acceptance incomplete; demographic migration disabled.

To restart the same review server from the project root:

```powershell
npm.cmd run preview -- --outDir outputs/0.30.0-rc.1/d8580709d2c67909fc5d6094bae5b6964e7cf5125c7bbcca73db2962080e81db/app --host 127.0.0.1 --port 4174 --strictPort
```

If the port is occupied, identify the listener before acting. Do not substitute another package or the development server while keeping this content ID in the session record. Do not use `file://` or expose the preview on a network interface.

## Testing pack

- [Moderator guide](MODERATOR_GUIDE.md): setup, neutral facilitation, answer rubric, severity, and exit criteria.
- [Participant task cards](PARTICIPANT_TASKS.md): first impression, the five original core tasks, and replay/demographic probes. Show one at a time.
- [Blank session record](SESSION_TEMPLATE.md): anonymous observations and interpretation before coaching.

The old v0.19.1 protocol remains historical evidence. The new guide updates build identity, Home entry, Wisconsin, group controls, and replay for the assembled product without claiming the old study ran or passed. At least three genuinely unfamiliar humans are required; five to ten is preferable. The owner and AI do not count toward that sample.

## Technical evidence

Packaging, TypeScript, production build, and retained-foundation verification passed (`work/v036-package.log`, `work/v036-package-verify.log`). The 246 packaged files and 383 build inputs reconcile. HTTP responses for both `/` and `/app/` were separately hashed against their manifest entries, confirming the review server serves this candidate.

Production browser verification used `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4174`:

- The initial 16-case run had 14 passes and two test-harness failures (`work/v036-acceptance-browser.log`, 6.8 minutes). Passing coverage included PA/MI/WI county/local identity and evidence, keyboard edits and exact reset, copied multi-state restoration, demographic assumptions and WI exclusions, alphanumeric VTDs, Michigan bridges, rapid worker updates, portfolio aggregation, zero-EV changes, and route construction.
- The future-link test still hard-coded port 4173. It now requires the exact configured origin and clean `/app/` path. The canonical restoration workflow exceeded its default 30-second whole-test budget while the captured result was already R +5.8. Its cold-load budget is now 60 seconds and its exact result is queried from the owning effect grid; the expected result and selected VTD remain unchanged.
- Both corrected cases, the full desktop/phone replay journey, and the Home introduction pass in the final four-case run (`work/v036-final-journeys.log`, 2.7 minutes). There are 18 distinct passing cases across these runs, not one fully green initial 16-case run.
- The changed test file passes ESLint (`work/v036-test-lint.log`). Research-document links and Git whitespace checks pass. No application, model, dataset, or package-input source changed during this readiness phase.

Local screenshots and companion scenario/evidence JSON are under `screenshots/`; generated packages and screenshot archives are not committed. Existing v0.35 visual/motion evidence remains dated prior evidence rather than a new human test. No technical finding in this preparation is represented as a participant observation.

## Gate status and next action

| Item | Status |
| --- | --- |
| Immutable local review candidate | Packaged and hash-verified |
| Owner walkthrough A1–A10 | NOT RUN |
| Five core tasks with new humans | NOT RUN |
| Home/replay/demographic comprehension probes | NOT RUN |
| Human findings and triage | No observations collected; not a zero-defect claim |
| External PA/MI artifact delivery | Recorded hold; no new disposition |
| Hosted beta / public or paid launch | Not authorized by this phase |

The immediate action is the local owner walkthrough and recording concrete findings. Prepare unfamiliar-user sessions with this pack once the intended delivery method has a documented supported disposition. No invitations, outreach, deployments, source-data migrations, or fabricated human results are part of this work.
