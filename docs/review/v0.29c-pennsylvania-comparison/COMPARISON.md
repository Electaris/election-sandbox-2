# v0.29C Pennsylvania candidate comparison

Scope: **Adams County only (42001)**, all 3,879 Census blocks and 50 VTDs. This is not statewide validation.

Verdict: **retain the existing VTD foundation; no migration**. The candidate does not demonstrate strictly better evidence.

| Measure | Admitted VTD foundation | Block candidate |
|---|---:|---:|
| Available VTDs in pilot | 50 | 50 |
| Population age 18+ | 83005 | 83005 |
| VTDs with linked results | 50 | 50 |
| Linked 2024 ballots | 60650 | 60650 |
| Pilot row slice / candidate artifact bytes* | 4821 | 22502 |

*The admitted slice includes rows and field names; the candidate includes its own metadata. The full candidate with build-time trace is 2044844 bytes.

50 VTDs match all five groups and total VAP exactly; 0 differ. Maximum absolute group-share change: 0 percentage points.

Allocated blocks: 3879; unavailable blocks: 0; split blocks: 0; cross-county allocations: 0. Method counts and every local comparison are in [comparison.json](comparison.json).

The result crosswalk is reused and verified, with 48 exact-ID and 3 canonical-name source links in the pilot. The statewide off-map inventory remains 102 units / 125172 votes, including 24526 statewide-only residual votes. None is assigned to candidate terrain.

The pilot was chosen before compilation as the first Pennsylvania county by FIPS, providing a complete, bounded county without selecting units by result. It does not test an urban county, new election-cycle terrain, positive population splits, or all statewide residual conditions.

The source is [2020 Census P.L. 94-171 P4](https://www2.census.gov/programs-surveys/decennial/2020/data/01-Redistricting_File--PL_94-171/Pennsylvania/pa2020.pl.zip) and original [block](https://www2.census.gov/geo/tiger/TIGER2020PL/STATE/42_PENNSYLVANIA/42/tl_2020_42_tabblock20.zip) / [VTD](https://www2.census.gov/geo/tiger/TIGER2020PL/STATE/42_PENNSYLVANIA/42/tl_2020_42_vtd20.zip) geometry. Coordinates stay in native NAD83 longitude/latitude (EPSG:4269); no simplification, datum relabeling, area weighting, or preference inference is used. The 2024 linkage still crosses vintages.

Block trace improves auditability, while composition, demographic vintage, terrain vintage, and result coverage remain unchanged. A statewide or exact-cycle replacement needs a separate comparison and admission review.

Reproduce offline: `npm run data:v029c:pa -- --verify`. Verify order independence: `npm run data:v029c:pa -- --verify --reverse`.

Artifact: `sha256:d4885494d7582a353882ac57d504dd5e36535d51948cdaa7d4f3ceab7bb579c7`

Trace: `sha256:eafeaca56b6ff8b09f60b977f03db397fa19533182b9a97e166148135e36897a`

Bundle: `sha256:c8179739748e16b31eca412c4c6391e3f94b494bda26eafdae38f950a24ce0f4`
