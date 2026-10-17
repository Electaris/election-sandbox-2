import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import test from "node:test";
import { deserializePrecinctDemographicBundle, fingerprintPrecinctDemographicBundle } from "../packages/data-contracts/src/precinctDemographicArtifact.ts";
import { compileReferencePrecinctDemographics } from "../packages/demographic-compiler/src/referenceCompiler.ts";
import { comparePennsylvaniaCandidate, PROFILE_FIELDS } from "../scripts/lib/pennsylvania-candidate-comparison.mjs";

const json = async (path) => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), "utf8"));
const review = "docs/review/v0.29c-pennsylvania-comparison";
async function inputs() {
  return { bundle: await json(`${review}/candidate-bundle.json`),
    foundation: await json("public/data/pa/2020/vtd-demographics.json"),
    crosswalk: await json("data-sources/pennsylvania/2024-vtd-crosswalk.json"),
    results: await json("public/data/pa/2024/reporting-units.json"), countyFips: "42001" };
}

test("Adams real-source candidate retains exact local composition and honest result linkage", async () => {
  const data = await inputs();
  const report = comparePennsylvaniaCandidate(data);
  assert.equal(report.coverage.sourceBlockCount, 3879);
  assert.equal(report.coverage.availableMapUnitCount, 50);
  assert.equal(report.composition.identicalUnitCount, 50);
  assert.equal(report.composition.changedUnitCount, 0);
  assert.equal(report.composition.maxAbsoluteGroupShareDeltaPp, 0);
  assert.equal(report.composition.candidateModeledProfile.totalVotingAgePopulation, 83005);
  assert.equal(report.linkage.admittedMappedVotes, 60650);
  assert.equal(report.linkage.candidateAvailableMappedVotes, 60650);
  assert.equal(report.linkage.statewideResidualVotes, 24526);
  assert.equal(report.linkage.statewideOffMapVotes, 125172);
  assert.equal(report.linkage.offMapStatewide.length, 102);
  assert.equal(report.verdict.migrationAuthorized, false);
  assert.equal(report.verdict.strictlyBetterEvidenceDemonstrated, false);
  const saved = await json(`${review}/comparison.json`);
  const { fingerprints, bytes, ...savedReport } = saved;
  assert.deepEqual(report, savedReport);
  assert.ok(bytes.candidateBundleWithTrace > bytes.candidateArtifact);
  assert.equal(await fingerprintPrecinctDemographicBundle(data.bundle), fingerprints.bundle);
});

test("frozen real-source input binds all source members and covers every admitted pilot VTD", async () => {
  const registry = await json("data-sources/pennsylvania/v029c-adams-candidate-sources.json");
  const bytes = await readFile(new URL(`../${registry.normalizedInput.path}`, import.meta.url));
  const sha = (b) => createHash("sha256").update(b).digest("hex");
  assert.equal(sha(bytes), registry.normalizedInput.compressedSha256);
  const raw = gunzipSync(bytes);
  assert.equal(sha(raw), registry.normalizedInput.sha256);
  for (const [path, hash] of Object.entries(registry.repositoryFiles)) {
    assert.equal(sha(await readFile(new URL(`../${path}`, import.meta.url))), hash, path);
  }
  const source = JSON.parse(raw);
  const { bundle } = await inputs();
  assert.equal(source.definition.coordinateReferenceSystem, "EPSG:4269");
  assert.equal(source.mapUnits.length, 50);
  assert.deepEqual(source.sourceBlocks.map((b) => b.blockGeoid), bundle.trace.blocks.map((b) => b.blockGeoid));
  assert.deepEqual(source.sourceBlocks.map((b) => b.profile), bundle.trace.blocks.map((b) => b.sourceProfile));
  assert.ok(source.sourceBlocks.every((b) => b.countyFips === "42001" && b.geometry && b.splitEvidence === null));
});

test("comparison is independent of result, crosswalk, and admitted row order", async () => {
  const data = await inputs();
  const expected = comparePennsylvaniaCandidate(data);
  data.results.reportingUnits.reverse();
  data.crosswalk.matchedGeometry.reverse();
  for (const m of data.crosswalk.matchedGeometry) m.reportingUnits.reverse();
  data.foundation.vtdRows.reverse();
  assert.deepEqual(comparePennsylvaniaCandidate(data), expected);
});

