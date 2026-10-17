import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import test from "node:test";
import { deserializePrecinctDemographicBundle } from "../packages/data-contracts/src/precinctDemographicArtifact.ts";

const root = new URL("../", import.meta.url);
const review = "docs/review/v0.29d2-sturgis-source-review/";
const base = "docs/review/v0.29d1-michigan-normalization/";
const json = async (path) => JSON.parse(await readFile(new URL(path, root), "utf8"));
const trace = async () => JSON.parse(gunzipSync(await readFile(new URL(base + "block-trace.json.gz", root)))).blocks;

test("source review records conflicting official exports without declaring a corrected boundary", async () => {
  const source = await json(review + "source-review.json");
  assert.equal(source.verdict, "unresolved_source_disagreement");
  assert.equal(source.correctionApplied, false);
  assert.equal(source.migrationAuthorized, false);
  const g = source.geometryComparison;
  assert.ok(Math.abs(g.areaM2 - 1.2338043353713033) < 1e-8);
  assert.ok(g.maximumAltitudeM > 0.018 && g.maximumAltitudeM < 0.020);
  const byId = new Map(g.sources.map((s) => [s.source, s]));
  assert.ok(Math.abs(byId.get("state_2022_city").overlapCoveredAreaM2 - g.areaM2) < 1e-6);
  assert.ok(byId.get("state_2022_township").overlapCoveredAreaM2 < 1e-6);
  assert.equal(byId.get("city_published_precinct_2").overlapCoveredAreaM2, 0);
  assert.equal(byId.get("city_published_limits").overlapCoveredAreaM2, 0);
  assert.ok(byId.get("city_published_precinct_2").minimumBoundaryDistanceM > g.maximumAltitudeM);
});

test("both unapproved hypotheses reconstruct full accounting from only the quarantined block replacements", async () => {
  const baseline = await json(base + "candidate.json");
  const sensitivity = await json(review + "hypothetical-comparison.json");
  const blocks = await trace();
  const fields = Object.keys(baseline.sourceProfile);
  const empty = () => Object.fromEntries(fields.map((f) => [f, 0]));
  const add = (target, value) => { for (const f of fields) target[f] += value[f]; };
  const quarantined = new Map(blocks.filter((b) => b.reason === "quarantined_map_geometry").map((b) => [b.blockGeoid, b]));
  assert.equal(quarantined.size, 202);
  assert.equal(sensitivity.admissionAuthorized, false);
  assert.equal(sensitivity.sourceCorrectionApplied, false);
  assert.throws(() => deserializePrecinctDemographicBundle(JSON.stringify(sensitivity)));
  assert.equal(sensitivity.hypotheses.length, 2);
  for (const h of sensitivity.hypotheses) {
    assert.equal(h.approvedCorrection, false);
    assert.equal(h.admissionAuthorized, false);
    const replacements = new Map(h.reallocatedBlocks.map((b) => [b.blockGeoid, b]));
    assert.equal(replacements.size, 202);
    assert.deepEqual([...replacements.keys()].sort(), [...quarantined.keys()].sort());
    for (const b of replacements.values()) assert.deepEqual(b.sourceProfile, quarantined.get(b.blockGeoid).sourceProfile);
    const units = new Map(baseline.units.map((u) => [u.unitId, { profile: empty(), blocks: 0, unresolved: 0 }]));
    const allocated = empty(), unavailable = empty();
    let allocatedCount = 0;
    for (const original of blocks) {
      const b = replacements.get(original.blockGeoid) ?? original;
      if (b.disposition === "allocated") {
        allocatedCount++;
        assert.equal(b.countyFips, "26" + b.unitId.split("-")[1]);
        add(allocated, b.sourceProfile);
        add(units.get(b.unitId).profile, b.sourceProfile);
        units.get(b.unitId).blocks++;
      } else {
        add(unavailable, b.sourceProfile);
        for (const unitId of b.affectedUnitIds) units.get(unitId).unresolved++;
      }
    }
    assert.equal(allocatedCount, h.allocatedBlockCount);
    assert.equal(blocks.length - allocatedCount, h.unavailableBlockCount);
    assert.deepEqual(allocated, h.allocatedProfile);
    assert.deepEqual(unavailable, h.unavailableProfile);
    for (const f of fields) assert.equal(allocated[f] + unavailable[f], baseline.sourceProfile[f]);
    const merged = new Map(baseline.units.map((u) => [u.unitId, u]));
    for (const u of h.changedUnits) merged.set(u.unitId, u);
    const statuses = {};
    for (const [id, expected] of units) {
      const actual = merged.get(id);
      const status = expected.blocks === 0 ? "unavailable" : expected.unresolved ? "partial" : "complete";
      assert.equal(actual.status, status);
      assert.deepEqual(actual.profile, expected.blocks === 0 ? null : expected.profile);
      statuses[status] = (statuses[status] ?? 0) + 1;
    }
    assert.deepEqual(statuses, h.statusCounts);
    assert.equal(h.offMapUnitCount, 74);
    assert.equal(h.offMapVotes, 142574);
    assert.equal(h.mappedVotes, 5521612);
  }
  assert.equal(sensitivity.identicalBlockAssignmentsUnderEitherOwner,
    JSON.stringify(sensitivity.hypotheses[0].reallocatedBlocks) === JSON.stringify(sensitivity.hypotheses[1].reallocatedBlocks));
});

test("partial review exposes zero-VAP uncertainty without changing baseline completeness", async () => {
  const report = await json(review + "partial-evidence-review.json");
  const baseline = await json(base + "candidate.json");
  const original = await json("docs/review/v0.29d-michigan-comparison/candidate.json");
  const old = new Map(original.units.map((u) => [u.unitId, u]));
  assert.equal(report.partialUnitCount, 382);
  assert.equal(report.regressedUnitCount, 14);
  assert.equal(report.partialUnitsTouchingPositiveVap + report.partialUnitsTouchingOnlyZeroVap, 382);
  assert.deepEqual(report.units.map((u) => u.unitId).sort(), baseline.units.filter((u) => u.status === "partial").map((u) => u.unitId).sort());
  const blocks = (await trace()).filter((b) => b.disposition === "unavailable");
  const rows = new Map(report.units.map((u) => [u.unitId, u]));
  const exposure = new Map(report.units.map((u) => [u.unitId, { count: 0, positive: 0, vap: 0 }]));
  for (const b of blocks) for (const id of b.affectedUnitIds) {
    if (!exposure.has(id)) continue;
    const e = exposure.get(id), vap = b.sourceProfile.totalVotingAgePopulation;
    e.count++; e.positive += Number(vap > 0); e.vap += vap;
  }
  for (const [id, e] of exposure) {
    const row = rows.get(id);
    assert.equal(row.unresolvedBlockCount, e.count);
    assert.equal(row.positiveVapUnresolvedBlockCount, e.positive);
    assert.equal(row.touchingUnresolvedVap, e.vap);
    assert.equal(row.regressedFromComplete, old.get(id).status === "complete");
  }
});

test("Sturgis review leaves both earlier candidates and admitted runtime bytes unchanged", async () => {
  const registry = await json("data-sources/michigan/v029d2-sturgis-review-sources.json");
  for (const [path, hash] of Object.entries(registry.files).filter(([p]) => !p.startsWith("work/"))) {
    assert.equal(createHash("sha256").update(await readFile(new URL(path, root))).digest("hex"), hash);
  }
});
