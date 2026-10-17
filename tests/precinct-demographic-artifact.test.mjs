import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  createBlockAllocationTrace,
  createPrecinctDemographicArtifact,
  createPrecinctDemographicBundle,
  deserializePrecinctDemographicBundle,
  fingerprintBlockAllocationTrace,
  fingerprintPrecinctDemographicArtifact,
  fingerprintPrecinctDemographicBundle,
  serializePrecinctDemographicBundle,
} from "../packages/data-contracts/src/precinctDemographicArtifact.ts";

const checksum = (character) => `sha256:${character.repeat(64)}`;

const profiles = {
  source: {
    totalVotingAgePopulation: 70,
    hispanic_any_race: 15,
    non_hispanic_white: 29,
    non_hispanic_black: 11,
    non_hispanic_asian: 5,
    non_hispanic_other: 10,
  },
  modeled: {
    totalVotingAgePopulation: 60,
    hispanic_any_race: 14,
    non_hispanic_white: 26,
    non_hispanic_black: 9,
    non_hispanic_asian: 4,
    non_hispanic_other: 7,
  },
  unavailable: {
    totalVotingAgePopulation: 10,
    hispanic_any_race: 1,
    non_hispanic_white: 3,
    non_hispanic_black: 2,
    non_hispanic_asian: 1,
    non_hispanic_other: 3,
  },
  blockDirect: {
    totalVotingAgePopulation: 40,
    hispanic_any_race: 10,
    non_hispanic_white: 20,
    non_hispanic_black: 5,
    non_hispanic_asian: 2,
    non_hispanic_other: 3,
  },
  blockSplit: {
    totalVotingAgePopulation: 20,
    hispanic_any_race: 4,
    non_hispanic_white: 6,
    non_hispanic_black: 4,
    non_hispanic_asian: 2,
    non_hispanic_other: 4,
  },
  splitToOne: {
    totalVotingAgePopulation: 8,
    hispanic_any_race: 2,
    non_hispanic_white: 3,
    non_hispanic_black: 1,
    non_hispanic_asian: 1,
    non_hispanic_other: 1,
  },
  splitToTwo: {
    totalVotingAgePopulation: 12,
    hispanic_any_race: 2,
    non_hispanic_white: 3,
    non_hispanic_black: 3,
    non_hispanic_asian: 1,
    non_hispanic_other: 3,
  },
  unitOne: {
    totalVotingAgePopulation: 48,
    hispanic_any_race: 12,
    non_hispanic_white: 23,
    non_hispanic_black: 6,
    non_hispanic_asian: 3,
    non_hispanic_other: 4,
  },
};

function artifactInput(overrides = {}) {
  return {
    artifactId: "pa-2024-precinct-demographics-reference-v1",
    stateCode: "PA",
    stateFips: "42",
    electionId: "2024-president",
    transformVersion: "block-to-precinct-reference-v1",
    source: {
      demographicSourceId: "census-2020-pl94-pa-block-p4",
      precinctGeometrySourceId: "pa-2024-precinct-reference",
      electionResultSourceId: "pa-2024-presidential-reporting-units",
      demographicVintage: "2020 Census",
      mapVintage: "2024 election",
      electionVintage: "2024 general",
      sourceTable: "P4",
      checksums: {
        demographic: checksum("a"),
        precinctGeometry: checksum("b"),
        electionResults: checksum("c"),
      },
    },
    geography: {
      mapUnit: "precinct",
      countyBoundaryPolicy: "strict_no_cross_county_allocation",
      allocationProfileId: "census-block-population-evidence-v1",
    },
    statewide: {
      sourceProfile: profiles.source,
      modeledProfile: profiles.modeled,
      unavailableProfile: profiles.unavailable,
    },
    coverage: {
      sourceBlockCount: 3,
      allocatedBlockCount: 2,
      unavailableBlockCount: 1,
      splitBlockCount: 1,
      mapUnitCount: 3,
      availableMapUnitCount: 2,
      unavailableMapUnitCount: 1,
      offMapElectionUnitCount: 2,
    },
    allocationMethods: [
      {
        method: "population_weighted_split",
        blockCount: 1,
        allocatedVotingAgePopulation: 20,
      },
      {
        method: "whole_block_containment",
        blockCount: 1,
        allocatedVotingAgePopulation: 40,
      },
    ],
    units: [
      {
        unitId: "42001-P2",
        countyFips: "42001",
        geometryId: "geometry-42001-P2",
        status: "available",
        quality: "deterministic_population_split",
        allocationMethods: ["population_weighted_split"],
        sourceBlockCount: 1,
        splitSourceBlockCount: 1,
        profile: profiles.splitToTwo,
      },
      {
        unitId: "42003-P3",
        countyFips: "42003",
        geometryId: "geometry-42003-P3",
        status: "unavailable",
        quality: "unavailable",
        allocationMethods: [],
        sourceBlockCount: 0,
        splitSourceBlockCount: 0,
        profile: null,
      },
      {
        unitId: "42001-P1",
        countyFips: "42001",
        geometryId: "geometry-42001-P1",
        status: "available",
        quality: "mixed",
        allocationMethods: ["whole_block_containment", "population_weighted_split"],
        sourceBlockCount: 2,
        splitSourceBlockCount: 1,
        profile: profiles.unitOne,
      },
    ],
    inferenceBoundary: {
      aggregatePopulationOnly: true,
      observedIndividualTurnout: false,
      observedIndividualCandidatePreference: false,
      ecologicalInferenceAllowed: false,
    },
    limitations: [
      "No individual ballot identity",
      "Unavailable blocks remain outside modeled composition",
    ],
    ...overrides,
  };
}

