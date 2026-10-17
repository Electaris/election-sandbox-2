# Partner review deployment

Owner request: enable GitHub Pages for business-partner testing. [Decision 0066](../../decisions/0066-partner-pages-review.md) records the public review scope and unresolved source-rights/human-validation limits.

## Architecture

- Repository: `Electaris/election-sandbox-2`, already public; visibility unchanged.
- Intended URL: `https://electaris.github.io/election-sandbox-2/`.
- Applications: Home at the root, Swingometer at `app/`, Election Night from application navigation, methodology at `methodology.html`.
- Source branch: `codex/editorial-swingometer`; no merge into main is required.
- Publishing branch: `pages-review`, root directory, static GitHub Pages publication with `.nojekyll`.
- Publish only `npm run build:pages` output plus public build metadata and file hashes. No credentials, source caches, dependencies, repository history, or private participant records enter the website.
- GitHub Pages is public. There is no sign-in, backend, or server storage; scenario assumptions are encoded in shareable URLs and replay profiles remain browser-local. A copied scenario URL intentionally reveals its authored assumptions.

This record is prepared before the initial deployment. Actual publication identity, status, and live checks are appended when complete; the intended URL alone is not evidence of a working site.

## Update and rollback

Build from a reviewed source commit with Node 22 and the lockfile. Run the calculation audit, applicable model/browser checks, lint, and `npm run build:pages`. Test the resulting files under the real repository subpath before publishing. Preserve byte identity when committing static files (`* -text` in the publishing branch's `.gitattributes`). Record the source commit in `build-info.json`, hash the payload in `review-manifest.json`, and publish that snapshot on `pages-review`.

Source pushes do not automatically replace the deployed website. A new reviewed static publishing commit updates Pages. To roll back, create a new publishing commit restoring a previously reviewed static tree (keep history; avoid force-pushing). To stop hosting, disable Pages in repository settings. Neither operation implies completed human acceptance or changes the historical foundation-retention registry.

The owner shares the link with their partner. No invitation or other message is sent by this work. Use the neutral [task cards](../v0.36-usability-readiness/PARTICIPANT_TASKS.md) and record actual observations separately from technical verification.
