import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { DEMOGRAPHIC_GROUP_IDS } from "../packages/data-contracts/src/demographicEvidence.ts";
import { applyBehaviorScenario } from "../packages/election-model/src/scenario.ts";
import { decodeMichiganDemographicFoundation, toMichiganBehaviorModelUnits } from "../src/data/miDemographics.ts";
import { decodePennsylvaniaDemographicFoundation, toBehaviorModelUnits } from "../src/data/paDemographics.ts";
import { decodeWisconsinWardFoundation, toWisconsinBehaviorModelUnits } from "../src/data/wiWards.ts";

const baseSettings = {
  turnoutIncreasePoints: 0,
  addedVoterHarrisShare: 0.6,
  preferenceShiftPoints: 0,
  thirdPartyCandidate: "stein",
  thirdPartyShiftPoints: 0,
  thirdPartyHarrisExchangeShare: 0.5,
};

async function loadUnits() {
  const [pa, mi, wi] = await Promise.all([
    readFile(new URL("../public/data/pa/2020/vtd-demographics.json", import.meta.url), "utf8")
      .then(JSON.parse).then(decodePennsylvaniaDemographicFoundation).then(toBehaviorModelUnits),
    readFile(new URL("../public/data/mi/2020/precinct-demographics.json", import.meta.url), "utf8")
      .then(JSON.parse).then(decodeMichiganDemographicFoundation).then(toMichiganBehaviorModelUnits),
    readFile(new URL("../public/data/wi/2020/ward-demographics.json", import.meta.url), "utf8")
      .then(JSON.parse).then(decodeWisconsinWardFoundation).then(toWisconsinBehaviorModelUnits),
  ]);
  return { PA: pa, MI: mi, WI: wi };
}

function candidateTotal(units, key) {
  return units.reduce((sum, unit) => sum + unit[key], 0);
}

test("Pennsylvania group turnout adds exact conserved ballots through local VAP capacity", async () => {
  const { PA } = await loadUnits();
  const scenario = applyBehaviorScenario(PA, {
    ...baseSettings,
    addedVoterHarrisShare: 0.7,
    demographicTurnoutIncreasePoints: {
      non_hispanic_black: 5,
      hispanic_any_race: 2.5,
    },
  });
  assert.equal(scenario.demographicTurnout.status, "applied");
  assert.equal(scenario.turnout.addedVotes, scenario.demographicTurnout.addedVotes);
  assert.equal(scenario.turnout.requestedVotes, scenario.demographicTurnout.requestedVotes);
  assert.equal(scenario.turnout.harrisVotes, Math.round(scenario.turnout.addedVotes * 0.7));
  assert.equal(
    scenario.turnout.harrisVotes
      + scenario.turnout.trumpVotes
      + scenario.turnout.steinVotes
      + scenario.turnout.oliverVotes
      + scenario.turnout.residualOtherVotes,
    scenario.turnout.addedVotes,
  );
  assert.equal(
    scenario.units.reduce((sum, unit) => sum + (unit.demographicTurnoutAddedVotes ?? 0), 0),
    scenario.demographicTurnout.addedVotes,
  );
  assert.equal(
    scenario.totals.totalVotes - candidateTotal(PA, "totalVotes"),
    scenario.demographicTurnout.addedVotes,
  );
  assert.deepEqual(
    scenario.demographicTurnout.groups.map((group) => group.groupId),
    DEMOGRAPHIC_GROUP_IDS,
  );
});

test("group allocation is independent of reporting-unit collection order", async () => {
  const { MI } = await loadUnits();
  const settings = {
    ...baseSettings,
    demographicTurnoutIncreasePoints: {
      non_hispanic_white: 1.2,
      non_hispanic_black: 3.4,
      non_hispanic_asian: 2.1,
    },
  };
  const forward = applyBehaviorScenario(MI, settings);
  const reversed = applyBehaviorScenario([...MI].reverse(), settings);
  assert.deepEqual(forward.demographicTurnout, reversed.demographicTurnout);
  const allocation = (scenario) => Object.fromEntries(scenario.units.map((unit) => [
    unit.id,
    unit.demographicTurnoutAddedVotes ?? 0,
  ]));
  assert.deepEqual(allocation(forward), allocation(reversed));
  assert.deepEqual(forward.totals, reversed.totals);
});