test("comparison rejects altered local votes, link methods, duplicate linkage, and terrain loss", async () => {
  const original = await inputs();
  const first = original.crosswalk.matchedGeometry.find((m) => m.geometryId.startsWith("42001"));
  const changeVote = structuredClone(original);
  changeVote.results.reportingUnits.find((u) => u.id === first.reportingUnits[0].reportingUnitId).harrisVotes += 1;
  assert.throws(() => comparePennsylvaniaCandidate(changeVote), /Result votes differ/);
  const changeMethod = structuredClone(original);
  changeMethod.crosswalk.matchedGeometry.find((m) => m.geometryId === first.geometryId).reportingUnits[0].matchMethod = "fuzzy";
  assert.throws(() => comparePennsylvaniaCandidate(changeMethod), /Unsupported result link/);
  const duplicate = structuredClone(original);
  duplicate.crosswalk.matchedGeometry.find((m) => m.geometryId === first.geometryId).reportingUnits.push(first.reportingUnits[0]);
  assert.throws(() => comparePennsylvaniaCandidate(duplicate), /duplicate/);
  const missing = structuredClone(original);
  missing.foundation.vtdRows = missing.foundation.vtdRows.filter((r) => r[0] !== first.geometryId);
  assert.throws(() => comparePennsylvaniaCandidate(missing), /terrain/);
});

test("candidate bundle rejects demographic tampering and cross-county allocation", async () => {
  const { bundle } = await inputs();
  const tampered = structuredClone(bundle);
  tampered.trace.blocks[0].sourceProfile.totalVotingAgePopulation += 1;
  assert.throws(() => deserializePrecinctDemographicBundle(JSON.stringify(tampered)));
  const crossed = structuredClone(bundle);
  crossed.trace.blocks[0].countyFips = "42003";
  assert.throws(() => deserializePrecinctDemographicBundle(JSON.stringify(crossed)));
});

test("native Census NAD83 uses the same geographic predicates and retains the frozen reference result", async () => {
  const source = await json("data-sources/reference/v029b-precinct-demographic-fixture.json");
  const before = compileReferencePrecinctDemographics(source);
  source.definition.coordinateReferenceSystem = "EPSG:4269";
  assert.deepEqual(compileReferencePrecinctDemographics(source), before);
  source.definition.coordinateReferenceSystem = "EPSG:3857";
  assert.throws(() => compileReferencePrecinctDemographics(source), /CRS84/);
});

test("an unavailable VTD has null deltas and never counts as an exact demographic match", async () => {
  const source = await json("data-sources/reference/v029b-precinct-demographic-fixture.json");
  source.definition.mapUnit = "vtd";
  source.definition.electionId = "test";
  source.definition.offMapElectionUnitCount = 0;
  source.mapUnits = source.mapUnits.slice(0, 3).map((u, i) => ({ ...u, unitId: `4200100000${i}`, geometryId: `4200100000${i}` }));
  source.sourceBlocks = source.sourceBlocks.filter((b) => b.countyFips === "42001");
  const bundle = compileReferencePrecinctDemographics(source);
  const fields = ["geoid", "censusName", ...Object.values(PROFILE_FIELDS), "harrisVotes", "trumpVotes", "steinVotes", "oliverVotes", "residualOtherVotes", "exactSourceUnitCount", "canonicalSourceUnitCount"];
  const foundation = { schemaVersion: 3, encoding: "vtd-row-v1", electionId: "test", vtdFields: fields,
    vtdRows: source.mapUnits.map((u) => fields.map((f) => f === "geoid" ? u.unitId : f === "censusName" ? "Test VTD" : 0)) };
  const report = comparePennsylvaniaCandidate({ bundle, foundation, countyFips: "42001", crosswalk: { matchedGeometry: [] }, results: { reportingUnits: [] } });
  const unavailable = report.local.filter((u) => u.status === "unavailable");
  assert.ok(unavailable.length > 0);
  assert.ok(unavailable.every((u) => u.delta === null && u.groupShareDeltaPp === null && u.candidateProfile === null));
  assert.ok(report.composition.identicalUnitCount < report.local.length);
});
