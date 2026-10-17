# Hybrid Premium: Swingometer editor and contributor navigation

Date: 2026-10-12. Local UI milestone; packaging remains `0.30.0-rc.1`.

The assumption editor now uses the shared reading scale and 36px desktop / 44px compact controls. Geography and population context form a clear paired section. The selected operation and scenario-assumption label remain visible; a native keyboard-accessible disclosure holds the detailed changes, preserved quantities, feasible boundary, and turnout denominator. Sliders have a larger interaction area while retaining their narrow color tracks and the original numerical bounds.

The editor collapse button now hides its own controls, reports its expanded state, and has a descriptive accessible name. It previously only changed a class on the separate analysis rail, leaving dock controls visible. Collapsing and reopening preserves authored values.

Contributor navigation separates explanation view, geography, and operation filtering into labeled groups. Ranked rows use larger names and numbers, retain arrow-key navigation, and mark the currently selected geography. Certified/scenario structures, off-map explanations, and methodology remain available. The phone layout stacks the navigation groups.

The ivory/navy/teal theme, election colors, calculations, recipe format, map behavior, and owner's slide-up overlay dock are retained.

## Verification

The immutable local candidate is `eadf5c162bc2de7f8031824832513972439df66125d63e3365765e00f8ea906f`, in `outputs/0.30.0-rc.1/<content-id>/app`, served at `http://127.0.0.1:4173/app/`.

TypeScript and production build passed; the existing large-chunk advisory remains. Foundation retention and package verification passed with the existing PA/MI/WI foundations. Screenshots are in `screenshots/` and logs in `work/v031c-*.log`. The source and visual review cover Chromium; Firefox-specific track styling is included but no fresh Firefox run is claimed.

- Final lint passed.
- Final diagnostic browser run: **13 passed** in five minutes. This covers five demographic turnout/choice cases, the operation/denominator contract, two new desktop/phone editor-navigation cases, three baseline/three-state/reset/URL acceptance cases, and two causal-explanation cases.
- Exact packaged frontend: **two passed**, repeating the new desktop/phone interaction cases. These cover keyboard disclosure, collapse/reopen preserving the authored preference, control sizing, ranked-list arrow keys and activation, inspector return, selected-geography indication, view switching, and no mobile page overflow.
- Desktop and phone editor/contributor screenshots were visually reviewed. The final operation details are closed on entry and expandable without changing scenario values. One interim test used an incorrectly capitalized dock selector; it was corrected before the final runs. No product workaround or automatic retries were added.

This phase does not claim a fresh full model-suite or Election Night walkthrough; the preceding phase's replay checks remain dated evidence. No commit, public deployment, source outreach, or demographic migration was performed.

## Next

Apply the corresponding visual and interaction pass to Election Night's returns desk and replay controls. The overall premium-design work and human usability validation remain unfinished; this milestone completes the focused Swingometer editor/navigation pass.