test("statewide and group turnout share capacity without exceeding any local unit", async () => {
  const { PA } = await loadUnits();
  const scenario = applyBehaviorScenario(PA, {
    ...baseSettings,
    turnoutIncreasePoints: 1.5,
    demographicTurnoutIncreasePoints: Object.fromEntries(
      DEMOGRAPHIC_GROUP_IDS.map((groupId) => [groupId, 10]),
    ),
  });
  const baseline = new Map(PA.map((unit) => [unit.id, unit]));
  for (const unit of scenario.units) {
    const source = baseline.get(unit.id);
    assert.ok(unit.turnoutAddedVotes <= source.turnoutCapacity);
    assert.equal(unit.totalVotes - source.totalVotes, unit.turnoutAddedVotes);
  }
  assert.equal(
    scenario.turnout.addedVotes,
    scenario.turnout.harrisVotes
      + scenario.turnout.trumpVotes
      + scenario.turnout.steinVotes
      + scenario.turnout.oliverVotes
      + scenario.turnout.residualOtherVotes,
  );
  assert.ok(scenario.turnout.addedVotes <= scenario.turnout.capacity);
});

test("Michigan unavailable bridges and off-map units receive no invented demographic turnout", async () => {
  const { MI } = await loadUnits();
  const scenario = applyBehaviorScenario(MI, {
    ...baseSettings,
    demographicTurnoutIncreasePoints: { non_hispanic_black: 4 },
  });
  const baseline = new Map(MI.map((unit) => [unit.id, unit]));
  for (const unit of scenario.units) {
    const source = baseline.get(unit.id);
    if (source.demographicComposition == null) {
      assert.equal(unit.demographicTurnoutAddedVotes ?? 0, 0);
    }
  }
});

test("Wisconsin fails closed instead of inventing group composition", async () => {
  const { WI } = await loadUnits();
  assert.throws(() => applyBehaviorScenario(WI, {
    ...baseSettings,
    demographicTurnoutIncreasePoints: { hispanic_any_race: 1 },
  }), /unavailable for this demographic foundation/);
  assert.throws(() => applyBehaviorScenario(WI, {
    ...baseSettings,
    demographicCandidateShares: {
      non_hispanic_black: {
        harris: 0.1,
        trump: 0.2,
        stein: 0.3,
        oliver: 0.15,
        residualOther: 0.25,
      },
    },
  }), /unavailable for this demographic foundation/);
  const baseline = applyBehaviorScenario(WI, baseSettings);
  assert.equal(baseline.demographicTurnout.status, "not_requested");
  assert.equal(baseline.demographicTurnout.addedVotes, 0);
});

test("unknown groups, invalid points, and non-reconciling composition fail closed", () => {
  const unit = {
    id: "unit-1",
    countyFips: "00001",
    geometryId: "unit-1",
    harrisVotes: 20,
    trumpVotes: 20,
    steinVotes: 0,
    oliverVotes: 0,
    residualOtherVotes: 0,
    otherVotes: 0,
    totalVotes: 40,
    turnoutDenominator: 100,
    turnoutCapacity: 60,
    demographicComposition: {
      hispanic_any_race: 10,
      non_hispanic_white: 40,
      non_hispanic_black: 20,
      non_hispanic_asian: 10,
      non_hispanic_other: 10,
    },
  };
  assert.throws(() => applyBehaviorScenario([unit], {
    ...baseSettings,
    demographicTurnoutIncreasePoints: { invented_group: 1 },
  }), /Unsupported demographic turnout group/);
  assert.throws(() => applyBehaviorScenario([unit], {
    ...baseSettings,
    demographicTurnoutIncreasePoints: { non_hispanic_white: -1 },
  }), /between zero and 100/);
  assert.throws(() => applyBehaviorScenario([unit], {
    ...baseSettings,
    demographicTurnoutIncreasePoints: { non_hispanic_white: 1 },
  }), /does not reconcile/);
});

