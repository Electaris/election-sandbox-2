# 0065 — Hybrid Premium shared workspace shell

Date: 2026-10-12. Direction: owner-supplied Hybrid Premium specification, phase 1.

Persistent Swingometer and Election Night panels previously used separate fixed positioning rules, covered the geographic workspace, and depended on artificial scroll spacers. The owner requested UI/UX refinement before further feature work while preserving the ivory, navy/teal, editorial typography, and geographic identity.

Use one AppShell with reserved header, workspace context, map/analysis layout, and dock rows. AnalysisInspector scrolls independently and can collapse. WorkspaceDock provides a bounded Collapsed/Working/Expanded model with pointer and keyboard controls. Each experience retains its own dock and inspector settings during the session. Home retains its editorial composition and shares the responsive global header.

Persistent geographic evidence, height controls, selection summaries, and legends occupy layout space. Dropdown navigation remains a transient overlay with Escape support. On compact viewports analysis becomes a separate view; the map remains mounted when hidden. Mobile dock dimensions reserve geographic space and playback/seek controls remain available in every state.

ResizeObserver updates the actual DeckGL drawing dimensions without automatically changing the camera. Geography fitting may zoom below the former full-page lower bound to accommodate shorter workspaces. Dock transitions and inspector tabs preserve the camera. Explicit Fit selection remains available.

Switching back to Swingometer pauses and retains the initialized replay. Returning to Election Night resumes that paused workspace when the authored recipe is unchanged. Changed recipes compile a new endpoint; Apply and restart count remains an explicit restart. Layout changes do not change votes or chronology.

This phase does not replace election foundations, map color interpolation, the election engine, or the replay worker. The next design phase addresses the shared typography/control scale and the information hierarchy inside the existing analytical panels. Full human usability, physical-device, and screen-reader validation remain pending.

See `docs/review/v0.31a-hybrid-premium/REVIEW.md` for package identity, exact test scope, and visual evidence. Earlier immutable review candidates remain available.

## Owner adjustment — 2026-10-12

The owner subsequently requested the bottom dock's earlier behavior. The slide-up overlay drawer, collapsed default, taller working/expanded states, and original drag thresholds are restored. The map retains its available dimensions and camera as the drawer opens; the remaining shared shell and analysis layout are retained. This supersedes the reserved-row requirement for the command drawer. See `docs/review/v0.31a-hybrid-premium/DOCK_ADJUSTMENT.md` for the current package and validation.
