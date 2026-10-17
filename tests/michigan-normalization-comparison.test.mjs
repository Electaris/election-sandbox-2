import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const path = "docs/review/v0.29d1-michigan-normalization/";
const json = async (file) => JSON.parse(await readFile(new URL(file, root), "utf8"));

test("normalization retains only the unresolved Sturgis pair and records every source edit", async () => {
  const candidate = await json(path + "candidate.json");
  const audit = await json(path + "normalization-audit.json");
  assert.equal(audit.units.length, 4340);
  assert.equal(new Set(audit.units.map((u) => u.unitId)).size, 4340);
  assert.equal(audit.invalidSourcesNormalized, 20);
  assert.equal(audit.boundedOverlapsExcluded, 6);
  assert.equal(audit.unresolvedOverlaps, 1);
  assert.equal(audit.sourceResolutionMetres, 0.0001);
  assert.equal(audit.sourceToleranceMetres, 0.001);
  assert.equal(audit.overlaps.filter((o) => o.disposition === "excluded_from_both_targets" && o.withinBothBoundaryTolerances).length, 6);
  assert.deepEqual(candidate.mapAudit.invalidUnits, []);
  assert.deepEqual(candidate.mapAudit.vintageExceptions, []);
  assert.deepEqual(candidate.mapAudit.quarantinedUnitIds, ["WP-149-76960-00002", "WP-149-76980-00001"]);
  assert.equal(candidate.mapAudit.positiveAreaOverlaps.length, 1);
  assert.equal(candidate.mapAudit.positiveAreaOverlaps[0].areaSquareMetres, 1.2338043353713033);
  assert.equal(candidate.coordinateNormalization.to, "EPSG:3078");
  assert.equal(candidate.coordinateNormalization.accuracyMetres, null);
  for (const u of audit.units) {
    assert.ok(Math.abs(u.sourceAreaM2 - u.polygonalAreaM2) <= 0.00001);
    assert.match(u.sourceGeometryFingerprint, /^sha256:[0-9a-f]{64}$/);
    assert.match(u.normalizedGeometryFingerprint, /^sha256:[0-9a-f]{64}$/);
  }
});

test("normalized comparison reports gains and regressions while preserving election evidence", async () => {
  const report = await json(path + "comparison.json");
  const candidate = await json(path + "candidate.json");
  const previous = await json("docs/review/v0.29d-michigan-comparison/comparison.json");
  assert.deepEqual(report.candidateStatusCounts, { complete: 3956, partial: 382, unavailable: 2 });
  assert.equal(candidate.allocatedBlockCount, 253021);
  assert.equal(candidate.unavailableBlockCount, 1709);
  assert.equal(candidate.unavailableProfile.totalVotingAgePopulation, 5071);
  assert.equal(candidate.unavailableReasons.quarantined_map_geometry.blockCount, 202);
  assert.equal(candidate.unavailableReasons.quarantined_map_geometry.profile.totalVotingAgePopulation, 4580);
  assert.equal(report.composition.candidateCompleteProfile.totalVotingAgePopulation, 7300132);
  assert.equal(report.composition.candidatePartialProfile.totalVotingAgePopulation, 609399);
  assert.equal(report.recoveredCompleteUnitCount, 63);
  assert.equal(report.lostCompleteUnitCount, 375);
  assert.equal(report.previousDiagnostic.statusTransitions["complete -> partial"], 14);
  assert.equal(report.previousDiagnostic.allocatedProfileDelta.totalVotingAgePopulation, 171506);
  assert.deepEqual(report.offMapUnits, previous.offMapUnits);
  assert.equal(report.mappedVotes, previous.mappedVotes);
  assert.equal(report.offMapVotes, 142574);
  assert.equal(report.verdict.migrationAuthorized, false);
  const before = new Map(previous.local.map((u) => [u.unitId, u]));
  for (const unit of report.local) {
    assert.deepEqual(unit.admittedProfile, before.get(unit.unitId).admittedProfile);
    assert.equal(unit.mappedVotes, before.get(unit.unitId).mappedVotes);
    if (!unit.admittedProfile || !unit.candidateProfile) assert.equal(unit.delta, null);
    else for (const field of Object.keys(unit.delta)) assert.equal(unit.delta[field], unit.candidateProfile[field] - unit.admittedProfile[field]);
  }
  for (const field of Object.keys(candidate.sourceProfile)) {
    assert.equal(candidate.sourceProfile[field], report.composition.candidateCompleteProfile[field] + report.composition.candidatePartialProfile[field] + candidate.unavailableProfile[field]);
    assert.equal(report.counties.reduce((sum, c) => sum + c.candidateCompleteProfile[field], 0), report.composition.candidateCompleteProfile[field]);
  }
});

test("Flint's effective-cycle interpretation preserves the raw year and pinned runtime sources", async () => {
  const registry = await json("data-sources/michigan/v029d1-normalization-sources.json");
  const candidate = await json(path + "candidate.json");
  assert.deepEqual(candidate.effectiveCycleReview, registry.flintEffectiveCycleReview);
  assert.equal(candidate.effectiveCycleReview.sourceElectionYear, 2023);
  assert.equal(candidate.effectiveCycleReview.effectiveElectionYear, 2024);
  assert.equal(candidate.units.find((u) => u.unitId === "WP-049-29020-00002").status, "complete");
  for (const [file, hash] of Object.entries(registry.files).filter(([p]) => !p.startsWith("work/"))) {
    assert.equal(createHash("sha256").update(await readFile(new URL(file, root))).digest("hex"), hash);
  }
});
