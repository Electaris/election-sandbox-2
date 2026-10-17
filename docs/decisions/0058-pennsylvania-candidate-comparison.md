# Decision 0058: Pennsylvania candidate comparison retains VTD foundation

Date: 2026-09-07

Status: accepted for v0.29C comparison only

## Scope and result

Compile a complete Adams County pilot through the v0.29B reference compiler using checksum-verified 2020 Census P4 blocks and original 2020 VTD geometry. Adams (42001), the first Pennsylvania county by FIPS, provides a bounded complete county selected before observing compiler results. The chosen election terrain is the already audited 2020 VTD terrain with its existing 2024 reporting-unit crosswalk. This does not claim exact-cycle precinct geography or statewide validation.

All 3,879 blocks allocate to 50 VTDs. All five groups and total VAP agree exactly with the admitted foundation at each VTD: 83,005 VAP in total. There are no split or unavailable blocks, no unavailable VTDs, and no cross-county allocations. Result linkage stays at 60,650 ballots from 51 source units: 48 exact-ID and three canonical-name links. No local reporting unit is off-map in this pilot.

The comparison separately retains the complete statewide off-map inventory of 102 units / 125,172 votes, including the 24,526 statewide-only residual votes and Philadelphia's county reconciliation bucket. Those units are not candidate map units or demographic allocation targets.

## Decision

Retain the existing runtime foundation. Equal composition and coverage on the same demographic and geographic vintage do not demonstrate strictly better replacement evidence. The complete block trace is an audit improvement, not an improved voter denominator, election-cycle geometry, or result linkage. It supplies no observed group turnout or candidate preference.

Keep the source snapshot, compiler outputs, local composition comparison, and review verdict outside `public/` and all runtime imports. The compiler command writes review artifacts only. Its verifier rejects input checksum drift, admitted artifact drift, invalid result linkage, terrain identity mismatch, and nonidentical regenerated outputs.

## Native Census coordinates

Extend the reference compiler's accepted geographic CRS vocabulary with `EPSG:4269` in addition to `OGC:CRS84`. For either value, the entire input must use longitude/latitude in that one coordinate system. This is not a reprojector and mixed coordinate systems remain inadmissible. The Pennsylvania adapter checks pinned `.prj` members and requires Census NAD83, retaining original coordinates without simplification or pretending NAD83 is WGS84. Allocation predicates and the frozen v0.29B fingerprints are unchanged. Source checksums and the allocation profile bind the native-coordinate choice.

## Evidence and remaining limits

See [comparison](../review/v0.29c-pennsylvania-comparison/COMPARISON.md), [machine-readable local differences](../review/v0.29c-pennsylvania-comparison/comparison.json), and [verification](../review/v0.29c-pennsylvania-comparison/VERIFICATION.md).

This county does not exercise an urban source, unavailable actual-state blocks, positive population splits, or changed election-cycle terrain. Synthetic adversarial tests cover failure behavior separately and must not be reported as empirical Pennsylvania coverage. A future statewide or different-terrain candidate still needs a fresh comparison and admission decision. v0.29D remains the Michigan comparison chapter; no automatic PA or MI migration is authorized.
