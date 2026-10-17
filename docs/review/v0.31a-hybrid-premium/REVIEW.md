# Hybrid Premium — phase 1 workspace implementation

Date: 2026-10-12. Reviewer: Codex, informed AI technical review. Owner direction: Hybrid Premium specification supplied in this conversation.

Subsequent owner preference: the [dock adjustment](DOCK_ADJUSTMENT.md) restores its earlier slide-up behavior. This report preserves the initial phase 1 layout and its package identity; use the adjustment record for the current drawer and preview.

## Delivered

- Shared AppShell, GlobalHeader, WorkspaceHeader, WorkspaceLayout, AnalysisInspector, and WorkspaceDock components.
- Map and analysis rail beside each other; dock beneath both in reserved space. Removed 25 obsolete workspace-positioning blocks and the mobile rules that hid playback/seek controls.
- Collapsed, Working, and Expanded states, bounded pointer resize, keyboard resize, and per-workspace session settings. Working is the initial state.
- Collapsible independently scrolling analysis rail. Tablet/phone analysis can open separately while the map stays mounted. Compact navigation includes a menu and Escape focus restoration.
- Responsive DeckGL drawing dimensions and geography fitting, with camera retention through dock and inspector changes.
- Persistent map information, height controls, selection summaries, and legend moved into allocated layout regions.
- Paused replay survives navigation back to Swingometer and into Election Night when the authored scenario is unchanged. Explicit restart and changed scenarios still compile a fresh count.
- Ivory surfaces, editorial serif, navy/teal controls, party colors, geography, and evidence distinctions retained. Header status now describes the product rather than internal feature versions.

Detailed analytical content remains available through the existing panel tabs. This is the shell and overlay milestone; the complete typography/control design system, refined inspector content hierarchy, and later product polish are subsequent phases.

## Candidate and validation

Final local package: `824cafe540d81e8ec51bab97d8102f7b73d2a7056b16b4540fdf0cb7a4db0544`, served at `http://127.0.0.1:4173/`. Its [manifest](../../../outputs/0.30.0-rc.1/824cafe540d81e8ec51bab97d8102f7b73d2a7056b16b4540fdf0cb7a4db0544/manifest.json) inventories 246 files, 50,834,207 file-content bytes, and 372 source inputs. The packaging contract remains `0.30.0-rc.1`; `v0.31a` names this design workstream, not a new public release or Git tag. Existing immutable candidates are preserved.

The final shell acceptance run passed all seven cases in 2.9 minutes. TypeScript/production build, full lint, foundation retention, complete package/current-input verification, whitespace, and loopback HTTP checks passed.

| Browser verification | Result / exact scope |
|---|---|
| Final shell tests on development source matching the final manifest | Seven passed; six sizes plus camera/scenario/replay retention, keyboard and pointer resize |
| Packaged scenario/evidence/reset/link regressions | 26 passed on `3043c14dee527cc4dc7081843863cd8c69b39d76f2b14f01b29bb17ad9f65554`; its integrated replay case exposed the final drag-state issue |
| Corrected production package `824cafe…` | Full integrated replay and Home cases both passed in 1.2 minutes; replay includes chart seeking, profile changes, desktop/mobile pause, dragging, and return to editor |

All 34 selected browser cases have passing evidence across the runs; the 26 unaffected cases were not repeated after the final two-line resize-flag correction. The final seven shell cases and two production cases specifically cover that correction. Logs are under `work/`: `premium-resize-final.log`, `premium-final-production.log`, `premium-replay-final.log`, `premium-final-package.log`, and `premium-final-lint.log`.

Viewport checks exercise 1920 × 1080, 1440 × 900, 1366 × 768, 1024 × 768, 768 × 1024, and 390 × 844 in both modes and every dock state. They assert that the dock is in normal layout, map/dock boxes do not overlap, controls fit the page, drawing-buffer dimensions follow the viewport, and the map camera and authored URL remain stable. The seventh case checks per-workspace settings, paused replay retention, one map mount, keyboard resizing, and keyboard tab navigation.

Camera/runtime assertions run on the development build because its diagnostics hook is intentionally absent from production. Scenario, evidence, reset, copied-link, and full Election Night browser regressions run against the immutable production package. Test changes update intentionally changed UI assumptions (Working default, dock location, bounded resizing, and scrolling a chart into view); vote expectations are unchanged.

The first runs exposed legacy Election Night height overrides, a missing laptop navigation menu, hidden mobile seek controls, overly large chart heights, and mobile dock dimensions that left too little map space. The final integrated run also caught an empty inline-style attribute persisting after a pointer resize, which invalidated the grid row size on return to Swingometer. An explicit `data-dock-resizing` flag now governs the temporary size override; the new pointer-and-return regression and full replay both pass. These were addressed before the final review. Initial production attempts to use development-only diagnostics were a test setup mismatch, not an application failure.

Vite now ignores generated work/output/review files so trace generation cannot reload an active development test. Normal shell and interactive-browser helpers remained unavailable; approved local shell execution ran Playwright and the build. No external action was performed.

## Visual evidence and limits

The [laptop Swingometer](screenshots/swingometer-1366x768.png), [phone Swingometer](screenshots/swingometer-390x844.png), and corresponding Election Night captures are under `screenshots/`. Production review captures are under `screenshots/production/`.

This is selected Chromium viewport and keyboard coverage. It is not a comprehensive WCAG audit, a physical-device study, or unfamiliar-user acceptance. The existing bundle-size advisory remains. Human acceptance and external-delivery gates remain outstanding.

## Next design phase

Refine the shared typography and functional control scale, reduce duplicated result summaries, and improve the analysis inspector's organization. Keep the new shell as the layout boundary and compare subsequent work against these screenshots and state-preservation checks.
