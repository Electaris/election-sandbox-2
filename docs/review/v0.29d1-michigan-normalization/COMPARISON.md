# v0.29D.1: Michigan native-coordinate normalization comparison

Date: 2026-09-08 · Version: 0.29.4 · Decision: **retain the existing Michigan foundation**

The reviewed correction candidate substantially improves the v0.29D diagnostic, but still fails statewide map admission. City of Sturgis Precinct 2 and Sturgis Township Precinct 1 retain one unresolved overlap. All 254,730 Census blocks, 83 counties, and 4,340 precincts are accounted for; this remains a diagnostic schema outside application assets.

## Coverage comparison

| Measure | Original v0.29D diagnostic | Normalized v0.29D.1 diagnostic |
|---|---:|---:|
| Invalid allocation polygons | 20 | 0 |
| Positive-area overlap pairs at map gate | 27 | 1 |
| Unresolved election-year attributes | 1 | 0, with documented Flint interpretation |
| Quarantined precincts | 59 | 2 |
| Complete precincts | 3,645 | 3,956 |
| Partial precincts | 635 | 382 |
| Unavailable precincts | 60 | 2 |
| Allocated blocks | 248,248 | 253,021 |
| Unavailable blocks | 6,482 | 1,709 |
| Complete-unit VAP | 6,640,546 | 7,300,132 |
| Partial-unit allocated VAP | 1,097,479 | 609,399 |
| Unallocated VAP | 176,577 | 5,071 |

Complete and partial allocation plus unavailable evidence exactly conserve all six source cells and 7,914,602 total VAP. Partial profiles are incomplete evidence and cannot become runtime denominators.

Against the existing VTD foundation, 63 of its 72 unavailable precincts become complete and 9 remain partial. Conversely, 375 previously available precincts are now partial or unavailable. Candidate complete VAP exceeds the existing 6,998,065 allocated VAP, but complete-precinct mapped votes are 5,062,637 versus the existing demographic coverage of 5,419,338 votes. These different measures do not establish universal improvement.

Relative to v0.29D, 271 partial and 54 unavailable precincts become complete, while 14 complete precincts become partial. Changing coordinate representation and precision affects boundary predicates as well as resolving defects. The measured gain of 171,506 allocated VAP is the combined result of native projection, normalization, and Flint review; it is not attributable exclusively to overlap repair. Every local delta and status transition remains in [comparison.json](comparison.json).

## Versioned source normalization

The [official 2024 Michigan layer](https://gisagocss.state.mi.us/arcgis/rest/services/OpenData/boundaries/MapServer/9) was queried in its native EPSG:3078 coordinates. All 4,340 identities and attributes match the historical CRS84 export exactly after two documented ArcGIS field-name aliases. Native metadata specifies 0.0001-metre resolution and 0.001-metre XY tolerance. These describe storage/computation precision, not legal or surveyed boundary accuracy.

The policy `mi-native-source-tolerance-normalization-v1`:

1. Extracts polygonal `make_valid` surfaces only when area change is at most 0.00001 square metres. All 20 observed invalid rings meet this guard; the largest change is approximately 0.000002265 square metres.
2. Snaps to the source's 0.0001-metre resolution and requires the changed surface to remain within the original polygonal boundary's 0.001-metre buffer.
3. Finds seven residual overlap pairs. Six shared strips lie wholly within both targets' boundary tolerance buffers. Their union is removed from both targets simultaneously, assigning neither precinct ownership of the ambiguous strip.
4. Retains the remaining Sturgis conflict. The normal diagnostic gate quarantines both complete target footprints and every source block intersecting either one.

The [normalization audit](normalization-audit.json) records every original validity reason, source and normalized geometry fingerprint, area change, exclusion area, overlap footprint, and disposition. No arbitrary overlap winner, area population weight, or registered-voter split is introduced. Blocks still use whole-block containment or a unique, in-block Census internal point. An excluded strip is not allocated by polygon area; a boundary block can still be assigned by a valid internal point elsewhere in a unique precinct.

Census NAD83 geometry and internal points are projected into EPSG:3078 through the pinned same-datum PROJ pipeline. PROJ reports operation accuracy as unavailable, recorded as null. The original diagnostic's CRS84 pipeline remains unchanged and byte-reproducible.

## Flint effective-cycle evidence

Flint Township Precinct 2 (`WP-049-29020-00002`) retains its raw `ELECTIONYE=2023` attribute. The [official township agenda packet](https://cms3.revize.com/revize/flinttownship/Documents/Government/Meeting%20Agendas%20and%20Minutes/2024/Agendas/2024-01-18%20Election%20Commission%20-%20Full%20Agenda-1649.pdf), packet pages 3–4, includes approved resolution 3091 dated December 7, 2023, effective February 2024, and the updated Precinct 2 boundary description.

Together with the statewide layer's explicit 2024 election-cycle scope, this supports a reviewed 2024 effective-cycle interpretation. It does not independently certify that every polygon segment matches the legal description. The exception is restricted to the exact precinct identity and source-property SHA-256; the evidence PDF is also pinned. Its diagnostic profile is complete at 5,759 VAP versus 1,900 in the existing VTD bridge. That large change warrants substantive geography review before migration.

## Remaining source conflict

| Target | Source ID | Existing VAP | Mapped votes |
|---|---|---:|---:|
| City of Sturgis, Precinct 2 | WP-149-76960-00002 | 1,920 | 690 |
| Sturgis Township, Precinct 1 | WP-149-76980-00001 | 2,001 | 944 |

The overlap is 1.2338043353713033 square metres and extends beyond the allowed boundary-tolerance strips. Small area alone is insufficient to authorize a correction. A separate native query requesting true curves returns ordinary rings for both features; there is no evidence that flattening a true curve explains this conflict.

The conservative quarantine leaves 202 unique blocks and 4,580 VAP unavailable, including blocks touching the two footprints. This population is not an estimate of residents inside the tiny overlap. The source feature IDs and overlap geometry in the audit define a concrete source-review target. A correction needs authoritative boundary evidence, a new source hash and correction policy, and a fresh map gate; do not clip this pair merely to make the compiler pass.

Other unavailable evidence comprises 74 county-conflicting blocks / 214 VAP, 205 blocks without split evidence / 212 VAP, and 1,228 blocks without compatible geometry / 65 VAP. Resolving Sturgis alone therefore will not make every precinct complete.

## Election and runtime boundary

All 5,521,612 mapped votes and every one of the 74 off-map units / 142,574 votes remain identical to the original admitted inventory, including each candidate total. The off-map inventory contains 65 central-count buckets, one other bucket, and eight precinct units. Existing runtime demographic data, geometry manifest, result files, and crosswalk retain their pinned hashes.

The normalized candidate is 1,658,392 bytes; its full uncompressed trace is 87,033,370 bytes and deterministic gzip is 2,342,052 bytes. The existing runtime demographic artifact is 628,735 bytes. These diagnostic sizes are not estimates of an admitted bundle's eventual loading cost.

Next: resolve the Sturgis source conflict, review the remaining partial evidence and material local changes, then compile an admitted candidate and repeat the comparison before considering migration. v0.29E must preserve this admission hold. See [verification](VERIFICATION.md), [reproduction](REPRODUCE.md), and [decision 0060](../../decisions/0060-michigan-native-normalization-hold.md).
