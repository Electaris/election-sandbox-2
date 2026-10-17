# Partner review deployment

Owner request: enable GitHub Pages for business-partner testing. [Decision 0066](../../decisions/0066-partner-pages-review.md) records the public review scope and unresolved source-rights/human-validation limits.

## Architecture

- Repository: `Electaris/election-sandbox-2`, already public; visibility unchanged.
- Public URL: **https://electaris.github.io/election-sandbox-2/**.
- Applications: Home at the root, Swingometer at `app/`, Election Night from application navigation, methodology at `methodology.html`.
- Source branch: `codex/editorial-swingometer`; no merge into main is required.
- Publishing branch: `pages-review`, root directory, static GitHub Pages publication with `.nojekyll`.
- Publish only `npm run build:pages` output plus public build metadata and file hashes. No credentials, source caches, dependencies, repository history, or private participant records enter the website.
- GitHub Pages is public. There is no sign-in, backend, or server storage; scenario assumptions are encoded in shareable URLs and replay profiles remain browser-local. A copied scenario URL intentionally reveals its authored assumptions.

## Published identity

- Audited source commit: `701318fbd0a44061c89e07835015de1d087df430`.
- Static publishing commit: `7270d8b917a2e0e3aebd577e13aaa520aa14fcdb` on `pages-review`.
- Payload content ID: `c8ae3e2c0cd63b2d3e3bd2414bd5e4cd411939b8e6710a2fdfa82eb8fdea20fe`.
- Payload: 248 files, approximately 51 MB; public `build-info.json` identifies the source, and `review-manifest.json` lists file hashes. Byte preservation is explicit in the publishing branch's `.gitattributes`.
- GitHub API confirms `public: true`, branch `pages-review`, path `/`, build type `legacy`, and build status **built** for the publishing commit, without a build error.
- Live Home HTML, laboratory HTML, methodology HTML, and build metadata match their prepared SHA-256 hashes (`work/v039-live-hashes.log`).
- Public homepage was visually inspected in the in-app browser: header, hero, 226/312 baseline, and national terrain render correctly.

Automatic review initially required a more explicit public-access authorization. The owner answered **“Approve public GitHub Pages”** for the full application and PA/MI/WI detailed data. Enabling Pages succeeded only after that answer. This records the hosting approval without asserting new source rights or completed human acceptance.

The **live browser journey passes 1/1 in 11.2 seconds** (`work/v039-pages-live.log`): Home → methodology → laboratory, PA worker/data load, +2.5-point transfer and D +0.8, URL reload with the same result and repository prefix, Election Night preparation/first return, and return to editing. No same-origin HTTP errors occurred. Live screenshots are retained locally under `screenshots-live/`.

## Update and rollback

Build from a reviewed source commit with Node 22 and the lockfile. Run the calculation audit, applicable model/browser checks, lint, and `npm run build:pages`. Test the resulting files under the real repository subpath before publishing. Preserve byte identity when committing static files (`* -text` in the publishing branch's `.gitattributes`). Record the source commit in `build-info.json`, hash the payload in `review-manifest.json`, and publish that snapshot on `pages-review`.

Source pushes do not automatically replace the deployed website. A new reviewed static publishing commit updates Pages. To roll back, create a new publishing commit restoring a previously reviewed static tree (keep history; avoid force-pushing). To stop hosting, disable Pages in repository settings. Neither operation implies completed human acceptance or changes the historical foundation-retention registry.

The owner shares the link with their partner. No invitation or other message is sent by this work. Use the neutral [task cards](../v0.36-usability-readiness/PARTICIPANT_TASKS.md) and record actual observations separately from technical verification.
