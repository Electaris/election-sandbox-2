# Sandbox 2.0

An interactive 3D laboratory for building United States presidential-election counterfactuals and watching those scenarios unfold through detailed local returns.

<p>
  <img alt="Local candidate v0.30.0-rc.1" src="https://img.shields.io/badge/local_candidate-v0.30.0--rc.1-285b70" />
  <img alt="269 tests passing" src="https://img.shields.io/badge/tests-269%20passing-4c8d78" />
  <img alt="React 19" src="https://img.shields.io/badge/React-19-3b7f9d" />
  <img alt="deck.gl 9" src="https://img.shields.io/badge/deck.gl-9-b55240" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-315f83" />
</p>

[Public demo](https://electaris.github.io/election-sandbox-demo/) · [Current release](docs/releases/v0.29d2-sturgis-source-review.md) · [Methodology](docs/methodology/ANALYTICS_CONSTITUTION.md) · [Architecture](#architecture)

![Pennsylvania 3D Swingometer laboratory](docs/review/v0.19.1-supervisor-review/screenshots/03-pennsylvania-3d-laboratory.png)

Sandbox 2.0 combines two connected experiences on one persistent deck.gl map:

- **Swingometer:** change turnout, two-party preference, and third-party behavior, then inspect exactly which counties and reporting units moved the result.
- **Election Night:** replay the resulting scenario through deterministic local return events whose timing and geographic order can be directed by the user.

The product is local-first, deterministic, and designed to explain why an election changes rather than only display a new winner.

<table>
  <tr>
    <td width="50%"><img alt="Swingometer contribution analysis" src="docs/review/v0.19.1-supervisor-review/screenshots/04-pennsylvania-contributors.png" /></td>
    <td width="50%"><img alt="Integrated Election Night workspace" src="docs/review/v0.26b-reporting-velocity/screenshots/integrated-election-night-desktop.png" /></td>
  </tr>
  <tr>
    <td><strong>Explain the scenario.</strong> Trace explicit assumptions through counties and local reporting units to the Electoral College.</td>
    <td><strong>Direct the count.</strong> Control pace, order, stalls, and local timing without changing a single final vote.</td>
  </tr>
</table>

## Current release

### v0.30: Local three-state release candidate

Run `npm run release:package` to build a local owner-review candidate and `npm run release:verify` to verify it. The package records exact asset and build-input hashes, includes the [supported scope](docs/review/v0.30-release-candidate/SCOPE.md), [acceptance checklist](docs/review/v0.30-release-candidate/ACCEPTANCE.md), and [delivery plan](docs/review/v0.30-release-candidate/DELIVERY.md), and preserves existing candidate directories. See the [current verification record](docs/review/v0.30-release-candidate/VERIFICATION.md) for the package identity and fresh checks. This is a local candidate, with owner acceptance and external-delivery gates still pending.

### v0.29E: Foundation retention build gate

Both production builds now run `npm run verify:foundations`. The [retention report](docs/review/v0.29e-foundation-retention/REVIEW.md) pins the three current demographic foundations and all 222 county map files, uses the actual runtime adapters, and verifies exact baselines, off-map accounting, and state-specific group capabilities. The policy rejects replacement admission and unreviewed drift.

The [integrated verification record](docs/review/v0.29e-foundation-retention/VERIFICATION.md) covers the model, replay, frontend, and build checks. Existing PA/MI/WI data remains in place; the Michigan candidate and recorded delivery gates remain held.

### v0.29D.3: Evidence quality and foundation retention

The new [evidence review](docs/review/v0.29d3-evidence-quality/REVIEW.md) separates unresolved touching evidence from source-county localization. It inventories the 26 positive-VAP blocks / 491 VAP outside Sturgis quarantine, preserves all 382 partial statuses, and adds county context for 63 Bay/Isabella precincts. Flint Township's candidate profiles now reconstruct by source VTD and block; this explains the arithmetic without independently validating the boundary.

[Decision 0062](docs/decisions/0062-demographic-completeness-and-retention.md) retains the existing PA/MI/WI foundations for bounded v1. No candidate migration or runtime change. Reproduce with `npm run data:v029d3:review -- --verify --reverse`.

### v0.29D.2: Sturgis source review and sensitivity

Published state and city sources disagree about the remaining Sturgis overlap. Both hypothetical ownership choices produce identical assignments for all 202 quarantined blocks and would recover 4,580 VAP, but no correction is accepted. The existing foundation and both earlier candidates remain unchanged.

The complete review also distinguishes 33 partial precincts touching positive VAP from 349 touching only zero-VAP uncertainty. Current completeness statuses are preserved. Read the [source findings and diagram](docs/review/v0.29d2-sturgis-source-review/SOURCE-REVIEW.md), [verification](docs/review/v0.29d2-sturgis-source-review/VERIFICATION.md), and [unsent clarification draft](docs/review/v0.29d2-sturgis-source-review/SOURCE-CLARIFICATION-DRAFT.md). Authoritative source resolution remains necessary before correction and admission.

### v0.29D.1: Michigan source normalization audit

A versioned native-coordinate correction resolves 20 invalid ring representations and six tolerance-bounded overlap strips. Flint Township Precinct 2 has a documented 2024 effective-cycle interpretation with its raw 2023 attribute preserved. The full rerun raises complete precincts to 3,956 and reduces unallocated VAP to 5,071.

**Retain the existing runtime; admission remains rejected.** One source overlap between City of Sturgis Precinct 2 and Sturgis Township Precinct 1 leaves both targets quarantined, and 382 precincts remain partial. All 74 off-map units / 142,574 votes and admitted runtime files are unchanged. The comparison includes gains and regressions, the exact normalization policy, and every block's evidence.

Read the [normalized comparison](docs/review/v0.29d1-michigan-normalization/COMPARISON.md), [verification](docs/review/v0.29d1-michigan-normalization/VERIFICATION.md), and [reproduction instructions](docs/review/v0.29d1-michigan-normalization/REPRODUCE.md). Resolve the remaining source conflict and review partial coverage before compiling an admitted replacement candidate.

### v0.29D: Michigan statewide diagnostic comparison

All 254,730 Census blocks and 4,340 precinct polygons now have a statewide diagnostic comparison against Michigan's existing VTD bridge. The candidate has 3,645 complete, 635 partial, and 60 unavailable precincts, with all 74 off-map units and 142,574 votes preserved.

**Retain the existing runtime; candidate admission is rejected.** The source-map gate exposed 20 invalid polygons, 27 overlap pairs including exclusion footprints, and one stale 2023 precinct attribute. The diagnostic recovers complete block evidence for 59 previously unavailable units, but complete-unit VAP falls below the current foundation. Its distinct schema cannot be admitted as a v0.29A bundle.

Read the [statewide comparison](docs/review/v0.29d-michigan-comparison/COMPARISON.md), [verification](docs/review/v0.29d-michigan-comparison/VERIFICATION.md), and [reproduction instructions](docs/review/v0.29d-michigan-comparison/REPRODUCE.md). Source-map review is the next prerequisite before an admitted candidate can be completed. No application data or behavior changed.

### v0.29C: Pennsylvania candidate comparison

The reference compiler now has a real Pennsylvania comparison proof: all 3,879 Census blocks and 50 VTDs in Adams County. Every VTD matches all five admitted demographic groups and total VAP exactly. The pilot retains 83,005 VAP and the same 60,650 linked 2024 ballots, with no unavailable or split blocks.

**Retain the existing VTD foundation.** Block tracing adds auditability, but this bounded pilot demonstrates no composition, vintage, geography, or result-linkage improvement. It is not statewide validation or a runtime migration. The source snapshot, complete block trace, local comparisons, result residual inventory, size audit, and fingerprints stay outside application assets.

Read the [comparison report](docs/review/v0.29c-pennsylvania-comparison/COMPARISON.md), [release notes](docs/releases/v0.29c-pennsylvania-comparison.md), [verification](docs/review/v0.29c-pennsylvania-comparison/VERIFICATION.md), or [source reproduction instructions](docs/review/v0.29c-pennsylvania-comparison/REPRODUCE.md). Reproduce offline with `npm run data:v029c:pa -- --verify`.

### v0.29B: Deterministic reference spatial compiler

The v0.29A evidence contract now has a real headless compiler. It reads normalized Census-block and election-unit Polygon or MultiPolygon geometry, then emits the compact application artifact and complete block trace through one deterministic path.

Whole blocks use containment. Genuine boundary blocks may use an in-block Census internal point or explicit population or housing evidence. Every split retains reduced exact rational weights, every demographic group remains integer-exact, and canonical unit identity resolves equal remainders. Unknown split methods, fractional weights, overlapping map units, out-of-block evidence points, and invalid map geometry fail closed.

The checked synthetic fixture proves all four admitted allocation paths plus invalid, unmatched, cross-county, and zero-information outcomes. It compiles eight source blocks into a canonical bundle with exact source VAP of 125, modeled VAP of 95, unavailable VAP of 30, and frozen SHA-256 identities. No current state runtime or interface behavior changes.

### v0.28: Demographic counterfactuals with explicit evidence boundaries

Pennsylvania and Michigan now expose five explicit group turnout assumptions in the existing Turnout editor. Each setting adds ballots through admitted local 2020 VAP composition, exact integer allocation, and documented remaining capacity. The existing statewide turnout setting runs first, and every group shares the same local capacity ledger.

Each group may optionally divide only its newly added ballots among Harris, Trump, Stein, Oliver, and residual Other/write-in. The five explicit shares always sum to 100 percent. Certified ballots are never assigned a demographic identity, and a group without a custom vector inherits the visible shared Harris-Trump split.

The contribution panel reports exact requested, realized, and clipped ballots, candidate allocation, county and reporting-unit geography, off-map effects, and deterministic Harris-Trump movement per 1,000 added ballots. It explains model arithmetic rather than claiming individual causation.

Scenario URL schema 4 preserves group turnout and candidate vectors, schemas 2 and 3 remain compatible, and downstream national, Electoral College, contribution, and Election Night endpoints consume the same deterministic scenario. Michigan's unavailable bridge and off-map units remain untouched, while Wisconsin shows an explicit unavailable state because its admitted runtime has no group-composition cells.

#### v0.28A foundation

The three admitted state foundations compile into one fail-closed inventory of denominator meaning, vintages, geography relationships, crosswalk methods, coverage, off-map units, composition availability, and behavior eligibility. The contract enforces that VAP is not CVAP or a 2024 eligible-voter estimate and that aggregate composition is not individual behavior.

### v0.27C: Compare how each result is built

Contributors now separates two questions without adding another analytics wall. **Movement** shows exactly where the scenario changed votes. **Result structure** compares which counties or reporting units build the certified plurality and which build the modeled plurality.

Each side uses its own true winner and runner-up. A Trump-to-Stein change therefore compares certified Trump's advantage over Harris with modeled Stein's advantage over the actual modeled runner-up. Every row opens the existing geography inspector, keyboard arrows move through the ranking, and the two structures stack cleanly on narrow screens.

The inspector now presents certified and scenario plurality before its explicitly secondary H-T movement diagnostic. A tied endpoint produces no invented winner hierarchy.

#### v0.27B.1 foundation

The third-party control now changes local geography, not only statewide totals. The selected bucket follows a deterministic affinity built from certified local support and available Harris and Trump ballots, with exact integer conservation and canonical unit ordering.

Stein and Oliver receive distinct light-to-dark margin ramps only when their exact modeled votes exceed every other candidate. Residual Other/write-in receives a separate aggregate ramp and is never presented as one candidate. The same plurality law now governs reporting units, counties, statewide tiles, result readouts, and Electoral College allocation. Shift and national popular-vote movement remain explicitly labeled Harris-versus-Trump comparisons.

The v0.27B.1 correctness patch applies that law to the entire Swingometer and Election Night dock. A Stein flip is explained through Stein vote gains, the primary replay chart follows all five reported candidate shares, and each local return names its actual plurality. The Electoral College desk, state-flip requirement, shared URL, and Path to 270 can target Harris, Trump, Stein, Oliver, or aggregate Other. Harris-Trump movement remains available as an explicitly labeled secondary diagnostic instead of posing as the election result.

![The v0.27A operation, geography, and Electoral College explanation](docs/review/v0.27a-scenario-explanation/screenshots/scenario-explanation-desktop.png)

[Read the v0.29B release notes](docs/releases/v0.29b-reference-spatial-compiler.md), its [verification record](docs/review/v0.29b-reference-spatial-compiler/VERIFICATION.md), the [v0.29 plan](docs/plans/v0.29-precinct-demographic-data-factory.md), or [decision 0057](docs/decisions/0057-reference-spatial-compiler-law.md). The [v0.29A contract](docs/releases/v0.29a-precinct-demographic-contract.md) remains the compiler's admission boundary.

The prior ECharts GL research gate remains complete. GL was rejected for production, stays development-only, and deck.gl remains the sole WebGL and map renderer. The [v0.26C evidence](docs/review/v0.26c-count-landscape/VERIFICATION.md) records that decision.

Before expanding the analytics, the project completed an [audit of the old Sandbox](docs/research/OLD_SANDBOX_ANALYTICS_AUDIT.md) and adopted an [Analytics Constitution](docs/methodology/ANALYTICS_CONSTITUTION.md). The resulting [v0.25 plan](docs/plans/v0.25-analytics-foundation.md) restores descriptive depth without importing unsupported probability or decision claims.

The integrated v0.23B Election Night remains directly inside `/app/`. It shares the Swingometer's scenario, mounted 3D map, camera, and geographic selection instead of opening a separate replay product.

The visible count currently includes only the three states with admitted detailed foundations:

| State | Result unit | Map terrain | Election Night status |
| --- | --- | --- | --- |
| Pennsylvania | 2024 reporting units | 2020 Census VTD-linked terrain | Detailed |
| Michigan | 2024 precinct reporting units | Exact-cycle precinct terrain | Detailed |
| Wisconsin | LTSB reconstructed 2024 values | January 2025 ward terrain | Detailed |

The other 48 jurisdictions stay inert during Election Night. The application does not invent statewide or county fallback returns where detailed local data are unavailable.

v0.23B reuses decoded state foundations while Election Night remains open, makes chronology restarts substantially cheaper, and adds a current-only local return tape that explains exactly how each published precinct, VTD, or ward moved its state margin. Its [release notes](docs/releases/v0.23b-election-night-refinement.md) and [verification record](docs/review/v0.23b-election-night-refinement/VERIFICATION.md) remain available.

## What you can do

### Build an election scenario

- Adjust turnout using available local voting-age-population capacity.
- Add explicit Hispanic, non-Hispanic White, Black, Asian, or Other turnout assumptions in Pennsylvania and Michigan.
- Author a five-candidate choice vector only for the new ballots created by each group setting.
- Inspect exact group contribution, clipping, local geography, off-map effects, and bounded arithmetic sensitivity.
- Transfer existing ballots between Harris and Trump without an arbitrary slider ceiling.
- Exchange Stein, Oliver, or residual Other/write-in ballots with a user-selected major-party split.
- Read the exact calculation, invariant, and feasible boundary beside every control.
- Keep separate Pennsylvania, Michigan, and Wisconsin recipes active at the same time.
- Compare certified, modeled, and shifted results at state, county, and reporting-unit level.
- Rank the counties and local units responsible for the change in margin.
- Inspect candidate ledgers, turnout capacity, coverage, crosswalk quality, and operation-level contributions.
- Share deterministic scenario portfolios through versioned URLs.

### Direct Election Night

- Play, pause, reset, seek, or advance one return at a time.
- Choose 0.1x, 0.5x, 1x, 4x, or 12x playback.
- Change the count duration, geographic reporting order, timing volatility, stalls, and state delays.
- Start from Balanced, Rural opening, Metropolitan opening, or Volatile waves profiles.
- Add county-specific activation and count-length overrides.
- Preview state reporting windows before restarting the count.
- Save and reuse custom chronology profiles in browser-local storage.
- Follow a compact local return tape that names the county, ballots, timestamp, true return plurality, and explicit H-T movement diagnostic.
- See published-unit progress and the newest reporting state without leaving the map.
- Switch between five-candidate reported-share and trailing reporting-velocity timelines.
- Compare ballot progress, reporting-unit progress, activation, current pace, and stalls across PA, MI, and WI.

Chronology controls change when votes arrive, never how many votes exist. Schedules are deterministic for the same scenario, profile, and seed. State color represents the current reported-vote leader, not a projection or race call.

### Understand the national consequence

- Aggregate detailed state scenarios into separate five-candidate national popular-vote and Electoral College totals.
- Explain which modeled states changed the Electoral College outcome.
- Distinguish changed-but-not-flipped states from actual EV transfers.
- Handle exactly 270, above 270, below 270, and 269 to 269 as separate outcomes.
- Calculate deterministic candidate-specific Path to 270 combinations using multiple ranking metrics.
- Move route states from Required to Modeled to Satisfied as detailed scenarios cross their thresholds.

## Design principles

1. **One map, continuous context.** Swingometer and Election Night reuse the same 3D geographic stage.
2. **Detailed data or no return.** Unsupported jurisdictions do not receive fabricated local reporting behavior.
3. **Votes and chronology stay separate.** Scenario recipes determine endpoints; candidate-blind scheduling determines arrival order.
4. **Exact conservation.** Candidate totals reconcile at unit, county, state, and composed-stream levels.
5. **Visible evidence boundaries.** Off-map votes, residual buckets, unmatched geography, and unavailable denominators remain explicit.
6. **Deterministic sharing.** Results are rebuilt from versioned inputs rather than stored as competing derived truth.

## Architecture

```text
Official and documented source artifacts
                    |
       detailed-state import pipelines
                    |
       validated runtime foundations
                    |
   deterministic scenario recipes and workers
          |                         |
    Swingometer endpoint     candidate-blind scheduler
          |                         |
          +------ integrated replay stream ------+
                                                   |
                         React + deck.gl laboratory
```

Important implementation areas:

```text
src/App.tsx                         Product shell and scenario orchestration
src/map/AtlasMapScene.tsx           Persistent national and detailed 3D renderer
src/components/ElectionNightMarginTimeline.tsx
                                    Lazy regular-ECharts reported-margin lens
src/components/ElectionNightReportingVelocity.tsx
                                    Lazy regular-ECharts reporting-pace lens
src/replay/threeStateElectionNight.ts
                                    PA/MI/WI visible replay scheduling
src/replay/visibleReplayTimeline.ts Bounded current-prefix timeline contract
src/replay/visibleReportingPace.ts  Candidate-blind pace and state comparison
src/replay/countLandscapeResearch.ts
                                    Bounded shared 2D/GL research dataset
src/runtime/threeStateNight.worker.ts
                                    Dedicated Election Night worker
src/runtime/useReplayExperience.ts  Playback and React integration
src/data/detailedStateManifest.ts   Typed state and artifact registration
src/data/scenarioPortfolio.ts       Multi-state recipe and summary contracts
src/data/electoralConsequences.ts   Electoral College consequence ledger
src/data/pathTo270.ts               Deterministic route calculation
packages/election-model/            Counterfactual allocation engine
packages/election-replay/           Headless replay contracts and reducers
packages/election-analytics/        Exact scenario and replay explanation contracts
public/data/{pa,mi,wi}/              Detailed runtime artifacts
scripts/                             Reproducible data pipelines and benchmarks
tests/                               Model, replay, and browser verification
docs/                                Decisions, methodology, reviews, and releases
research/v0.26c/                     Isolated renderer-comparison harness
```

The detailed foundations are decoded and modeled in Web Workers. Scenario requests use monotonically increasing identifiers, queued slider changes are coalesced, stale responses are rejected, and inactive state summaries remain compact. County geometry is loaded lazily and kept in a bounded cache. During Election Night, chronology restarts reuse one active worker with three bounded scenario entries; leaving the mode releases that cache.

## Run locally

Requirements:

- Node.js 22.12 or newer
- npm

```bash
npm install
npm run test:browser:install
npm run dev
```

Vite prints the local development URL when the server starts.

Build a production bundle:

```bash
npm run build
npm run preview
```

Build with the GitHub Pages repository base path:

```bash
npm run build:pages
```

## Verification

The v0.29D diagnostic passed 31 Node contract/compiler/comparison tests and 11 Python geometry/comparison tests; full statewide reversed-order byte reproduction; source and residual reconciliation; full ESLint; and TypeScript/production build. See the [v0.29D verification record](docs/review/v0.29d-michigan-comparison/VERIFICATION.md). These passing tests verify the diagnostic and its admission rejection, not a successful source-map gate.

The v0.29D.1 normalization passed 35 focused Node tests, 18 Python tests, full reversed-order byte reproduction, original-diagnostic reproduction, ESLint, and TypeScript/production build. The frontend returned HTTP 200. See the [normalization verification record](docs/review/v0.29d1-michigan-normalization/VERIFICATION.md); the full aggregate model/replay and browser suites were not rerun.

The v0.29C comparison passed 28 focused contract, compiler, and comparison tests; raw-source preparation; byte-identical reproduction with reversed source and target order; TypeScript and production build; and full ESLint. The admitted Pennsylvania source and runtime artifact hashes remain unchanged. See the [v0.29C verification record](docs/review/v0.29c-pennsylvania-comparison/VERIFICATION.md) for scope and commands. No browser or full aggregate rerun is claimed for this headless comparison.

The v0.29B reference compiler release passed:

- 269 of 269 aggregate model, compiler, data-contract, replay, and analytics tests
- 13 of 13 focused reference spatial compiler tests
- 21 of 21 combined v0.29A contract and v0.29B compiler tests
- exact block, target, map-unit, method, coverage, and statewide reconciliation
- deterministic compiler bytes and SHA-256 fingerprints across input and evidence ordering
- fail-closed geometry, county, CRS, split-evidence, checksum, and identity gates
- frozen Pennsylvania, Michigan, national replay, reducer, seek, playback, and analytics regressions unchanged
- TypeScript production build
- ESLint
- diff integrity checks

Run the principal gates locally:

```bash
npm test
npm run test:browser
npm run research:v026c:fixture
npm run research:v026c:build
npm run research:v026c:test
npm run lint
npm run build
```

Additional deterministic replay benchmarks are available through the `benchmark:*` scripts in `package.json`. GitHub Actions runs the hosted model, build, lint, and browser gates from `.github/workflows/verify.yml`.

## Data and methodology

The model preserves five candidate buckets throughout the replay:

```text
Harris
Trump
Stein
Oliver
Other / write-in residual
```

Pennsylvania retains certified residual and unmatched reporting-unit votes in explicit non-terrain buckets. Michigan preserves central-count, adjustment, and unmatched geographic votes as off-map units. Wisconsin local values are the Wisconsin Legislative Technology Services Bureau's population-disaggregated reconstruction onto 2025 wards, not raw certified ward returns.

Turnout controls use 2020 Census-derived voting-age population where the denominator is valid. That is not citizen voting-age population, a 2024 eligible-voter estimate, or evidence of individual voter preference. Custom group candidate shares apply only to new ballots authored by the same turnout setting. Counterfactual controls are transparent assumptions, not forecasts.

Primary sources include:

- [Federal Election Commission, official 2024 presidential results](https://www.fec.gov/resources/cms-content/documents/2024presgeresults.pdf)
- [Pennsylvania Department of State, election data](https://www.pa.gov/agencies/dos/resources/voting-and-elections-resources/voting-and-election-statistics/election-data)
- [Michigan Department of State, election results and data](https://www.michigan.gov/sos/elections/election-results-and-data)
- [Wisconsin LTSB, 2024 election data with 2025 wards](https://www.arcgis.com/home/item.html?id=878d8826218f42509e07437a82ef6b6e)
- [U.S. Census Bureau, 2020 Redistricting Data](https://www.census.gov/programs-surveys/decennial-census/about/rdo/summary-files.html)

See [Detailed State Admission](docs/data/DETAILED_STATE_ADMISSION.md), [State Exceptions](docs/data/STATE_EXCEPTIONS.md), and the [Redistribution Inventory](docs/data/REDISTRIBUTION_INVENTORY.md) for the full evidence and delivery boundaries.

## Release boundary

This repository is an active research and demonstration build. It is not yet cleared as a commercial or broad public data product. Pennsylvania and Michigan redistribution terms remain under review, and deferred human testing is still required before paid delivery.

The current release deliberately excludes:

- Decision Desk projections and calls
- estimated outstanding vote
- hidden-outcome or presenter mode
- accounts, memberships, rooms, or backend persistence
- server-rendered video and export
- unsupported-state local return simulations

A separate national-only sanitized preview is available at [Sandbox 2.0 public demo](https://electaris.github.io/election-sandbox-demo/). It excludes detailed state, county, precinct, VTD, demographic, crosswalk, and local scenario artifacts.

## Key documents

- [Product and Engineering Plan](PRODUCT_AND_ENGINEERING_PLAN.md)
- [Run My Election Engine Plan](RUN_MY_ELECTION_ENGINE_PLAN.md)
- [Codex Handoff](CODEX_HANDOFF.md)
- [v0.29D Release Notes](docs/releases/v0.29d-michigan-comparison.md)
- [v0.29D.1 Release Notes](docs/releases/v0.29d1-michigan-normalization.md)
- [v0.30 Local Candidate](docs/releases/v0.30-local-release-candidate.md)
- [v0.30 Acceptance Checklist](docs/review/v0.30-release-candidate/ACCEPTANCE.md)
- [v0.29E Release Notes](docs/releases/v0.29e-foundation-retention.md)
- [v0.29E Retention and Verification](docs/review/v0.29e-foundation-retention/REVIEW.md)
- [v0.29D.3 Release Notes](docs/releases/v0.29d3-evidence-quality.md)
- [v0.29D.3 Evidence Review](docs/review/v0.29d3-evidence-quality/REVIEW.md)
- [v0.29D.2 Release Notes](docs/releases/v0.29d2-sturgis-source-review.md)
- [v0.29D.2 Source Review](docs/review/v0.29d2-sturgis-source-review/SOURCE-REVIEW.md)
- [v0.29D.1 Normalized Comparison](docs/review/v0.29d1-michigan-normalization/COMPARISON.md)
- [v0.29D Statewide Comparison](docs/review/v0.29d-michigan-comparison/COMPARISON.md)
- [v0.29D Verification](docs/review/v0.29d-michigan-comparison/VERIFICATION.md)
- [v0.29C Release Notes](docs/releases/v0.29c-pennsylvania-comparison.md)
- [v0.29C Comparison Report](docs/review/v0.29c-pennsylvania-comparison/COMPARISON.md)
- [v0.29C Verification](docs/review/v0.29c-pennsylvania-comparison/VERIFICATION.md)
- [v0.29B Release Notes](docs/releases/v0.29b-reference-spatial-compiler.md)
- [v0.29B Verification](docs/review/v0.29b-reference-spatial-compiler/VERIFICATION.md)
- [Reference Spatial Compiler Decision](docs/decisions/0057-reference-spatial-compiler-law.md)
- [v0.29A Release Notes](docs/releases/v0.29a-precinct-demographic-contract.md)
- [v0.29A Verification](docs/review/v0.29a-precinct-demographic-contract/VERIFICATION.md)
- [Precinct Demographic Data Factory Plan](docs/plans/v0.29-precinct-demographic-data-factory.md)
- [Block-to-Election-Unit Evidence Decision](docs/decisions/0056-block-to-election-unit-evidence-contract.md)
- [v0.28D Release Notes](docs/releases/v0.28d-demographic-explanation.md)
- [v0.28C Release Notes](docs/releases/v0.28c-group-preference.md)
- [v0.28 Final Verification](docs/review/v0.28-final/VERIFICATION.md)
- [Candidate-Complete Group Preference Decision](docs/decisions/0054-candidate-complete-group-preference.md)
- [Demographic Contribution Decision](docs/decisions/0055-demographic-contribution-and-sensitivity.md)
- [v0.28B Release Notes](docs/releases/v0.28b-group-turnout.md)
- [Group Turnout Decision](docs/decisions/0053-group-specific-turnout.md)
- [v0.28A Release Notes](docs/releases/v0.28a-demographic-contract.md)
- [v0.28A Verification](docs/review/v0.28a-demographic-contract/VERIFICATION.md)
- [Demographic Behavior Plan](docs/plans/v0.28-demographic-behavior.md)
- [Demographic Evidence Decision](docs/decisions/0052-demographic-evidence-and-model-contract.md)
- [v0.27C Release Notes](docs/releases/v0.27c-comparison-polish.md)
- [v0.27B.1 Release Notes](docs/releases/v0.27b.1-plurality-semantics.md)
- [v0.27B Geographic Allocation](docs/releases/v0.27b-geographic-third-party.md)
- [Swingometer Explanation Plan](docs/plans/v0.27-swingometer-explanation.md)
- [Election Night Engine Boundary](docs/decisions/0028-election-night-engine-boundary.md)
- [First Visible Replay Slice](docs/decisions/0039-first-visible-replay-slice.md)
- [Runtime Budgets](docs/operations/RUNTIME_BUDGETS.md)
- [Human Alpha Protocol](docs/research/HUMAN_ALPHA_PROTOCOL.md)

## Status

The latest [static-first art direction](docs/review/v0.35-art-direction/REVIEW.md) refines the opening composition, orthographic terrain, exact palette legend, workspace controls, evidence ledgers, and motion timing across the site. It builds on the [Presidential Atlas narrative](docs/review/v0.34-presidential-atlas/REVIEW.md), [editorial Election Night](docs/review/v0.33-editorial-election-night/REVIEW.md), and [Swingometer overhaul](docs/review/v0.32-editorial-swingometer/REVIEW.md). The owner's [dock preference](docs/review/v0.31a-hybrid-premium/DOCK_ADJUSTMENT.md) preserves the slide-up drawer, entry state, expansion, and dragging. Fresh-user usability testing remains the next validation step.

The [Hybrid Premium phase 1 review](docs/review/v0.31a-hybrid-premium/REVIEW.md) records the shared workspace shell, dedicated map/analysis/dock space, compact navigation, and retained scenario/replay state. The ivory, navy/teal, editorial typography, and geographic identity are preserved. The earlier [AI technical acceptance review](docs/review/v0.30-release-candidate/TECHNICAL_ACCEPTANCE.md) remains dated evidence for the previous UI. Human acceptance remains NOT RUN. Michigan replacement still requires source-boundary resolution, localization of positive evidence, explicit completeness review, and validation of material changes such as Flint. The Sturgis source clarification remains unsent; technical verification does not remove the recorded delivery gates.
