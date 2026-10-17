# 0064: Package a bounded three-state candidate for local owner review

Date: 2026-10-11. Status: accepted for local packaging and owner evaluation.

## Decision

Name the next bounded candidate `0.30.0-rc.1`. Retain the PA/MI/WI foundations and capabilities under decisions 0062 and 0063. Freeze supported scope in the candidate's scope document and identify each built snapshot by a SHA-256 content ID.

Packaging runs the existing production build, including the retention gate, and checks that recorded build inputs are stable across compilation. It copies compiled assets and the scope, acceptance, and delivery documents to a new local directory. The manifest records exact file hashes, build-input hashes, Git HEAD, and dirty-tree status. Existing candidate directories are verified rather than overwritten.

This working-tree package is distinct from a Git release tag or a clean source checkout. Do not move `v0.19.1-supervisor-review`, sweep unrelated changes into a commit, or represent September's tests as freshly run against a new candidate. Record new checks separately.

## Delivery and acceptance

The supported immediate delivery is loopback preview on the owner's machine. No upload, repository-visibility change, participant invitation, source-owner message, or deployment is part of this decision.

All owner acceptance rows start NOT RUN. Human validation remains deferred under decision 0027, and the recorded PA/MI delivery hold remains unresolved. Neither a content ID nor a successful build changes those gates. Any external delivery requires a separate supported disposition and explicit decision.

## Next work

Open the exact candidate locally and capture owner findings against the ten acceptance tasks. Correct material findings and produce a new content ID as needed. Prepare the unfamiliar-user study and supported production delivery architecture after that review; do not broaden the feature scope merely to postpone acceptance.

Evidence: [scope](../review/v0.30-release-candidate/SCOPE.md), [acceptance checklist](../review/v0.30-release-candidate/ACCEPTANCE.md), [delivery plan](../review/v0.30-release-candidate/DELIVERY.md), [verification](../review/v0.30-release-candidate/VERIFICATION.md).
