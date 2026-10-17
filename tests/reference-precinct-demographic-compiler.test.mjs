import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  deserializePrecinctDemographicBundle,
  fingerprintPrecinctDemographicBundle,
  serializePrecinctDemographicBundle,
} from "../packages/data-contracts/src/precinctDemographicArtifact.ts";
import {
  compileReferencePrecinctDemographics,
  REFERENCE_COMPILER_CRS,
  REFERENCE_PRECINCT_DEMOGRAPHIC_COMPILER_VERSION,
} from "../packages/demographic-compiler/src/referenceCompiler.ts";

const inputUrl = new URL(
  "../data-sources/reference/v029b-precinct-demographic-fixture.json",
  import.meta.url,
);
const checkedArtifactUrl = new URL(
  "./fixtures/v029b-reference-precinct-demographics.json",
  import.meta.url,
);

async function readInput() {
  return JSON.parse(await readFile(inputUrl, "utf8"));
}

async function compileInput() {
  return compileReferencePrecinctDemographics(await readInput());
}

function traceBlock(bundle, suffix) {
  return bundle.trace.blocks.find((block) => block.blockGeoid.endsWith(suffix));
}

test("v0.29B compiles all four evidence paths and preserves unavailable source blocks", async () => {
  const bundle = await compileInput();
  assert.equal(bundle.artifact.transformVersion, REFERENCE_PRECINCT_DEMOGRAPHIC_COMPILER_VERSION);
  assert.deepEqual(bundle.artifact.coverage, {
    sourceBlockCount: 8,
    allocatedBlockCount: 4,
    unavailableBlockCount: 4,
    splitBlockCount: 2,
    mapUnitCount: 4,
    availableMapUnitCount: 2,
    unavailableMapUnitCount: 2,
    offMapElectionUnitCount: 2,
  });
  assert.deepEqual(
    bundle.artifact.allocationMethods.map(({ method, blockCount }) => [method, blockCount]),
    [
      ["census_internal_point", 1],
      ["housing_weighted_split", 1],
      ["population_weighted_split", 1],
      ["whole_block_containment", 1],
    ],
  );
  assert.deepEqual(
    bundle.trace.blocks.filter((block) => block.disposition === "unavailable")
      .map((block) => block.unavailableReason),
    [
      "zero_information_split",
      "no_compatible_geometry",
      "county_boundary_conflict",
      "invalid_source_geometry",
    ],
  );
});

test("every demographic group conserves from source through modeled and unavailable totals", async () => {
  const { artifact } = await compileInput();
  assert.deepEqual(artifact.statewide.sourceProfile, {
    totalVotingAgePopulation: 125,
    hispanic_any_race: 25,
    non_hispanic_white: 53,
    non_hispanic_black: 23,
    non_hispanic_asian: 10,
    non_hispanic_other: 14,
  });
  assert.equal(artifact.statewide.modeledProfile.totalVotingAgePopulation, 95);
  assert.equal(artifact.statewide.unavailableProfile.totalVotingAgePopulation, 30);
  const [first, second] = artifact.units;
  assert.equal(first.unitId, "42001-P1");
  assert.equal(first.profile.totalVotingAgePopulation, 76);
  assert.equal(first.quality, "mixed");
  assert.equal(second.unitId, "42001-P2");
  assert.equal(second.profile.totalVotingAgePopulation, 19);
  assert.equal(second.quality, "deterministic_population_split");
  assert.equal(artifact.units[2].profile, null);
  assert.equal(artifact.units[3].profile, null);
});

test("population and housing splits retain reduced exact rational evidence weights", async () => {
  const bundle = await compileInput();
  assert.deepEqual(
    traceBlock(bundle, "003").allocations.map(({ unitId, evidenceWeight }) => ({
      unitId,
      evidenceWeight,
    })),
    [
      { unitId: "42001-P1", evidenceWeight: { numerator: 2, denominator: 5 } },
      { unitId: "42001-P2", evidenceWeight: { numerator: 3, denominator: 5 } },
    ],
  );
  assert.deepEqual(
    traceBlock(bundle, "004").allocations.map(({ unitId, evidenceWeight }) => ({
      unitId,
      evidenceWeight,
    })),
    [
      { unitId: "42001-P1", evidenceWeight: { numerator: 1, denominator: 2 } },
      { unitId: "42001-P2", evidenceWeight: { numerator: 1, denominator: 2 } },
    ],
  );
});

test("input collection order and evidence point order cannot change compiler bytes", async () => {
  const input = await readInput();
  const first = compileReferencePrecinctDemographics(input);
  const reordered = structuredClone(input);
  reordered.mapUnits.reverse();
  reordered.sourceBlocks.reverse();
  for (const block of reordered.sourceBlocks) block.splitEvidence?.points.reverse();
  const second = compileReferencePrecinctDemographics(reordered);
  assert.equal(
    serializePrecinctDemographicBundle(second),
    serializePrecinctDemographicBundle(first),
  );
  assert.equal(
    await fingerprintPrecinctDemographicBundle(second),
    await fingerprintPrecinctDemographicBundle(first),
  );
});

test("equivalent evidence ratios compile to the same canonical artifact", async () => {
  const input = await readInput();
  const baseline = compileReferencePrecinctDemographics(input);
  const scaled = structuredClone(input);
  const populationSplit = scaled.sourceBlocks.find((block) => block.blockGeoid.endsWith("003"));
  for (const point of populationSplit.splitEvidence.points) point.weight *= 2;
  assert.equal(
    serializePrecinctDemographicBundle(compileReferencePrecinctDemographics(scaled)),
    serializePrecinctDemographicBundle(baseline),
  );
});