function traceInput(overrides = {}) {
  return {
    artifactId: "pa-2024-precinct-demographics-reference-v1",
    transformVersion: "block-to-precinct-reference-v1",
    blocks: [
      {
        blockGeoid: "420030002002001",
        countyFips: "42003",
        sourceProfile: profiles.unavailable,
        disposition: "unavailable",
        method: null,
        unavailableReason: "no_compatible_geometry",
        allocations: [],
      },
      {
        blockGeoid: "420010001001002",
        countyFips: "42001",
        sourceProfile: profiles.blockSplit,
        disposition: "allocated",
        method: "population_weighted_split",
        unavailableReason: null,
        allocations: [
          {
            unitId: "42001-P2",
            profile: profiles.splitToTwo,
            evidenceWeight: { numerator: 3, denominator: 5 },
          },
          {
            unitId: "42001-P1",
            profile: profiles.splitToOne,
            evidenceWeight: { numerator: 2, denominator: 5 },
          },
        ],
      },
      {
        blockGeoid: "420010001001001",
        countyFips: "42001",
        sourceProfile: profiles.blockDirect,
        disposition: "allocated",
        method: "whole_block_containment",
        unavailableReason: null,
        allocations: [{
          unitId: "42001-P1",
          profile: profiles.blockDirect,
          evidenceWeight: null,
        }],
      },
    ],
    ...overrides,
  };
}

function buildBundle() {
  const artifact = createPrecinctDemographicArtifact(artifactInput());
  const trace = createBlockAllocationTrace(traceInput());
  return createPrecinctDemographicBundle(artifact, trace);
}

test("v0.29A bundle reconciles every group from Census blocks into map units", () => {
  const bundle = buildBundle();
  assert.deepEqual(bundle.artifact.units.map((unit) => unit.unitId), [
    "42001-P1",
    "42001-P2",
    "42003-P3",
  ]);
  assert.deepEqual(bundle.trace.blocks.map((block) => block.blockGeoid), [
    "420010001001001",
    "420010001001002",
    "420030002002001",
  ]);
  assert.deepEqual(bundle.artifact.statewide.sourceProfile, profiles.source);
  assert.deepEqual(bundle.artifact.statewide.modeledProfile, profiles.modeled);
  assert.deepEqual(bundle.artifact.statewide.unavailableProfile, profiles.unavailable);
  assert.equal(bundle.artifact.coverage.offMapElectionUnitCount, 2);
  assert.equal(bundle.artifact.units[0].quality, "mixed");
  assert.equal(bundle.artifact.units[1].quality, "deterministic_population_split");
  assert.equal(bundle.artifact.units[2].profile, null);
});

test("canonical serialization and SHA-256 fingerprints ignore input collection ordering", async () => {
  const first = buildBundle();
  const secondArtifact = createPrecinctDemographicArtifact({
    ...artifactInput(),
    units: [...artifactInput().units].reverse(),
    allocationMethods: [...artifactInput().allocationMethods].reverse(),
  });
  const reversedBlocks = [...traceInput().blocks].reverse().map((block) => ({
    ...block,
    allocations: [...block.allocations].reverse(),
  }));
  const secondTrace = createBlockAllocationTrace({
    ...traceInput(),
    blocks: reversedBlocks,
  });
  const second = createPrecinctDemographicBundle(secondArtifact, secondTrace);
  assert.equal(serializePrecinctDemographicBundle(first), serializePrecinctDemographicBundle(second));
  assert.equal(
    await fingerprintPrecinctDemographicBundle(first),
    await fingerprintPrecinctDemographicBundle(second),
  );
  assert.match(await fingerprintPrecinctDemographicArtifact(first.artifact), /^sha256:[0-9a-f]{64}$/);
  assert.match(await fingerprintBlockAllocationTrace(first.trace), /^sha256:[0-9a-f]{64}$/);
});

