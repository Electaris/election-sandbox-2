import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import test from "node:test";
import { deserializePrecinctDemographicBundle } from "../packages/data-contracts/src/precinctDemographicArtifact.ts";

const root = new URL("../", import.meta.url);
const path = "docs/review/v0.29d-michigan-comparison/";
const json = async (file) => JSON.parse(await readFile(new URL(file, root), "utf8"));
const fields = ["totalVotingAgePopulation", "hispanic_any_race", "non_hispanic_white", "non_hispanic_black", "non_hispanic_asian", "non_hispanic_other"];
const empty = () => Object.fromEntries(fields.map((f) => [f, 0]));
const add = (a, b) => { for (const f of fields) a[f] += b[f]; };
const digest = (b) => `sha256:${createHash("sha256").update(b).digest("hex")}`;

for (const tracePath of [path, "docs/review/v0.29d1-michigan-normalization/"]) {
test(`${tracePath}: statewide diagnostic trace reconstructs every unit and group and cannot masquerade as an admitted bundle`, async () => {
  const candidateBytes = await readFile(new URL(tracePath + "candidate.json", root));
  const candidate = JSON.parse(candidateBytes);
  const comparison = await json(tracePath + "comparison.json");
  const zipped = await readFile(new URL(tracePath + "block-trace.json.gz", root));
  const raw = gunzipSync(zipped);
  const trace = JSON.parse(raw);
  assert.equal(digest(candidateBytes), comparison.fingerprints.candidate);
  assert.equal(digest(zipped), comparison.fingerprints.traceGzip);
  assert.equal(digest(raw), comparison.fingerprints.trace);
  assert.equal(candidate.admission.status, "rejected");
  assert.equal(candidate.admission.migrationAuthorized, false);
  assert.throws(() => deserializePrecinctDemographicBundle(candidateBytes.toString()));
  assert.equal(trace.blocks.length, 254730);
  assert.equal(new Set(trace.blocks.map((b) => b.blockGeoid)).size, trace.blocks.length);
  assert.equal(new Set(trace.blocks.map((b) => b.countyFips)).size, 83);
  const source = empty(), allocated = empty(), unavailable = empty();
  const unitProfiles = new Map(candidate.units.map((u) => [u.unitId, empty()]));
  const units = new Map(candidate.units.map((u) => [u.unitId, u]));
  const quarantine = new Set(candidate.mapAudit.quarantinedUnitIds);
  for (const block of trace.blocks) {
    assert.ok(block.blockGeoid.startsWith(block.countyFips));
    assert.equal(fields.slice(1).reduce((n, f) => n + block.sourceProfile[f], 0), block.sourceProfile.totalVotingAgePopulation);
    assert.ok(fields.every((f) => Number.isSafeInteger(block.sourceProfile[f]) && block.sourceProfile[f] >= 0));
    add(source, block.sourceProfile);
    if (block.disposition === "allocated") {
      assert.ok(!quarantine.has(block.unitId));
      assert.equal(units.get(block.unitId).countyFips, block.countyFips);
      assert.ok(["whole_block_containment", "census_internal_point"].includes(block.method));
      assert.equal(block.reason, null);
      add(allocated, block.sourceProfile);
      add(unitProfiles.get(block.unitId), block.sourceProfile);
    } else {
      assert.equal(block.disposition, "unavailable");
      assert.equal(block.unitId, null);
      assert.ok(block.reason);
      add(unavailable, block.sourceProfile);
    }
  }
  assert.deepEqual(source, candidate.sourceProfile);
  assert.deepEqual(allocated, candidate.modeledProfile);
  assert.deepEqual(unavailable, candidate.unavailableProfile);
  for (const field of fields) assert.equal(source[field], allocated[field] + unavailable[field]);
  for (const unit of candidate.units) {
    assert.deepEqual(unitProfiles.get(unit.unitId), unit.profile ?? empty());
    if (unit.status === "complete") assert.equal(unit.unresolvedTouchingBlockCount, 0);
    if (unit.status === "unavailable") assert.equal(unit.profile, null);
  }
});
}

test("Michigan comparison exposes partial coverage and preserves the complete off-map election inventory", async () => {
  const report = await json(path + "comparison.json");
  const admitted = await json("public/data/mi/2020/precinct-demographics.json");
  assert.deepEqual(report.admittedMethodCounts, { official_vtdst_bridge: 4050, registered_voter_weighted_vtd_split: 218, unavailable: 72 });
  assert.deepEqual(report.candidateStatusCounts, { complete: 3645, partial: 635, unavailable: 60 });
  assert.equal(report.recoveredCompleteUnitCount, 59);
  assert.equal(report.lostCompleteUnitCount, 682);
  assert.equal(report.offMapUnitCount, 74);
  assert.equal(report.offMapVotes, 142574);
  assert.deepEqual(report.offMapTypes, { central_count_bucket: 65, other_bucket: 1, precinct: 8 });
  assert.deepEqual(report.offMapUnits.map((u) => u.id).sort(), admitted.residualUnits.map((u) => u.id).sort());
  const byId = new Map(admitted.residualUnits.map((u) => [u.id, u]));
  for (const unit of report.offMapUnits) {
    for (const f of ["harrisVotes", "trumpVotes", "steinVotes", "oliverVotes", "residualOtherVotes", "totalVotes"]) assert.equal(unit[f], byId.get(unit.id)[f]);
  }
  assert.equal(report.local.length, 4340);
  assert.equal(report.counties.length, 83);
  for (const row of report.local) {
    if (row.admittedProfile == null || row.candidateProfile == null) assert.equal(row.delta, null);
    else for (const f of fields) assert.equal(row.delta[f], row.candidateProfile[f] - row.admittedProfile[f]);
  }
  for (const f of fields) {
    assert.equal(report.composition.censusSourceProfile[f], report.composition.candidateCompleteProfile[f]
      + report.composition.candidatePartialProfile[f] + report.composition.candidateUnallocatedProfile[f]);
    assert.equal(report.counties.reduce((n, c) => n + c.admittedProfile[f], 0), report.composition.admittedAllocatedProfile[f]);
  }
});

test("source defects remain explicit and all admitted Michigan files retain their pinned identities", async () => {
  const registry = await json("data-sources/michigan/v029d-candidate-sources.json");
  const candidate = await json(path + "candidate.json");
  assert.equal(candidate.mapAudit.invalidUnits.length, 20);
  assert.equal(candidate.mapAudit.positiveAreaOverlaps.length, 27);
  assert.equal(candidate.mapAudit.quarantinedUnitIds.length, 59);
  assert.deepEqual(candidate.mapAudit.vintageExceptions, [{ sourceElectionYear: 2023, unitId: "WP-049-29020-00002" }]);
  for (const [file, hash] of Object.entries(registry.files).filter(([p]) => !p.startsWith("work/"))) {
    assert.equal(digest(await readFile(new URL(file, root))), `sha256:${hash}`);
  }
  assert.equal(candidate.coordinateNormalization.accuracyMetres, 4);
  assert.equal(candidate.coordinateNormalization.pipeline, "+proj=noop");
});
