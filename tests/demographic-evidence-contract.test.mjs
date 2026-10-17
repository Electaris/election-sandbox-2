import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  DEMOGRAPHIC_GROUP_IDS,
  createDemographicEvidenceContract,
  createDemographicEvidenceInventory,
  deserializeDemographicEvidenceInventory,
  serializeDemographicEvidenceInventory,
} from "../packages/data-contracts/src/demographicEvidence.ts";
import {
  buildAdmittedDemographicEvidenceInventory,
  buildDetailedStateDemographicEvidenceContract,
} from "../src/data/demographicEvidence.ts";
import { decodeMichiganDemographicFoundation } from "../src/data/miDemographics.ts";
import { decodePennsylvaniaDemographicFoundation } from "../src/data/paDemographics.ts";
import { decodeWisconsinWardFoundation } from "../src/data/wiWards.ts";

const fixturePaths = {
  PA: new URL("../public/data/pa/2020/vtd-demographics.json", import.meta.url),
  MI: new URL("../public/data/mi/2020/precinct-demographics.json", import.meta.url),
  WI: new URL("../public/data/wi/2020/ward-demographics.json", import.meta.url),
};

async function loadFoundations() {
  const [pa, mi, wi] = await Promise.all([
    readFile(fixturePaths.PA, "utf8").then(JSON.parse).then(decodePennsylvaniaDemographicFoundation),
    readFile(fixturePaths.MI, "utf8").then(JSON.parse).then(decodeMichiganDemographicFoundation),
    readFile(fixturePaths.WI, "utf8").then(JSON.parse).then(decodeWisconsinWardFoundation),
  ]);
  return { PA: pa, MI: mi, WI: wi };
}

test("admitted demographic inventory preserves each state's actual evidence model", async () => {
  const foundations = await loadFoundations();
  const inventory = buildAdmittedDemographicEvidenceInventory([
    foundations.WI,
    foundations.PA,
    foundations.MI,
  ]);
  assert.deepEqual(inventory.contracts.map((contract) => contract.stateCode), ["MI", "PA", "WI"]);

  const pa = inventory.contracts.find((contract) => contract.stateCode === "PA");
  assert.equal(pa.geography.alignment, "exact_source_geography");
  assert.equal(pa.denominator.statewidePopulation, 10_353_548);
  assert.equal(pa.denominator.modeledPopulation, 10_182_984);
  assert.equal(pa.composition.status, "available");
  assert.deepEqual(pa.composition.groups, DEMOGRAPHIC_GROUP_IDS);
  assert.equal(pa.coverage.turnoutReadyUnitCount, 8_880);
  assert.equal(pa.coverage.turnoutCappedUnitCount, 158);
  assert.equal(pa.coverage.noMappedResultUnitCount, 140);

  const mi = inventory.contracts.find((contract) => contract.stateCode === "MI");
  assert.equal(mi.geography.alignment, "deterministic_cross_vintage_bridge");
  assert.equal(mi.composition.quality, "mixed_census_and_deterministic_allocation");
  assert.deepEqual(mi.crosswalk.methods, [
    { method: "direct_census_vtd", unitCount: 4_050 },
    { method: "registered_voter_weighted_vtd_split", unitCount: 218 },
    { method: "unavailable", unitCount: 72 },
  ]);
  assert.equal(mi.coverage.denominatorObservedUnitCount, 4_268);
  assert.equal(mi.coverage.offMapElectionUnitCount, 74);

  const wi = inventory.contracts.find((contract) => contract.stateCode === "WI");
  assert.equal(wi.geography.alignment, "official_population_reconstruction");
  assert.equal(wi.denominator.statewidePopulation, 4_612_300);
  assert.equal(wi.composition.status, "unavailable");
  assert.deepEqual(wi.composition.groups, []);
  assert.equal(wi.capability.futureGroupTurnoutAssumptionsEligible, false);
  assert.equal(wi.coverage.compositionUnavailableUnitCount, 7_086);
});

