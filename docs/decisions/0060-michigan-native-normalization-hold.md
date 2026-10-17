# 0060: Normalize bounded Michigan source defects; retain the admission hold

Date: 2026-09-08

Status: accepted for diagnostic comparison only

## Decision

Use the versioned native EPSG:3078 source-resolution and tolerance policy for a separate v0.29D.1 diagnostic. Normalize the 20 self-touching polygon representations within the recorded area guard, exclude six bounded shared strips from both targets, and retain the unresolved City of Sturgis Precinct 2 / Sturgis Township Precinct 1 overlap. Preserve raw attributes and bind Flint Township Precinct 2's reviewed 2024 effective-cycle interpretation to exact source properties and the approved township resolution.

The resulting 3,956 complete, 382 partial, and two unavailable precincts improve coverage over v0.29D, but do not pass map admission or demonstrate universal superiority to the existing VTD foundation. All five groups and VAP conserve; partial evidence remains explicitly incomplete. Neither a source tolerance nor a small overlap area authorizes ownership of disputed geography.

## Consequences

- Retain the existing Michigan runtime and decision 0059's admission hold. Preserve the original diagnostic and hashes.
- Keep the normalized candidate, complete trace, and per-target geometry audit outside application data. The diagnostic schema remains incompatible with the admitted v0.29A bundle reader.
- Preserve all mapped and off-map election units, candidate totals, result-link methods, and current runtime file hashes.
- Require authoritative evidence for the remaining Sturgis conflict, then a fresh source gate and admitted-candidate comparison. Review partial coverage, Flint's material demographic change, and other local deltas before any migration.
- v0.29E may not turn this diagnostic into an admitted foundation by bypassing topology, interpreting partial profiles as complete, or silently repairing the remaining overlap.

Evidence: [comparison](../review/v0.29d1-michigan-normalization/COMPARISON.md), [normalization audit](../review/v0.29d1-michigan-normalization/normalization-audit.json), [verification](../review/v0.29d1-michigan-normalization/VERIFICATION.md), and [source registry](../../data-sources/michigan/v029d1-normalization-sources.json).
