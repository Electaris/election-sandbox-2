# Decision 0057: Reference spatial compiler law

Date: 2026-08-29

Status: accepted for v0.29B

## Context

Decision 0056 defines what an admitted precinct demographic bundle must prove. It does not define how source Census blocks and election-unit geometry become that bundle.

The reference compiler must be strict enough to expose missing evidence instead of converting geometric overlap into invented population placement.

## Decision

### Input law

- The reference compiler accepts normalized GeoJSON Polygon or MultiPolygon surfaces in `OGC:CRS84`.
- Map geometry is required infrastructure. Invalid, duplicate, or overlapping election-unit identity fails the build.
- An invalid source-block surface is retained as `invalid_source_geometry` with its complete source profile unavailable.
- Source demographic, map, and election-result checksums and vintages flow into the compact artifact.

### Allocation precedence

Each source block follows one candidate-blind deterministic path:

1. assign a block wholly contained by one same-county unit;
2. otherwise use its Census internal point when that point lies inside the source block and exactly one same-county map unit;
3. otherwise use explicit population or housing evidence points when at least two same-county targets receive positive evidence;
4. otherwise preserve the block as unavailable.

Internal points and split evidence points must lie inside the source geometry. An unsupported split basis fails instead of falling through to a different method.

### Split law

- Raw polygon area is not population evidence and is never an allocation fallback.
- Evidence weights must be positive safe integers.
- Equivalent weight ratios reduce to the same canonical rational weights.
- Each demographic group is allocated independently with exact integer largest remainders.
- Canonical unit identity breaks equal remainders.
- Every group and total VAP reconstructs the complete source block exactly.

### County and ambiguity law

- No source block may allocate outside its county.
- A point inside an election unit from another county becomes `county_boundary_conflict`.
- A genuine split with no population or housing evidence becomes `zero_information_split`.
- A block with no compatible map terrain becomes `no_compatible_geometry`.
- Multiple containing units or a point inside overlapping units fails the build because the map foundation is ambiguous.

### Output law

The compiler emits only the v0.29A `PrecinctDemographicBundle`:

- compact map-unit artifact;
- complete block allocation trace;
- exact method and coverage audit;
- source, modeled, and unavailable statewide profiles;
- canonical serialization and fingerprints.

The package is headless, deterministic, candidate-blind, and contains no React, deck.gl, ECharts, or random scheduling behavior.

## Consequences

The compiler can now be tested as a real spatial transformation without claiming that the synthetic fixture is production evidence. Pennsylvania, Michigan, and Wisconsin remain on their existing admitted demographic foundations until a later comparison phase proves replacement quality.