test("zero-information spatial splits remain unavailable instead of using polygon area", async () => {
  const bundle = await compileInput();
  const unresolved = traceBlock(bundle, "005");
  assert.equal(unresolved.disposition, "unavailable");
  assert.equal(unresolved.method, null);
  assert.equal(unresolved.unavailableReason, "zero_information_split");
  assert.deepEqual(unresolved.allocations, []);
});

test("invalid source geometry is recorded while invalid map geometry fails the build", async () => {
  const input = await readInput();
  const bundle = compileReferencePrecinctDemographics(input);
  assert.equal(traceBlock(bundle, "008").unavailableReason, "invalid_source_geometry");

  const invalidMap = structuredClone(input);
  invalidMap.mapUnits[0].geometry.coordinates[0].pop();
  assert.throws(
    () => compileReferencePrecinctDemographics(invalidMap),
    /must be closed/,
  );
});

test("cross-county points never allocate and overlapping election units fail closed", async () => {
  const input = await readInput();
  const bundle = compileReferencePrecinctDemographics(input);
  assert.equal(traceBlock(bundle, "007").unavailableReason, "county_boundary_conflict");

  const overlapping = structuredClone(input);
  overlapping.mapUnits[1].geometry = structuredClone(overlapping.mapUnits[0].geometry);
  assert.throws(
    () => compileReferencePrecinctDemographics(overlapping),
    /overlapping map units/,
  );
});

test("bad CRS, transform versions, duplicate identities, and fractional evidence fail", async () => {
  const input = await readInput();
  assert.equal(input.definition.coordinateReferenceSystem, REFERENCE_COMPILER_CRS);

  const badCrs = structuredClone(input);
  badCrs.definition.coordinateReferenceSystem = "EPSG:3857";
  assert.throws(() => compileReferencePrecinctDemographics(badCrs), /OGC:CRS84/);

  const badTransform = structuredClone(input);
  badTransform.definition.transformVersion = "future-compiler";
  assert.throws(() => compileReferencePrecinctDemographics(badTransform), /incompatible/);

  const duplicate = structuredClone(input);
  duplicate.mapUnits[1].unitId = duplicate.mapUnits[0].unitId;
  assert.throws(() => compileReferencePrecinctDemographics(duplicate), /duplicate identities/);

  const fractional = structuredClone(input);
  fractional.sourceBlocks[2].splitEvidence.points[0].weight = 1.5;
  assert.throws(() => compileReferencePrecinctDemographics(fractional), /safe integer/);

  const inventedBasis = structuredClone(input);
  inventedBasis.sourceBlocks[2].splitEvidence.basis = "area";
  assert.throws(() => compileReferencePrecinctDemographics(inventedBasis), /basis is unsupported/);
});

test("Census internal and split evidence points must lie inside their source block", async () => {
  const input = await readInput();
  const badInternalPoint = structuredClone(input);
  badInternalPoint.sourceBlocks[1].internalPoint = [2, 2];
  assert.throws(
    () => compileReferencePrecinctDemographics(badInternalPoint),
    /internal point lies outside its source geometry/,
  );

  const badSplitPoint = structuredClone(input);
  badSplitPoint.sourceBlocks[2].splitEvidence.points[0].position = [2, 2];
  assert.throws(
    () => compileReferencePrecinctDemographics(badSplitPoint),
    /split evidence point 0 lies outside its source geometry/,
  );
});

test("source checksum drift changes evidence identity without changing allocated population", async () => {
  const input = await readInput();
  const first = compileReferencePrecinctDemographics(input);
  const changed = structuredClone(input);
  changed.definition.source.checksums.demographic = `sha256:${"d".repeat(64)}`;
  const second = compileReferencePrecinctDemographics(changed);
  assert.deepEqual(second.artifact.statewide, first.artifact.statewide);
  assert.notEqual(
    await fingerprintPrecinctDemographicBundle(second),
    await fingerprintPrecinctDemographicBundle(first),
  );
});

test("the checked fixture is a byte-identical, round-trippable compiler product", async () => {
  const bundle = await compileInput();
  const serialized = serializePrecinctDemographicBundle(bundle);
  const checked = (await readFile(checkedArtifactUrl, "utf8")).trimEnd();
  assert.equal(checked, serialized);
  assert.equal(
    serializePrecinctDemographicBundle(deserializePrecinctDemographicBundle(checked)),
    checked,
  );
  assert.equal(
    await fingerprintPrecinctDemographicBundle(bundle),
    "sha256:fd535fa04e7905f0141d9a9a327bae9be8b411e7ea63c2c012de12d8c2a53bc4",
  );
});

test("the v0.29B compiler remains deterministic and UI-free", async () => {
  const source = await readFile(
    new URL("../packages/demographic-compiler/src/referenceCompiler.ts", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(source, /\bMath\.random\s*\(/);
  assert.doesNotMatch(source, /\breact\b|deck\.gl|echarts/i);
  assert.doesNotMatch(source, /candidateShare|partisanship|probability|forecast/i);
  assert.doesNotMatch(source, /raw[_ -]?area|area[_ -]?weighted/i);
});
