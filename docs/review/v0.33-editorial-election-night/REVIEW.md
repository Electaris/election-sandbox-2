# Editorial Election Night

2026-10-17. Local UI milestone; package version remains `0.30.0-rc.1`.

Election Night now carries the original American Electorate masthead, underlined workspace navigation, larger geography heading, and editorial rules used by the homepage and Swingometer. The returns desk leads with reported ballot totals and all five candidate totals/shares across PA, MI, and WI. Candidate figures reconcile to the published three-state ballot total. These are observed scenario-replay results, not national results, projections, race calls, or forecasts.

The state ledger is now selectable. Each state shows its reported leader, published/expected reporting units, and reporting-unit progress. Selecting a state changes the map context without restarting the count or changing its reported aggregate. The existing jurisdiction exclusion remains explicit.

The slide-up overlay dock retains its entry state, snap presets, drag/keyboard resizing, playback speed, seeking, reset, profiles, and return-to-Swingometer behavior. The presentation uses readable labels, a compact Eastern-time clock with the date separated above it on desktop, straighter edges, editorial sections, and improved return-feed/settings typography. The compact collapsed dock retains its existing height while keeping the clock, playback, seek, and snap controls visible. The local-return feed is also available at compact widths instead of being suppressed by the older tablet layout.

Visual review found that choosing a state while compact analysis hides the map could compute a fit from a zero-size viewport. State framing now waits until the mounted map has measurable dimensions. The existing framed-state guard prevents ordinary dock and inspector resizing from resetting the camera. No map remount or change to election calculations was introduced.

## Verification

Production build, including the retained PA/MI/WI foundation gate, and lint passed. The existing large-bundle advisory remains. **All 11 final browser cases passed** in 3.8 minutes: two new returns-desk cases, six viewport/dock cases, one scenario/replay/camera preservation case, the integrated replay walkthrough, and the homepage entry case.

The new cases verify reported-vote reconciliation, state selection preserving replay time/progress, readable counts, bounded header/clock controls, and the hidden-map fit at desktop and phone sizes. The integrated walkthrough covers playing/pausing, seeking, chart interaction, reporting profiles, county overrides, compact controls, and returning to Swingometer on the persistent map. Earlier diagnostic runs were stopped for visual corrections before this complete final run; no automatic retries or test workarounds were added.

Desktop and phone screenshots were visually reviewed. Screenshots are local under `screenshots/`; logs are under `work/editorial-night-verified-*.log`. No fresh full model-suite or human usability run is claimed for this UI milestone; the preceding 302-test model/runtime result remains dated evidence.

## Source control and next phase

Continue the owner's authorized incremental pushes on `codex/editorial-swingometer`. Generated screenshots, test output, and packages remain excluded from the source commit. The next phase is a cross-page consistency and usability pass across Home, Swingometer, and Election Night, including compact navigation, empty/loading states, and the remaining small text in secondary analytical panels. Human validation and the previously recorded external-delivery gates remain separate from local technical checks.