test("composition counts reconcile exactly to statewide and modeled VAP", async () => {
  const foundations = await loadFoundations();
  for (const stateCode of ["PA", "MI"]) {
    const contract = buildDetailedStateDemographicEvidenceContract(foundations[stateCode]);
    const statewideSum = Object.values(contract.composition.statewideCounts)
      .reduce((sum, count) => sum + count, 0);
    const modeledSum = Object.values(contract.composition.modeledCounts)
      .reduce((sum, count) => sum + count, 0);
    assert.equal(statewideSum, contract.denominator.statewidePopulation);
    assert.equal(modeledSum, contract.denominator.modeledPopulation);
  }
});

test("inventory serialization is deterministic, round-trippable, and input-order independent", async () => {
  const foundations = await loadFoundations();
  const first = buildAdmittedDemographicEvidenceInventory([
    foundations.PA,
    foundations.MI,
    foundations.WI,
  ]);
  const second = buildAdmittedDemographicEvidenceInventory([
    foundations.WI,
    foundations.MI,
    foundations.PA,
  ]);
  const serialized = serializeDemographicEvidenceInventory(first);
  assert.equal(serialized, serializeDemographicEvidenceInventory(second));
  assert.equal(serializeDemographicEvidenceInventory(
    deserializeDemographicEvidenceInventory(serialized),
  ), serialized);
});

test("v0.28A separates observed aggregate evidence from authored behavior assumptions", async () => {
  const foundations = await loadFoundations();
  for (const foundation of Object.values(foundations)) {
    const contract = buildDetailedStateDemographicEvidenceContract(foundation);
    assert.equal(contract.denominator.isCitizenVotingAgePopulation, false);
    assert.equal(contract.denominator.isElectionYearEligibleVoterEstimate, false);
    assert.equal(contract.inferenceBoundary.observedIndividualTurnout, false);
    assert.equal(contract.inferenceBoundary.observedIndividualCandidatePreference, false);
    assert.equal(contract.inferenceBoundary.groupTurnoutMustBeUserAuthored, true);
    assert.equal(contract.inferenceBoundary.groupCandidatePreferenceMustBeUserAuthored, true);
    assert.equal(contract.inferenceBoundary.ecologicalInferenceAllowed, false);
    assert.equal(contract.capability.voteMutationAuthorized, false);
  }
});

test("contradictory demographic claims and arithmetic fail closed", async () => {
  const foundations = await loadFoundations();
  const contract = buildDetailedStateDemographicEvidenceContract(foundations.PA);
  assert.throws(() => createDemographicEvidenceContract({
    ...contract,
    denominator: { ...contract.denominator, isCitizenVotingAgePopulation: true },
  }), /cannot claim CVAP/);
  assert.throws(() => createDemographicEvidenceContract({
    ...contract,
    coverage: { ...contract.coverage, terrainUnitCount: contract.coverage.terrainUnitCount + 1 },
  }), /must reconcile/);
  assert.throws(() => createDemographicEvidenceContract({
    ...contract,
    composition: {
      ...contract.composition,
      statewideCounts: {
        ...contract.composition.statewideCounts,
        non_hispanic_white: contract.composition.statewideCounts.non_hispanic_white + 1,
      },
    },
  }), /reconcile to statewide VAP/);
  assert.throws(() => createDemographicEvidenceContract({
    ...contract,
    capability: { ...contract.capability, voteMutationAuthorized: true },
  }), /cannot authorize vote mutation/);
});

test("inventories reject partial state sets, duplicates, tampering, and unknown fields", async () => {
  const foundations = await loadFoundations();
  const contracts = Object.values(foundations).map(buildDetailedStateDemographicEvidenceContract);
  assert.throws(() => createDemographicEvidenceInventory(contracts.slice(0, 2)), /exactly admitted/);
  assert.throws(() => createDemographicEvidenceInventory([contracts[0], contracts[0], contracts[2]]), /duplicate/);

  const serialized = serializeDemographicEvidenceInventory(
    createDemographicEvidenceInventory(contracts),
  );
  const tampered = JSON.parse(serialized);
  tampered.contracts[0].coverage.turnoutReadyUnitCount += 1;
  assert.throws(
    () => deserializeDemographicEvidenceInventory(JSON.stringify(tampered)),
    /cannot exceed|reconcile/,
  );
  const extended = JSON.parse(serialized);
  extended.contracts[0].inventedPreference = 1;
  assert.throws(
    () => deserializeDemographicEvidenceInventory(JSON.stringify(extended)),
    /noncanonical or unknown content/,
  );
});
