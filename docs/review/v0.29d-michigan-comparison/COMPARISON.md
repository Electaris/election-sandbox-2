# v0.29D Michigan statewide comparison

Date: 2026-09-07

**Retain the existing Michigan foundation.** The statewide diagnostic accounts for all 254,730 Census blocks, 83 counties, and 4,340 original precinct polygons, but source geometry defects prevent an admitted replacement bundle. This is a completed diagnostic comparison with a rejected candidate, not a runtime migration or completed statewide admission.

## Source-map gate

The original checksum-pinned Michigan geometry contains 20 self-intersecting precinct polygons, 27 positive-area overlaps after constructing exclusion footprints, and one precinct whose `ELECTIONYE` remains 2023: Flint Township Precinct 2 (`WP-049-29020-00002`). The initial audit of already-valid original polygons found 26 overlap pairs; including exclusion footprints exposes one additional pair. These categories overlap, leaving **59 quarantined targets**.

The overlaps are small precision/topology defects; they do not establish substantive errors in official legal boundaries. The diagnostic applies no area threshold to dismiss them. `make_valid` supplies exclusion footprints for invalid targets only. Repaired geometry never receives demographic allocations. No target is silently deleted, relabeled, or admitted.

The existing v0.29A/v0.29B admission rules remain unchanged. The indexed GEOS diagnostic uses a separate schema and is deliberately rejected by the generic bundle reader. A valid statewide `PrecinctDemographicBundle` has **not** been produced.

## Coverage and transitions

| Existing bridge | Complete block evidence | Partial block evidence | Unavailable | Total |
|---|---:|---:|---:|---:|
| Direct VTD bridge | 3,402 | 593 | 55 | 4,050 |
| Registered-voter weighted split | 184 | 29 | 5 | 218 |
| Previously unavailable | 59 | 13 | 0 | 72 |
| **Total** | **3,645** | **635** | **60** | **4,340** |

“Complete” means no unresolved source block touches the unit under the diagnostic. It is not legal-boundary certification or runtime admission. “Partial” holds only allocated evidence; its population must not be presented as a full denominator. Unavailable profiles and noncomparable differences are null, never zero-filled.

The diagnostic recovers complete evidence for 59 previously unavailable precincts and avoids the old weighted VTD split on 184 complete units. However, 682 previously available units are partial or unavailable under this stricter gate. Coverage therefore does not dominate the current foundation.

| Composition | Census statewide source | Existing allocated VTD bridge | Candidate complete units | Candidate partial units | Unallocated blocks |
|---|---:|---:|---:|---:|---:|
| VAP | 7,914,602 | 6,998,065 | 6,640,546 | 1,097,479 | 176,577 |
| Hispanic, any race | 367,645 | 317,723 | 316,588 | 43,037 | 8,020 |
| Non-Hispanic White | 5,928,796 | 5,303,617 | 4,902,433 | 885,429 | 140,934 |
| Non-Hispanic Black | 1,021,516 | 849,442 | 920,456 | 88,849 | 12,211 |
| Non-Hispanic Asian | 258,756 | 229,452 | 221,887 | 28,881 | 7,988 |
| Non-Hispanic Other | 337,889 | 297,831 | 279,182 | 51,283 | 7,424 |

Each candidate source group equals complete + partial + unallocated exactly. The combined allocated 7,738,025 VAP is **not** a claim of improved usable denominator coverage: 1,097,479 belongs to incomplete units. These are 2020 aggregate populations, not 2024 eligible voters or observed group behavior.

## Allocation evidence

| Disposition | Blocks | VAP |
|---|---:|---:|
| Whole-block containment | 177,426 | 4,736,963 |
| Census internal point | 70,822 | 3,001,062 |
| Quarantined map geometry | 4,990 | 176,173 |
| County conflict | 81 | 210 |
| Zero-information split | 186 | 162 |
| No compatible geometry | 1,225 | 32 |

All 248,248 assigned blocks remain inside their county. The other 6,482 blocks retain their full five-group profiles in the unavailable ledger. No population or housing split evidence was supplied, and no area or registered-voter allocation fallback was used. Zero-VAP blocks remain in the trace as evidence rather than being dropped.

## Local composition differences

Of 4,208 units with both old and candidate profiles, 1,361 match exactly and 2,847 differ. Those totals include partial candidates and must not be interpreted as improvement. Restricting to complete candidates with an old denominator gives 3,586 comparable units: 1,142 exact matches and 2,444 differences.

Largest absolute VAP differences among complete, comparable candidates:

| Precinct | Existing VAP | Candidate VAP | Change |
|---|---:|---:|---:|
| Grand Rapids Ward 3 Precinct 51 | 806 | 5,682 | +4,876 |
| Grand Rapids Ward 3 Precinct 52 | 5,682 | 1,475 | -4,207 |
| Ferndale Precinct 4 | 5,557 | 1,877 | -3,680 |
| Wixom Precinct 3 | 2,167 | 5,785 | +3,618 |
| Sterling Heights Precinct 14 | 1,454 | 5,026 | +3,572 |

These are review leads, not adjudications of which population is correct. The old `VTDST` field is an approximate bridge; the candidate uses spatial placement on the pinned precinct geometry. The full [comparison.json](comparison.json) includes all local five-group count and share differences, original methods, completeness flags, and all 83 county summaries.

## Election linkage and residuals

The existing result crosswalk is reused and independently reconciled; its 5,521,612 mapped ballots do not change. Of these, the current bridge provides demographic evidence for 5,419,338 ballots, while the candidate's complete units cover 4,589,596. This measures denominator availability, not a reassignment of election returns.

All **74 off-map units / 142,574 votes** remain explicit: 65 central-count buckets, one other/adjustment bucket, and eight unmatched precinct units. Every candidate bucket is reconciled individually to the admitted residual inventory. None becomes a demographic target or receives invented geography.

## Provenance, size, and next gate

The [source registry](../../../data-sources/michigan/v029d-candidate-sources.json) pins Census archives, consumed extracted members, original Michigan geometry, and all admitted linkage files. Census NAD83 blocks are normalized to the geometry's CRS84 using the recorded PROJ NAD83-to-WGS84 (1) operation (`+proj=noop`, stated accuracy 4 metres). No sub-metre boundary accuracy is claimed.

The diagnostic candidate is 1,649,804 bytes; its complete trace is 87,178,629 bytes uncompressed / 2,355,195 gzip bytes. The admitted runtime is 628,735 bytes. Diagnostic metadata and the trace are review evidence, not proposed browser payloads. Source/runtime files and imports remain unchanged.

**Next prerequisite: review and resolve the source topology and the Flint vintage exception under a versioned normalization or corrected-source policy, then rerun the comparison.** Recovery counts alone do not justify migration. The statewide admitted candidate remains blocked; v0.29E must not automatically admit this diagnostic.

See [reproduction instructions](REPRODUCE.md) and [verification](VERIFICATION.md).
