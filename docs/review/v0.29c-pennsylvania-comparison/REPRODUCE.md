# Reproduce the Pennsylvania candidate

Use Node 22.12+ and install the repository's locked dependencies. Run from the repository root. Neither command writes application data.

```bash
npm run data:v029c:pa -- --verify
npm run data:v029c:pa -- --verify --reverse
```

The default command without `--verify` rebuilds `candidate-bundle.json`, `comparison.json`, and `COMPARISON.md` in this review directory. `--verify` compares bytes without rewriting these outputs. `--reverse` reverses both source-block and target-unit input ordering before compilation. The normalized source is gzip-compressed for storage and checked both before and after decompression.

## Rebuild from original Census archives

The source inventory is [v029c-adams-candidate-sources.json](../../../data-sources/pennsylvania/v029c-adams-candidate-sources.json). Download its three `sourceUrls` to `work/v029c/` as `pa2020.pl.zip`, `tl_2020_42_tabblock20.zip`, and `tl_2020_42_vtd20.zip`. Extract the archives to these corresponding subdirectories:

| Archive | Extract to |
|---|---|
| pa2020.pl.zip | work/v029c/pl94/ |
| tl_2020_42_tabblock20.zip | work/v029c/blocks/ |
| tl_2020_42_vtd20.zip | work/v029c/vtd/ |

Then run:

```bash
npm run data:v029c:prepare
```

An alternate source directory can be passed after `--`. The preparer verifies the archive hashes **and** all consumed extracted members, avoiding an unrelated-extracted-file provenance gap. It also pins the current VTD demographic artifact, geometry manifest, result crosswalk, and normalized results. Any mismatch fails before producing new input.

P.L. 94-171 summary level 750 supplies one complete county inventory of block profiles. Geography records join P4 segment 2 by logical record number. P4 total is field 76 (zero-based); Hispanic is 77; non-Hispanic White, Black, and Asian are 80, 81, and 83; other combines 82, 84, 85, and 86. The fields follow the existing admitted importer and each block's five-group sum must equal its total. Geometry is joined by the full 15-digit Census block GEOID. Missing block geometry stays explicitly null for compiler unavailability; extra or duplicate geometry fails preparation.

The adapter checks `.prj` files for native Census NAD83, reads unmodified longitude/latitude vertices, and declares EPSG:4269 for the entire normalized input. Target VTD IDs must match every admitted Adams VTD exactly. It does not use the geographic header's VTD code to assign blocks: the reference compiler makes the spatial assignments.

The resulting `work/v029c/normalized-input.json` must match the frozen normalized SHA-256 before being written. Thus original-source rebuilding and offline compilation are independently connected by an exact content hash. Raw statewide archives and extracted members stay in ignored `work/`; the checked normalized snapshot contains only the bounded county's aggregate public Census evidence.
