# v0.35 — Static-first art direction

Date: 2026-10-17. Original American Electorate design. Source milestone only.

## Review and decisions

Reviewed the opening, geographic narrative, state index, experience modules, principle/methodology section, Swingometer analysis and all five drawer tabs, and Election Night. Initial review used the v0.34 captures; current captures use reduced motion so no reveal, count-up, or camera animation can disguise a weak layout.

The opening had an oversized headline competing with detached statistics and an undersized map. Reduced its type slightly, shortened the masthead and vertical padding, and widened the terrain column. The complete map now occupies its frame more confidently. Phone terrain uses a shorter frame so all state shapes can appear within the opening viewport at 390 px. The 320 px layout remains scrollable without horizontal overflow.

An enlarged perspective map crowded southern states against the frame. Switched the existing deck.gl OrbitView to orthographic projection and fit its rotated footprint with space for electoral-vote extrusion. This removes perspective size exaggeration while preserving the same Albers geometry, state positions/insets, EV heights, lighting, palette, orbit, zoom, selection, and interruptible camera controls. No second renderer or decorative geographic substitutes.

The opening legend now uses all 22 discrete swatches directly from the same `majorPartyBands` array as the map. Endpoint and near-tie labels accompany a screen-reader description of all intervals. Removed repeated caption/legend language. No election totals, model arithmetic, replay chronology, demographic foundation, or source artifact changed.

Removed generic raised segmented controls, map background washes, rounded readout framing, rounded contributor/assumption/source panels, and metric tiles. Preserve the owner's overlay dock, its familiar presets, keyboard/pointer resizing, and accessible control sizes. Shortened narrative whitespace and balanced module footnotes and actions.

The Data and Assumptions tabs still carried legacy 7–9 px typography. Source evidence is now a ruled two-column ledger on desktop and one column on phones, with 11 px minimum evidence notes and full-size source links. Assumption rows now use 14 px headings and 12 px explanatory copy without fading inactive assumptions into illegibility. Inspector empty guidance uses the editorial heading and reading scale.

GSAP is quieter: a coordinated 450–490 ms eyebrow/headline/score introduction replaces line staggering and the moving map entrance. The map, action links, and body copy remain anchored and available. Existing scoped cleanup, reduced motion, scroll emphasis, exact numeric text, and camera interruption remain intact.

## Verification

Production build, TypeScript, and retained-foundation verification pass (`work/art-direction-final-build.log`). The final full repository ESLint scan passes (`work/art-direction-final-lint.log`). Local screenshot evidence is in `screenshots/` and is excluded from the source commit.

- The broad browser run completed 22 passing cases and one camera-observation failure in 10.8 minutes (`work/art-direction-final-browser.log`). Coverage includes all six workspace sizes, the full replay journey, exact reported totals, source/state entry, scenario editing, keyboard contributor navigation, reduced motion, and repeated workspace visits.
- The failed camera assertion polled for a short-lived active handle after an automation round trip. Under load the tween could finish before that poll began. The test now waits for the mounted canvas and observes the animation within the browser before exercising real wheel input; it still requires an active animation, verifies cancellation without a late camera writer, and checks immediate reduced-motion fitting. The corrected focused case passes (`work/art-direction-camera-final.log`, 26.4 seconds). This is a harness synchronization correction, not a weakened camera contract or a claimed fully green single broad run.
- Final static review captures after ledger refinements: three cases pass at 1440, 1024, and 390 px (`work/art-direction-static-final.log`, 2.4 minutes).
- Visual inspection caught the phone Inspector heading and help text sharing a line. Explicit document flow and a bounding-box assertion correct it; the final phone case passes (`work/art-direction-phone-final.log`, 42.1 seconds).
- Visually inspected the desktop opening and state index/modules, desktop analysis/editor/contributors/source and assumption ledgers, and phone opening, analysis, Inspector, source ledger, and Election Night. Camera and numerical meaning remain stable without motion. Git whitespace verification passes.

The new `editorial-refinement.spec.ts` captures desktop 1440×900, tablet 1024×768, and phone 390×844 with reduced motion. It checks every legend swatch against the palette, source note legibility, page overflow, entry into a detailed state, all five Swingometer tabs, and a settled paused replay. Screenshots include the complete homepage composition, state index, experience modules, methodology, analysis, editor, contributors, inspector, assumptions, source evidence, and Election Night.

## Limits

This is a visual refinement, not a new dataset, migration, model release, hosted deployment, device performance benchmark, or human-usability pass. The 2024-only scope and existing release gates remain. WebGL still supplies interactive terrain; ordinary DOM results, comparison text, and scenario controls remain the textual interface. Previous review records describe earlier designs rather than the final styling here.