test("bundle serialization round-trips byte-identically and rejects unknown content", () => {
  const serialized = serializePrecinctDemographicBundle(buildBundle());
  assert.equal(serializePrecinctDemographicBundle(
    deserializePrecinctDemographicBundle(serialized),
  ), serialized);

  const extended = JSON.parse(serialized);
  extended.artifact.inferredPartisanship = true;
  assert.throws(
    () => deserializePrecinctDemographicBundle(JSON.stringify(extended)),
    /noncanonical or unknown content/,
  );
});

test("block traces reject fractional conservation, fake splits, and unavailable allocations", () => {
  const fractional = structuredClone(traceInput());
  fractional.blocks[1].allocations[0].profile.non_hispanic_black += 1;
  assert.throws(() => createBlockAllocationTrace(fractional), /reconcile/);

  const fakeSplit = structuredClone(traceInput());
  fakeSplit.blocks[1].allocations = [fakeSplit.blocks[1].allocations[0]];
  assert.throws(() => createBlockAllocationTrace(fakeSplit), /multiple targets/);

  const unavailableAllocation = structuredClone(traceInput());
  unavailableAllocation.blocks[0].allocations = [{
    unitId: "42003-P3",
    profile: profiles.unavailable,
    evidenceWeight: null,
  }];
  assert.throws(() => createBlockAllocationTrace(unavailableAllocation), /carries an allocation/);

  const invalidWeights = structuredClone(traceInput());
  invalidWeights.blocks[1].allocations[0].evidenceWeight.numerator = 4;
  assert.throws(() => createBlockAllocationTrace(invalidWeights), /sum to their denominator/);
});

test("bundle admission rejects cross-county placement and unknown target units", () => {
  const artifact = createPrecinctDemographicArtifact(artifactInput());

  const crossCounty = structuredClone(traceInput());
  crossCounty.blocks[1].allocations[1].unitId = "42003-P3";
  const crossCountyTrace = createBlockAllocationTrace(crossCounty);
  assert.throws(
    () => createPrecinctDemographicBundle(artifact, crossCountyTrace),
    /crosses a county boundary/,
  );

  const unknownTarget = structuredClone(traceInput());
  unknownTarget.blocks[1].allocations[1].unitId = "42001-UNKNOWN";
  const unknownTrace = createBlockAllocationTrace(unknownTarget);
  assert.throws(
    () => createPrecinctDemographicBundle(artifact, unknownTrace),
    /targets unknown unit/,
  );
});

test("artifact admission rejects unsupported quality, bad checksums, and ecological claims", () => {
  const badQuality = structuredClone(artifactInput());
  badQuality.units[0].quality = "direct_block_assignment";
  assert.throws(() => createPrecinctDemographicArtifact(badQuality), /quality is inconsistent/);

  const badChecksum = structuredClone(artifactInput());
  badChecksum.source.checksums.demographic = "not-a-checksum";
  assert.throws(() => createPrecinctDemographicArtifact(badChecksum), /canonical SHA-256/);

  const ecologicalClaim = structuredClone(artifactInput());
  ecologicalClaim.inferenceBoundary.ecologicalInferenceAllowed = true;
  assert.throws(() => createPrecinctDemographicArtifact(ecologicalClaim), /inference boundary/);

  const inventedMethod = structuredClone(artifactInput());
  inventedMethod.allocationMethods[0].method = "raw_polygon_area_split";
  assert.throws(() => createPrecinctDemographicArtifact(inventedMethod), /Unsupported allocation method/);

  const emptyArtifact = structuredClone(artifactInput());
  emptyArtifact.coverage.sourceBlockCount = 0;
  assert.throws(() => createPrecinctDemographicArtifact(emptyArtifact), /must be positive/);
});

test("artifact and trace identity drift fails before a bundle can publish", () => {
  const artifact = createPrecinctDemographicArtifact(artifactInput());
  const wrongIdentityTrace = createBlockAllocationTrace({
    ...traceInput(),
    artifactId: "different-artifact",
  });
  assert.throws(
    () => createPrecinctDemographicBundle(artifact, wrongIdentityTrace),
    /identities do not match/,
  );

  const methodDrift = structuredClone(traceInput());
  methodDrift.blocks[2].method = "census_internal_point";
  const methodDriftTrace = createBlockAllocationTrace(methodDrift);
  assert.throws(
    () => createPrecinctDemographicBundle(artifact, methodDriftTrace),
    /method identities do not reconcile/,
  );
});

test("the v0.29A contract remains headless and deterministic", async () => {
  const source = await readFile(
    new URL("../packages/data-contracts/src/precinctDemographicArtifact.ts", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(source, /\bMath\.random\s*\(/);
  assert.doesNotMatch(source, /\breact\b|deck\.gl|echarts/i);
  assert.doesNotMatch(source, /candidateShare|partisanship|probability|forecast/i);
});
