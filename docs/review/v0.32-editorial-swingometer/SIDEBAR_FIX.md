# Sidebar readability correction

2026-10-17. The owner reported cramped text and awkward wrapping in the analysis rail.

The route list previously compressed five columns into a roughly 270–315px reading area, while state-flip metrics squeezed three text-heavy values into equal columns. These now use labeled state cards and label/value rows. Active-state consequences separate Actual and Scenario into two readable columns below the state and electoral consequence. Route labels, controls, totals, and explanations use 11–14px interface text rather than the legacy 6–8px table styles. Ranking controls and alternative-route actions have 44px minimum heights. Candidate controls use a balanced grid, and seven-digit headline counts stay together.

The Path heading is shortened to “Routes to a majority.” Values, route ranking, target selection, scenario recipes, and election arithmetic are unchanged. The existing slide-up dock remains intact.

## Verification

Build (including foundation retention) and lint passed. **All 11 browser cases passed** in two minutes: three new cases at 1440×900, 1100×800, and 390×844, plus all eight existing scenario-replay cases. The new cases use a Pennsylvania scenario moving away from Harris and a remaining requirement above one million votes. They check bounded text, readable route figures, explicit Actual/Scenario labels, large-count wrapping, route selection, and no page overflow. The existing cases cover portfolio switching, worker publication, URL reconstruction, zero-EV consequences, and a Michigan route becoming modeled, satisfied, and reversible. Its obsolete homepage CTA selector was updated to the current “Enter the laboratory” label.

Desktop/narrow-desktop/phone screenshots are local under `sidebar-fix/`. The state-flip and visible route-card sections were visually inspected. Screenshot archives remain excluded from source pushes. No fresh full model-suite run is claimed for this layout-only correction.
