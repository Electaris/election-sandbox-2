# v0.34 — Presidential Atlas editorial experience

Date: 2026-10-17. Original American Electorate design; 2024 only. This is a source milestone, not a deployment or public-release clearance.

## Audit and implementation plan

The existing application uses React 19, TypeScript, Vite, deck.gl OrbitView/GeoJsonLayer, lazy-loaded map and chart modules, and worker-isolated scenario/replay calculations. Newsreader, Libre Franklin, DM Mono, the warm paper palette, shared workspace shell, and state-specific data contracts already support the requested direction. Preserve them. The map already uses real state/county geometries and retained local foundations; replacing it would create unnecessary risk.

The homepage needed a stronger composition and a substantive editorial comparison, rather than another repeated card grid. Existing illustrative replay bars had no quantitative meaning. Camera easing used a separate requestAnimationFrame loop; map transitions lacked a system reduced-motion response. National terrain height included an additive offset and the shared legend described ballots even at national scale. Home could inherit scenario view mode beside a certified-baseline score.

Implementation sequence: strengthen the opening; add an exact-data geography chapter; replace illustrative charts and repeated state cards with editorial sequences and index rows; introduce scoped GSAP motion; improve map integrity, interruption, and reduced motion; validate the complete scenario/replay journey and visually inspect responsive captures.

## Implemented

- Monumental three-line opening, synchronized introduction, quieter map framing, prominent certified EV totals, and explicit cartography instructions. Phone typography and masthead keep the opening compact and readable.
- A seven-battleground comparison calculated directly from `states2024`, with a shared zero-to-six-point scale, exact two-decimal margins, EV allocations, explicit denominator, and FEC source attribution. Narrative chapters inspect WI, MI, and PA without pretending the other states have detailed models.
- Desktop CSS-sticky comparison paired with ScrollTrigger chapter emphasis and a scrubbed reading indicator. Tablet, phone, and reduced-motion readers receive a normal document flow with all content available. Native chapter anchors and keyboard-operable inspection buttons work independently of motion.
- Flat state index rows replace the repeated three-column cards. Real workflow steps replace the decorative mock sliders and arbitrary replay bars.
- GSAP and official `@gsap/react` integration. Intro timelines use scoped `useGSAP` and `matchMedia`, with cleanup on workspace changes. No essential content is hidden in the stylesheet. Electoral score transitions animate presentation, keeping the exact final number in the DOM throughout.
- Camera animation now uses one interruptible GSAP tween, preserving deck.gl as the sole renderer. New camera commands replace prior motion; zoom/drag cancels it; unmount cleans up. No competing camera loop or scroll-driven camera hijacking.
- System reduced motion disables the intro and scroll animation, removes sticky narrative pacing, and makes camera and deck attribute transitions immediate. Preference changes are observed during the session.
- National extrusion is directly proportional to certified EV allocation. Richer state hover details explicitly distinguish certified, scenario, and reported results and show Harris, Trump, and total ballots.
- Home forces actual map colors and removes scenario route/return overlays. National legend correctly identifies electoral-vote height. Scenario arithmetic, replay endpoints, geographic contracts, palette, and the preferred slide-up dock remain intact.

## Verification

All final checks passed against the Vite source frontend on port 4173:

| Check | Result | Local evidence |
| --- | --- | --- |
| TypeScript, production build, retained-foundation gate | PASS | `work/atlas-final-build.log` |
| ESLint | PASS | `work/atlas-final-lint.log` |
| Home, returns desk, six workspace sizes, overlay dock, navigation, Swingometer editor/contributors, full replay journey, initial motion checks | 20 passed, 5.5 minutes | `work/atlas-final-browser.log` |
| Final exact-data comparisons at 1440/768/390/320 px, reduced motion, repeated Home visits, live preference/viewport changes, camera interruption | 7 passed, 1.3 minutes | `work/atlas-motion-browser.log` |
| Production dependency audit | 0 vulnerabilities | `work/atlas-production-audit.json` |
| Git whitespace check | PASS | `git diff --cached --check` |

The focused final run overlaps five cases from the broader run and adds 320 px and camera-interruption coverage; these are not 27 distinct tests. Its repeated-navigation assertions were strengthened after the broader run. An earlier focused attempt was stopped to correct the national button selector from “Fit selection” to “Fit United States”; the final complete run passes. Browser execution used the installed host Chromium because the restricted environment has a separate empty browser cache.

Visually inspected the opening at desktop, tablet, 390 px, and 320 px, the sticky desktop narrative, and the complete phone comparison. Fixed a phone masthead wrap, improved phone opening density, aligned the quantitative axis with the bars, and corrected the national height legend. Existing workspace tests cover 1920×1080, 1440×900, 1366×768, 1024×768, 768×1024, and 390×844. Candidate totals, exact comparisons, accessible chapter entry, one persistent map, trigger disposal, and paused replay/scenario preservation have browser assertions. Screenshots are local review evidence under `screenshots/`; generated archives are not included in the source commit.

## Scope and remaining limits

2016/2020 switching is intentionally absent, as requested. No historical results, reporting timestamps, projections, calls, or additional detailed states were invented. Election Night remains a historical scenario replay, not a reconstruction of documented real-time reporting chronology. Flip was unnecessary because the retained map and dock do not need reparenting. Map and analytical-chart code splitting remains in place; this pass does not claim a new performance benchmark or full model-suite run.

The existing external font request retains local serif/sans/monospace fallbacks. WebGL remains required for interactive terrain; the national baseline, textual comparisons, detailed-state links, and analytical controls are ordinary DOM content. Human usability testing and recorded delivery gates remain outstanding.

GSAP lifecycle implementation references: [official React integration](https://github.com/greensock/react), [matchMedia](https://gsap.com/docs/v3/GSAP/gsap.matchMedia()), [ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/).
