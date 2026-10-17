# v0.29D.2: Sturgis source review and allocation sensitivity

Date: 2026-09-08 · Version: 0.29.5 · Decision: **source disagreement remains unresolved; retain the current foundation**

The investigation isolates the exact defect and shows that either hypothetical owner produces identical Census-block assignments. It does not establish an authoritative 2024 boundary correction. No correction has been accepted, no admitted candidate has been emitted, and neither earlier diagnostic nor the runtime has changed.

## Source findings

The positive-area conflict is one triangle between City of Sturgis Precinct 2 (`WP-149-76960-00002`) and Sturgis Township Precinct 1 (`WP-149-76980-00001`). Its area is 1.2338043354 m², longest edge 132.028 m, and maximum altitude 0.01869 m. Other components of the original intersection are shared lines, not disputed surfaces. Its approximate centre is longitude -85.42878353, latitude 41.77403063. Exact EPSG:3078 coordinates are in [source-comparison.geojson](source-comparison.geojson).

![Exported Sturgis boundaries, with vertical scale exaggerated](boundary-comparison.png)

The diagram measures exported geometries; its unequal axes reveal the thin triangle. It does not establish surveyed positional accuracy. City precinct and city-limit lines nearly coincide in the lower panel.

| Source | Evidence at this location | Limitation |
|---|---|---|
| State 2024 precincts | Both targets cover the triangle; one side retains an intermediate vertex and the other uses a straight segment | Fails the map gate |
| State 2022 precincts | Triangle lies on city side; both boundaries contain the intermediate vertex in this area | Historical representation, not certification of the 2024 line |
| City-published precinct 2 | Triangle lies outside city precinct | Data last edited October 3, 2022; different datum/export path |
| City-published limits | Triangle lies outside city | Data last edited April 18, 2026; no demonstrated 2024 validity |
| City printed precinct map | Shows the precinct arrangement | Printed February 3, 2012; insufficient scale and vintage |

