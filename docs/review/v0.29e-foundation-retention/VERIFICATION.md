# v0.29E verification

Package version: 0.29.7. Checks started 2026-09-08; final checks completed 2026-09-12.

| Check | Result |
|---|---|
| Full existing Node suite (`npm test`) | 287 passed, 0 failed; includes model, demographic, analytics, and replay suites |
| New retention suite (`tests/foundation-retention.test.mjs`) | 9 passed, 0 failed; final rerun on September 12 |
| Retention report reverse-order reproduction | Passed; both outputs identical |
| Selected integrated browser suite | 21 distinct cases passed across initial run and targeted reruns; details below |
| Full ESLint | Passed; final touched-code lint also passed after browser-test edits |
| Standard production build | Passed, including the new prebuild retention verifier |
| Pages production build | Passed, including its prebuild retention verifier; no deployment |
| Whitespace check | Passed |

There are **296 passing Node tests** across the full existing suite and the nine new retention tests. The full suite began before the new test file was created; it is not counted twice. Production builds retain the existing large-chunk advisory.

## Browser results and corrections

The selected suite used these six files:

```sh
npx playwright test tests/browser/demographic-turnout.spec.ts tests/browser/scenario-replay.spec.ts tests/browser/wisconsin-detailed-state.spec.ts tests/browser/runtime-hardening.spec.ts tests/browser/replay-experience.spec.ts tests/browser/scenario-explanation.spec.ts
```

The initial run passed 19 of 21 cases. Two follow-ups resolved the remaining checks:

1. `rapid scenario changes publish only the newest worker result` expected canonical scenario schema `2`, although the current serializer emits `4`. The displayed final scenario was correct. The assertion now expects `4`, and the targeted rerun passed. This is a stale test correction, not a runtime serializer change.
2. `Election Night runs the Swingometer result on the persistent atlas map` reached the final editor transition but exhausted its 180-second whole-test timeout while the full Node suite was running concurrently. An isolated rerun after that suite completed passed in approximately 2.3 minutes on September 12, with the same timeout and assertions. No timeout increase or runtime workaround was applied. This run also captured nine screenshots in this review directory.

The isolated rerun used `SANDBOX_REVIEW_SCREENSHOT_DIR` to direct captures here and `--output=work/v029e/election-night-rerun` for diagnostics. The browser test now supports that optional screenshot-directory override; its default is unchanged.

After the isolated case passed, the Windows runner stalled while shutting down its temporary Vite server. The two remaining server Node processes were identified from the run's own logs and start times, then stopped. The runner completed with exit code 0 and reported one passing test. This was test-server cleanup, not an application fix or a skipped assertion.

Coverage includes PA/MI group behavior and URL replay, Wisconsin's unavailable composition, reconstructed wards, mobile layouts, rapid updates, worker lifecycle and stale-response rejection, multi-state portfolios, explanation, and Election Night playback/seek/director/desktop/mobile transitions. This is the selected 21-case integration set, not a claim that every browser test in the repository was rerun.

Fresh [desktop](screenshots/integrated-election-night-desktop.png) and [mobile](screenshots/integrated-election-night-mobile.png) captures were visually inspected. Additional screenshots record timeline, velocity, reporting comparison, local returns, and the director. The screenshots retain the application's existing feature-version label; no frontend release-label change was made.

## Retention and scope

The new tests verify exact baselines, off-map accounting, state-specific capabilities, deterministic report identity, rejection of missing/duplicate/unknown states and policy fields, refusal to relabel retention as admission or source resolution, source-content drift, invalid paths/pins, cross-state runtime routing, unsupported Wisconsin capability, and omitted county-map checksums.

The runtime demographic artifacts and geometry files retain their existing bytes. No candidate migration, source-owner contact, raw-source/GIS rebuild, human study, or deployment occurred. Michigan's source hold and the recorded delivery gates remain in force. These technical checks do not replace human acceptance or authorize public/paid delivery.

Detailed command logs are cached under `work/v029e/` (ignored): `node-tests.log`, `retention-tests-final.log`, `browser-tests.log`, `rapid-rerun.log`, `election-night-rerun.log`, `lint.log`, `final-touched-lint.log`, `build.log`, and `pages-build.log`. This checked record preserves outcomes and limitations if that cache is removed.
