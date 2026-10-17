# 0066: Public Pages build for partner review

Date: 2026-10-17. Status: owner requested implementation.

The owner requested a calculations/methodology audit and enabling GitHub Pages so their business partner can test the applications. This authorizes a public, unpaid technical-review deployment of the assembled Home, Swingometer, and Election Night experience from this repository. GitHub Pages is public; this is not an access-controlled partner portal.

This specific hosting instruction supersedes the earlier local-only delivery instruction for this review deployment. It does not establish source redistribution rights, mark the PA/MI source-rights questions resolved, waive the deferred human study, authorize a paid launch, or admit replacement demographic foundations. Historical decisions and local-package manifests retain their original gate values rather than being rewritten as passed.

Deploy only the audited production `build:pages` output, including the existing PA/MI/WI runtime artifacts and methodology page. Exclude source caches, environment files, credentials, private session records, dependencies, and repository history from the website. The repository itself was already public; its visibility is unchanged.

The static `pages-review` publishing branch is separate from `main` and the source feature branch. Pages serves its root with `.nojekyll`; application URLs use `/election-sandbox-2/`. Publishing does not merge unfinished source into main. A deployment record must identify the source commit, compiled-file hashes, publishing commit, validation, public URL, and rollback approach. Updating source alone does not automatically replace the review deployment.

Stop or roll back the review by disabling Pages in repository settings or deploying a previously reviewed static snapshot. Do not message the partner; the owner receives the link and chooses how to share it. Technical checks do not count as that partner's observations.