The [official city website](https://www.sturgismi.gov/211/Municipal-Information) links its [current public GIS](https://experience.arcgis.com/experience/ecebc5569b1d46f584a647542603b0f5). The [county GIS portal](https://stjosephcountymi.gov/government/geographic-information-systems-gis/interactive-map-portal/) links the city's older application. Both identify the same city precinct service. These paths authenticate publication; they are not independent surveys.

The city [precinct layer](https://services5.arcgis.com/jvZ2ldpSLd1kK0tx/arcgis/rest/services/PrecinctsAGOWM/FeatureServer/0) and [limit layer](https://services5.arcgis.com/jvZ2ldpSLd1kK0tx/arcgis/rest/services/CityLimitsAGOWM/FeatureServer/0) place the triangle outside their polygons. Its three vertices are approximately 0.382–1.183 m from the precinct boundary and 0.302–1.183 m from the limit boundary. The state [2022 layer](https://gisagocss.state.mi.us/arcgis/rest/services/OpenData/boundaries/MapServer/7) places it on the city side. These discrepancies exceed the triangle's 1.87 cm width.

The missing intermediate vertex suggests a representation error, but does not reconcile source ownership. City GIS starts in Web Mercator and was queried into EPSG:3078; the state export uses native NAD83 EPSG:3078. A common requested CRS or layer edit timestamp does not establish centimetre accuracy or legal validity on election day. Numeric side classification is therefore insufficient to settle jurisdiction ownership.

The [county data inventory](https://stjosephcountymi.gov/government/geographic-information-systems-gis/maps-data/gis-data/) excludes Sturgis city from its standard package and directs requests to the city. No request was submitted. The [city precinct PDF](https://www.sturgismi.gov/DocumentCenter/View/187/Precinct-Map-PDF) was downloaded, rendered, and visually inspected; its printed date is 2012 despite being linked from the current website.

## Two unapproved hypotheses

Each sensitivity subtracts only the triangle from one target: either the city owns it or the township owns it. Both hypothetical statewide maps have zero invalid polygons and zero positive-area overlaps. The 202 blocks originally quarantined by the pair are reallocated from original Census geometry and internal points; other baseline records remain fixed.

**All 202 replacement records are identical under either owner**, including target, method, source profile, disposition, and unresolved-touching inventory. This proves insensitivity to those two local edits for this dataset. It does not establish legal ownership, validate larger changes to match city GIS, or prove that another dataset would be insensitive.

| Measure | Frozen v0.29D.1 | Either unapproved hypothesis |
|---|---:|---:|
| Complete precincts | 3,956 | 3,963 |
| Partial precincts | 382 | 377 |
| Unavailable precincts | 2 | 0 |
| Allocated blocks | 253,021 | 253,223 |
| Unavailable blocks | 1,709 | 1,507 |
| Allocated VAP | 7,909,531 | 7,914,111 |
| Unallocated VAP | 5,071 | 491 |
| Complete-unit VAP | 7,300,132 | 7,314,456 |
| Partial-unit allocated VAP | 609,399 | 599,655 |

All 4,580 VAP excluded by the whole-target quarantine would be recovered. This population belongs to the quarantined blocks, not the tiny triangle. Two unavailable and five partial precincts would become complete. Seven precinct profiles/statuses change because quarantine also affected blocks touching neighbours.

All six population cells conserve exactly. Both hypotheses preserve all 5,521,612 mapped votes and all 74 off-map units / 142,574 votes, including each candidate total. Remaining unavailable VAP comprises 214 from county conflicts, 212 from missing split evidence, and 65 from no compatible geometry. A clean map gate alone does not provide complete demographic evidence.

[hypothetical-comparison.json](hypothetical-comparison.json) contains both hypotheses, every replacement block record, and affected profiles. Correction approval and admission remain false. The file is rejected by the v0.29A bundle reader.

## Partial evidence and regressions

The [complete partial-evidence review](partial-evidence-review.json) finds:

- **33** of 382 baseline partial precincts touch unresolved blocks with positive VAP.
- **349** touch only unresolved blocks with zero 2020 VAP.
- **13** of the **14** normalization regressions involve only zero-VAP uncertainty.
- The remaining regression, City of Richmond Precinct 2 (`WP-099-68380-00002`), touches two county-conflicting blocks, one positive, exposing the precinct to **2 unresolved VAP**.

Zero VAP does not mean zero residents, no boundary issue, or complete geographic evidence. The current contract marks unresolved touching blocks partial regardless of VAP. No status is upgraded. Separating geographic completeness from completeness of demographic cells would require explicit contract review and tests.

After Sturgis-related cases, the highest positive-VAP exposure includes:

| Precinct | Unresolved touching VAP | Issue |
|---|---:|---|
| Ira Township Precinct 2 | 146 | Compatible geometry / split evidence |
| City of Midland Ward 1 Precinct 2 | 122 | County conflicts |
| Menominee Township Precinct 1 | 108 | Compatible geometry / split evidence |
| Ingallston Township Precinct 1 | 106 | Compatible geometry / split evidence |
| Ira Township Precinct 1 | 99 | Compatible geometry / split evidence |

These are **exposure figures**, not assigned precinct populations. Shared blocks occur in multiple rows; these figures must not be summed. The machine-readable review retains every partial precinct, reason count, positive-VAP block count, admitted VAP, allocated VAP, and mapped votes.

Flint Township Precinct 2's earlier 1,900-to-5,759 VAP change remains a separate geography/vintage review item. This Sturgis study does not validate or change that interpretation.

## Decision and next action

Retain the admission hold. Equal demographic outcomes under the two hypotheses are sensitivity evidence, not authority to select a boundary.

The next required source step is confirmation of the effective 2024 shared line or a corrected official export from the state/city data steward. An [unsent clarification draft](SOURCE-CLARIFICATION-DRAFT.md) includes exact coordinates and the GIS packet. After source resolution, bind the correction to a new source hash, rerun the full source gate and candidate, and review the remaining positive-VAP gaps and completeness semantics before migration.

See [decision 0061](../../decisions/0061-sturgis-source-disagreement.md), [verification](VERIFICATION.md), and [reproduction](REPRODUCE.md).
