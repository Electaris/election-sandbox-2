# v0.30 local candidate verification

Later design work: the owner requested Hybrid Premium UI/UX implementation. The [phase 1 design review](../v0.31a-hybrid-premium/REVIEW.md) identifies the newer packaged app and its validation. The package identities and technical acceptance results below remain historical records of the pre-refactor UI.

## Current candidate after technical acceptance fixes — 2026-10-12

Current content ID: `8307b9313f6e06d4d1419ce1ccdc696615f269263f926cfb0d72bf35b00d4759`, version `0.30.0-rc.1`. The loopback preview at `http://127.0.0.1:4173/` now serves this package. The original package below is preserved.

The [AI technical acceptance report](TECHNICAL_ACCEPTANCE.md) records the checklist coverage, two product findings, fixes, and retests. A queued playback tick could resume a paused count; the worker now ignores timer advances unless playing. Long geographic breadcrumbs overflowed mobile; they now wrap within the available width.

The new package contains 246 files, 50,816,584 file-content bytes, and 367 recorded inputs. Fresh verification includes 80 selected Node model/replay tests, 27 browser cases against the package (4.1 minutes), full lint, TypeScript and production build, foundation retention, package/current-input verification, and whitespace checks. The acceptance report links the before/after visual evidence; both identified findings are closed. This is AI technical review; human acceptance remains NOT RUN and external delivery remains held. No demographic data changed.

## Initial packaging record — 2026-10-11

Date: 2026-10-11. Version: `0.30.0-rc.1`. Status: packaged and technically checked for local owner review; human acceptance NOT RUN.

## Exact package

- Content ID: `352d36a638bdf273f4cdfdc702691c9759b3306ebd6818d8cd71e6745b538dc9`
- Directory: `outputs/0.30.0-rc.1/352d36a638bdf273f4cdfdc702691c9759b3306ebd6818d8cd71e6745b538dc9/`
- [Manifest](../../../outputs/0.30.0-rc.1/352d36a638bdf273f4cdfdc702691c9759b3306ebd6818d8cd71e6745b538dc9/manifest.json): 246 packaged files, 50,816,407 file-content bytes, 367 recorded input files. Counts exclude the manifest itself.
- Git HEAD at packaging: `dedf4f44a0ff8240134f123a7905ebdda652f7a3`; working tree dirty. Existing changes were preserved; no commit or tag was created.
- Local preview: `http://127.0.0.1:4173/`, laboratory `/app/`. The preview serves this package's `app` directory, not the development source tree. It remains a temporary local process; recheck/restart it after a later session.

The package is intentionally in ignored local output storage. Rebuild it if removed, and use the newly produced content ID rather than assuming it is identical. The candidate's scope, acceptance checklist, and delivery plan are copied inside `review/` and hashed with the application files.

## Fresh checks

| Check | Result |
|---|---|
| Existing foundation verifier after the break | Passed; retained PA/MI/WI identities unchanged |
| Production build through the foundation gate | Passed; existing large-chunk advisory remains |
| Package copy, file inventory, and workspace input verification | Passed |
| Focused Node tests | 14 passed: nine foundation-retention tests and five packaging tests |
| Full ESLint | Passed after excluding generated `outputs/**` from source lint |
| Packaged application browser smoke | Five passed, approximately 49 seconds |
| Whitespace check | Passed |

Packaging tests cover deterministic identity and ordering, explicit unpassed gates, unsafe/duplicate/hidden paths, required entry points, immutable directory reuse, changed/extra file rejection, and refusal to claim human acceptance or external delivery. Retention tests continue to check real baseline and capability behavior.

The initial lint attempt scanned generated copies of minified third-party bundles. Adding `outputs/**` to the existing generated-output exclusions corrected the lint scope; source rules were not relaxed. The subsequent full lint passed.

The five existing browser cases ran against the exact packaged preview with `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4173`:

1. Editorial Home to laboratory.
2. PA canonical scenario restoration and selected VTD.
3. MI direct, split, and unavailable precinct bridges.
4. WI reconstructed ward and evidence disclosures.
5. WI deterministic scenario URL replay.

The browser log is cached in `work/v030/browser-smoke.log`. The [Home capture](screenshots/editorial-home-desktop.png) is retained with this review. The app's existing feature-version label is not the package content ID; use the manifest when recording findings.

## Limits and environment

This phase changes packaging, lint exclusions, version metadata, and review documents. It does not edit application behavior or runtime data. The full model/replay suite and broader browser set were not rerun on October 11. September's 296 Node and 21 selected browser passes remain dated prior evidence in the v0.29E record, not fresh acceptance of this candidate.

The normal Windows sandbox shell and Node helper failed to initialize with `helper_unknown_error: setup refresh had errors`. The reviewed execution fallback successfully performed local reads, tests, build, and loopback preview. Node was v22.19.0. No dependency upgrade, remote operation, upload, deployment, source-owner contact, or participant invitation occurred.

Next: complete the [owner acceptance checklist](ACCEPTANCE.md) against this content ID, record findings, and rebuild/retest material fixes. The deferred unfamiliar-user study and recorded external-delivery gates remain outstanding under the [delivery plan](DELIVERY.md).