test("custom demographic preference is candidate-complete and applies only to added group ballots", async () => {
  const { PA } = await loadUnits();
  const baselineTotals = Object.fromEntries([
    "harrisVotes",
    "trumpVotes",
    "steinVotes",
    "oliverVotes",
    "residualOtherVotes",
  ].map((key) => [key, candidateTotal(PA, key)]));
  const shares = {
    harris: 0.1,
    trump: 0.2,
    stein: 0.3,
    oliver: 0.15,
    residualOther: 0.25,
  };
  const scenario = applyBehaviorScenario(PA, {
    ...baseSettings,
    demographicTurnoutIncreasePoints: { non_hispanic_black: 2.5 },
    demographicCandidateShares: { non_hispanic_black: shares },
  });
  const group = scenario.demographicTurnout.groups.find(
    (entry) => entry.groupId === "non_hispanic_black",
  );
  assert.ok(group);
  assert.equal(group.candidateShareMode, "custom-five-candidate");
  assert.deepEqual(group.candidateShares, shares);
  assert.equal(group.candidateVotes.totalVotes, group.addedVotes);
  assert.equal(
    group.candidateVotes.harrisVotes
      + group.candidateVotes.trumpVotes
      + group.candidateVotes.steinVotes
      + group.candidateVotes.oliverVotes
      + group.candidateVotes.residualOtherVotes,
    group.addedVotes,
  );
  for (const key of [
    "harrisVotes",
    "trumpVotes",
    "steinVotes",
    "oliverVotes",
    "residualOtherVotes",
  ]) {
    assert.equal(scenario.totals[key] - baselineTotals[key], group.candidateVotes[key]);
    assert.equal(scenario.turnout[key], group.candidateVotes[key]);
  }
  assert.equal(group.harrisTrumpMarginVotes, group.candidateVotes.harrisVotes - group.candidateVotes.trumpVotes);
  assert.equal(group.marginVotesPerThousandAdded, -100);
  assert.equal(
    scenario.units.reduce((sum, unit) => (
      sum + (unit.demographicTurnoutByGroup?.non_hispanic_black?.totalVotes ?? 0)
    ), 0),
    group.addedVotes,
  );

  const noAddedBallots = applyBehaviorScenario(PA, {
    ...baseSettings,
    demographicCandidateShares: { non_hispanic_black: shares },
  });
  assert.deepEqual(noAddedBallots.totals, {
    harrisVotes: baselineTotals.harrisVotes,
    trumpVotes: baselineTotals.trumpVotes,
    steinVotes: baselineTotals.steinVotes,
    oliverVotes: baselineTotals.oliverVotes,
    residualOtherVotes: baselineTotals.residualOtherVotes,
    otherVotes: baselineTotals.steinVotes + baselineTotals.oliverVotes + baselineTotals.residualOtherVotes,
    totalVotes: candidateTotal(PA, "totalVotes"),
  });
});

test("demographic preference rejects incomplete, non-unit, and unknown vectors", async () => {
  const { PA } = await loadUnits();
  assert.throws(() => applyBehaviorScenario(PA, {
    ...baseSettings,
    demographicTurnoutIncreasePoints: { non_hispanic_black: 1 },
    demographicCandidateShares: {
      non_hispanic_black: { harris: 0.5, trump: 0.5, stein: 0, oliver: 0 },
    },
  }), /candidate-share contract is malformed/);
  assert.throws(() => applyBehaviorScenario(PA, {
    ...baseSettings,
    demographicTurnoutIncreasePoints: { non_hispanic_black: 1 },
    demographicCandidateShares: {
      non_hispanic_black: {
        harris: 0.6,
        trump: 0.6,
        stein: 0,
        oliver: 0,
        residualOther: 0,
      },
    },
  }), /sum to/);
  assert.throws(() => applyBehaviorScenario(PA, {
    ...baseSettings,
    demographicCandidateShares: {
      invented_group: {
        harris: 1,
        trump: 0,
        stein: 0,
        oliver: 0,
        residualOther: 0,
      },
    },
  }), /Unsupported demographic preference group/);
});
