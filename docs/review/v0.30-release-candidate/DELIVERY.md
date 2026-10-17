# v0.30 delivery plan

Later owner instruction: [decision 0066](../../decisions/0066-partner-pages-review.md) authorizes a separate public Pages build for partner review. The original local package and its gate values below remain historical; the hosting exception does not mark source rights or human acceptance passed. See the [Pages deployment record](../v0.39-calculation-audit/PAGES.md).

Current supported path: **local owner review on this machine**, served on loopback. This package does not authorize public, paid, hosted-private, or broader participant delivery of detailed-state artifacts. Decisions 0025 and 0027 remain the recorded boundary; this document does not provide a new source-rights assessment.

## Build and verify

From the project root, with the existing supported Node environment and dependencies installed:

```sh
npm run release:package
npm run release:verify
```

Packaging first runs the normal production build and its foundation gate. It verifies that recorded build inputs did not change during compilation, copies only built assets and the three review documents, hashes every packaged file, and writes an immutable directory under `outputs/0.30.0-rc.1/<content-id>/`. `latest.json` identifies the latest successfully verified package. There is no upload or deployment step.

`release:verify` checks the package's complete file inventory and current workspace build inputs. A missing, extra, or changed file fails. An altered workspace requires rebuilding for a new content ID. Existing candidate directories are never overwritten; keep the entire directory with its manifest when preserving a review.

The package records the current Git HEAD and whether the working tree was dirty. Its exact source-input hashes cover production source, shared packages, scripts, public assets, build configuration, the retention policy/report, and these review documents. It is not a Git commit, a complete source archive, or evidence of a clean checkout. No historical tag is moved. Raw GIS caches, dependencies, environment files, and repository history are not copied into the package.

## Open the local candidate

After verification, substitute the content ID from `outputs/0.30.0-rc.1/latest.json`:

```sh
npm run preview -- --outDir outputs/0.30.0-rc.1/<content-id>/app --host 127.0.0.1 --port 4173 --strictPort
```

Open `http://127.0.0.1:4173/` for Home or `/app/` for the laboratory. If port 4173 is occupied, identify the existing server before starting another; an old dev server is not proof that the packaged candidate is being reviewed. This preview uses the workspace's Vite dependency and is not a standalone installed application. Keep access local and stop the preview when finished. Do not use `file://` or expose the service to a network interface.

## External release still needs a decision

| Gate | Status | Required evidence |
|---|---|---|
| Supported scope and local package identity | Prepared by this phase | Scope, manifest, source/asset hashes, local verification record |
| Local owner acceptance | NOT RUN | Completed acceptance tasks and findings tied to a content ID |
| Deferred unfamiliar-user study | DEFERRED, not passed | Recorded study and triage; P0/P1 corrections retested |
| PA/MI artifact delivery and redistribution | Recorded hold | Documented supported disposition for the intended audience and artifacts |
| Production delivery architecture | Not selected | Access model and data boundary, security/privacy/accessibility/performance evidence, deployment and rollback plan |
| Public/paid release authorization | Not granted | Explicit release decision after the preceding gates |

A password or private URL alone does not settle the artifact-delivery hold. Any national-only public preview stays a separate sanitized product without PA/MI detailed data. The existing research repository's historical visibility is not treated as delivery authorization, and this phase makes no repository-visibility change.

Once owner feedback is captured, fix and retest material findings. Then prepare the unfamiliar-user protocol and a concrete delivery architecture for review. Outreach, participant invitations, and deployment require their own authorization; no messages are sent by this package workflow.
