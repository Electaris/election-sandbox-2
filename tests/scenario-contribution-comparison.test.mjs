import assert from "node:assert/strict";
import test from "node:test";

import {
  buildScenarioContributionComparison,
  createScenarioDeltaLedger,
} from "../packages/election-analytics/src/index.ts";
import { applyBehaviorScenario, electoralAllocationForResult } from "../packages/election-model/src/scenario.ts";

const units = [
  {
    id: "A-1",
    countyFips: "00001",
    geometryId: "map-A-1",
    harrisVotes: 60,
    trumpVotes: 40,
    steinVotes: 5,
    oliverVotes: 2,
    residualOtherVotes: 3,
    otherVotes: 10,
    totalVotes: 110,
    turnoutDenominator: 150,
    turnoutCapacity: 40,
  },
  {
    id: "STATE-ADJUSTMENT",
    countyFips: null,
    geometryId: null,
    harrisVotes: 2,
    trumpVotes: 1,
    steinVotes: 0,
    oliverVotes: 0,
    residualOtherVotes: 0,
    otherVotes: 0,
    totalVotes: 3,
    turnoutDenominator: 3,
    turnoutCapacity: 0,
  },
  {
    id: "B-1",
    countyFips: "00003",
    geometryId: "map-B-1",
    harrisVotes: 10,
    trumpVotes: 90,
    steinVotes: 5,
    oliverVotes: 2,
    residualOtherVotes: 3,
    otherVotes: 10,
    totalVotes: 110,
    turnoutDenominator: 150,
    turnoutCapacity: 40,
  },
];

function endpointFromUnits(sourceUnits, electoralVotes = 10) {
  const totals = sourceUnits.reduce((sum, unit) => ({
    harrisVotes: sum.harrisVotes + unit.harrisVotes,
    trumpVotes: sum.trumpVotes + unit.trumpVotes,
    steinVotes: sum.steinVotes + unit.steinVotes,
    oliverVotes: sum.oliverVotes + unit.oliverVotes,
    residualOtherVotes: sum.residualOtherVotes + unit.residualOtherVotes,
    otherVotes: sum.otherVotes + unit.otherVotes,
    totalVotes: sum.totalVotes + unit.totalVotes,
  }), { harrisVotes: 0, trumpVotes: 0, steinVotes: 0, oliverVotes: 0, residualOtherVotes: 0, otherVotes: 0, totalVotes: 0 });
  return { code: "TS", ...totals, ...electoralAllocationForResult(totals, electoralVotes) };
}

function buildLedger(settings) {
  const scenario = applyBehaviorScenario(units, settings);
  return createScenarioDeltaLedger({
    actualState: endpointFromUnits(units),
    scenarioState: endpointFromUnits(scenario.units),
    baselineUnits: units,
    scenario,
    targetCandidate: "stein",
    sourceIds: ["source:test-foundation", "source:test-recipe"],
  });
}

test("comparison exposes exact certified and scenario plurality structures", () => {
  const ledger = buildLedger({
    turnoutIncreasePoints: 0,
    addedVoterHarrisShare: 0.5,
    preferenceShiftPoints: 0,
    thirdPartyCandidate: "stein",
    thirdPartyShiftPoints: 50,
    thirdPartyHarrisExchangeShare: 0.5,
  });
  const comparison = buildScenarioContributionComparison({
    ledger,
    scope: "county",
    countyNames: { "00001": "Alpha County", "00003": "Beta County" },
  });

  assert.equal(comparison.certified.winner, "trump");
  assert.equal(comparison.certified.runnerUp, "harris");
  assert.equal(comparison.scenario.winner, "stein");
  assert.equal(comparison.winnerChanged, true);
  assert.equal(comparison.certified.supportingRows[0].name, "Beta County");
  assert.equal(comparison.certified.rows.reduce((sum, row) => sum + row.contributionVotes, 0), comparison.certified.pluralityMarginVotes);
  assert.equal(comparison.scenario.rows.reduce((sum, row) => sum + row.contributionVotes, 0), comparison.scenario.pluralityMarginVotes);
  assert.equal(comparison.certified.unmappedContributionVotes, -1);
  assert.equal(comparison.certified.supportingRows.some((row) => row.id === "TS:statewide-residual"), false);
});

test("reporting-unit comparison is deterministic under ledger row reordering", () => {
  const ledger = buildLedger({
    turnoutIncreasePoints: 0,
    addedVoterHarrisShare: 0.5,
    preferenceShiftPoints: 15,
    thirdPartyCandidate: "oliver",
    thirdPartyShiftPoints: 0,
    thirdPartyHarrisExchangeShare: 0.5,
  });
  const names = { "map-A-1": "Alpha Ward", "map-B-1": "Beta Ward" };
  const first = buildScenarioContributionComparison({ ledger, scope: "unit", unitNames: names });
  const second = buildScenarioContributionComparison({
    ledger: { ...ledger, units: [...ledger.units].reverse() },
    scope: "unit",
    unitNames: names,
  });

  assert.deepEqual(first, second);
  assert.equal(first.certified.supportingRows[0].name, "Beta Ward");
  assert.equal(first.certified.supportingRows[0].countyFips, "00003");
  assert.equal(first.certified.supportingRows.some((row) => row.geometryId === null), false);
});

test("a tied endpoint does not invent a contribution hierarchy", () => {
  const sourceLedger = buildLedger({
    turnoutIncreasePoints: 0,
    addedVoterHarrisShare: 0.5,
    preferenceShiftPoints: 0,
    thirdPartyCandidate: "stein",
    thirdPartyShiftPoints: 0,
    thirdPartyHarrisExchangeShare: 0.5,
  });
  const ledger = {
    ...sourceLedger,
    scenario: {
      ...sourceLedger.scenario,
      harrisVotes: 100,
      trumpVotes: 100,
    },
  };
  const comparison = buildScenarioContributionComparison({ ledger, scope: "county" });

  assert.equal(comparison.scenario.winner, "tie");
  assert.deepEqual(comparison.scenario.rows, []);
  assert.deepEqual(comparison.scenario.supportingRows, []);
  assert.equal(comparison.scenario.strongestResistance, null);
});
