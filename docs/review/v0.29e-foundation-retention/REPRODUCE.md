# Reproduce v0.29E

From the repository root, with the supported Node 22 environment and installed dependencies:

```sh
npm run verify:foundations
npm run verify:foundations -- --reverse
node --experimental-strip-types --test tests/foundation-retention.test.mjs
```

Both `npm run build` and `npm run build:pages` run this verifier as a prebuild hook. The existing CI quality job therefore runs it through the build command. The verifier writes nothing and makes no network requests. It needs checked repository artifacts, not the ignored raw GIS cache.

`data-sources/foundation-retention-policy.json` is the fixed review policy. It inventories the three admitted demographic artifacts, source registries, compiler scripts/configuration, result/crosswalk inputs, review decisions, geometry manifests, and all 222 county geometry shards. Review and compiler text use SHA-256 after UTF-8 CRLF-to-LF normalization so a checkout convention cannot invalidate evidence. Runtime demographic files additionally require their original exact-byte digest and size; county map files require their recorded byte sizes. Scoped `.gitattributes` rules preserve these runtime and generated-report bytes across checkouts.

The verifier uses the same manifest, adapters, evidence contract, and model as the app. It checks state/election/schema compatibility, group capability, exact zero-change local and statewide election totals, the national baseline, and separate off-map accounting. PA/MI group-turnout probes must apply; Wisconsin must reject unsupported group assumptions.

The outputs are `retention-check.json` and `REVIEW.md`. Both must reproduce exactly, including when state, manifest, and file inventory order change. The JSON includes a canonical policy fingerprint, all file pins, source disclosures, capabilities, coverage, baselines, and decisions. It is a review artifact, not a v0.29A candidate bundle or runtime input.

To regenerate after a substantive, documented review:

```sh
npm run data:v029e:review
```

The command never refreshes policy pins. Investigate drift and update the decision before deliberately editing a pin or output. Neither command can authorize replacement admission, public delivery, or completed human validation.

Raw import reproduction stays state-specific. Pennsylvania and Michigan commands in the report accept the original Census archive/member paths; Michigan also needs its official precinct source. Wisconsin's importer retrieves the LTSB service and checks its fixed source identity/vintage, so it requires network access. These imports are not run by this fast build gate and write data; do not confuse the report with a fresh raw-source rebuild.

Integrated verification commands and results are recorded separately in [VERIFICATION.md](VERIFICATION.md).
