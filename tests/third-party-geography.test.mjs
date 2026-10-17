import assert from "node:assert/strict";
import test from "node:test";

import {
  applyBehaviorScenario,
  THIRD_PARTY_GEOGRAPHIC_ALLOCATION_PROFILE,
} from "../packages/election-model/src/scenario.ts";
import {
  ATLAS_GREEN,
  ATLAS_LIBERTARIAN,
  ATLAS_NEUTRAL,
  ATLAS_OTHER,
  atlasPlurality,
  atlasPluralityMargin,
  atlasResultColor,
} from "../src/map/atlasPalette.ts";

const baseline = [
  {
    id: "high-support",
    countyFips: "001",
    geometryId: "mapped-high-support",
    harrisVotes: 40,
    trumpVotes: 40,
    steinVotes: 20,
    oliverVotes: 0,
    residualOtherVotes: 0,
    otherVotes: 20,
    totalVotes: 100,
    turnoutDenominator: null,
    turnoutCapacity: 0,
  },
  {
    id: "low-support-off-map",
    countyFips: "003",
    geometryId: null,
    harrisVotes: 49,
    trumpVotes: 49,
    steinVotes: 2,
    oliverVotes: 0,
    residualOtherVotes: 0,
    otherVotes: 2,
    totalVotes: 100,
    turnoutDenominator: null,
    turnoutCapacity: 0,
  },
];

const settings = {
  turnoutIncreasePoints: 0,
  addedVoterHarrisShare: 0.5,
  preferenceShiftPoints: 0,
  thirdPartyCandidate: "stein",
  thirdPartyShiftPoints: 30,
  thirdPartyHarrisExchangeShare: 0.5,
};

function canonicalUnits(units) {
  return [...units]
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((unit) => ({
      id: unit.id,
      countyFips: unit.countyFips,
      geometryId: unit.geometryId,
      harrisVotes: unit.harrisVotes,
      trumpVotes: unit.trumpVotes,
      steinVotes: unit.steinVotes,
      oliverVotes: unit.oliverVotes,
      residualOtherVotes: unit.residualOtherVotes,
      otherVotes: unit.otherVotes,
      totalVotes: unit.totalVotes,
      thirdPartyCandidateDelta: unit.thirdPartyCandidateDelta,
    }));
}

test("v0.27B freezes a named deterministic geographic allocation profile", () => {
  assert.equal(
    THIRD_PARTY_GEOGRAPHIC_ALLOCATION_PROFILE,
    "certified-local-support-affinity-v1",
  );
});

test("named third-party gains follow certified local support and can earn a local plurality", () => {
  const scenario = applyBehaviorScenario(baseline, settings);
  const highSupport = scenario.units.find((unit) => unit.id === "high-support");
  const lowSupport = scenario.units.find((unit) => unit.id === "low-support-off-map");

  assert.equal(scenario.thirdParty.realizedCandidateDelta, 60);
  assert.ok(highSupport.thirdPartyCandidateDelta > lowSupport.thirdPartyCandidateDelta);
  assert.equal(highSupport.steinVotes, 76);
  assert.equal(atlasPlurality(highSupport), "GRN");
  assert.equal(atlasPluralityMargin(highSupport), 64);
  assert.notEqual(atlasResultColor(highSupport), ATLAS_GREEN);
  assert.equal(atlasPlurality(lowSupport), "TIE");
});

test("geographic third-party allocation is independent of input collection order", () => {
  const forward = applyBehaviorScenario(baseline, settings);
  const reverse = applyBehaviorScenario([...baseline].reverse(), settings);

  assert.deepEqual(canonicalUnits(reverse.units), canonicalUnits(forward.units));
  assert.deepEqual(reverse.totals, forward.totals);
  assert.deepEqual(reverse.thirdParty, forward.thirdParty);
});

test("named third-party removal is also independent of input collection order", () => {
  const removalSettings = {
    ...settings,
    thirdPartyShiftPoints: -8,
    thirdPartyHarrisExchangeShare: 0.7,
  };
  const forward = applyBehaviorScenario(baseline, removalSettings);
  const reverse = applyBehaviorScenario([...baseline].reverse(), removalSettings);
  assert.deepEqual(canonicalUnits(reverse.units), canonicalUnits(forward.units));
  assert.deepEqual(reverse.totals, forward.totals);
});

test("every local unit, county, and statewide result conserves the five vote buckets", () => {
  const scenario = applyBehaviorScenario(baseline, settings);
  for (const unit of scenario.units) {
    assert.equal(unit.steinVotes + unit.oliverVotes + unit.residualOtherVotes, unit.otherVotes);
    assert.equal(unit.harrisVotes + unit.trumpVotes + unit.otherVotes, unit.totalVotes);
  }

  const counties = [...new Set(scenario.units.map((unit) => unit.countyFips))].map(
    (countyFips) => scenario.units
      .filter((unit) => unit.countyFips === countyFips)
      .reduce((county, unit) => ({
        harrisVotes: county.harrisVotes + unit.harrisVotes,
        trumpVotes: county.trumpVotes + unit.trumpVotes,
        steinVotes: county.steinVotes + unit.steinVotes,
        oliverVotes: county.oliverVotes + unit.oliverVotes,
        residualOtherVotes: county.residualOtherVotes + unit.residualOtherVotes,
        otherVotes: county.otherVotes + unit.otherVotes,
        totalVotes: county.totalVotes + unit.totalVotes,
      }), {
        harrisVotes: 0,
        trumpVotes: 0,
        steinVotes: 0,
        oliverVotes: 0,
        residualOtherVotes: 0,
        otherVotes: 0,
        totalVotes: 0,
      }),
  );
  for (const county of counties) {
    assert.equal(county.steinVotes + county.oliverVotes + county.residualOtherVotes, county.otherVotes);
    assert.equal(county.harrisVotes + county.trumpVotes + county.otherVotes, county.totalVotes);
  }

  assert.deepEqual(scenario.totals, {
    harrisVotes: 59,
    trumpVotes: 59,
    steinVotes: 82,
    oliverVotes: 0,
    residualOtherVotes: 0,
    otherVotes: 82,
    totalVotes: 200,
  });
});

test("off-map source units remain off-map and receive no invented geometry", () => {
  const scenario = applyBehaviorScenario(baseline, settings);
  const offMap = scenario.units.find((unit) => unit.id === "low-support-off-map");
  assert.equal(offMap.geometryId, null);
  assert.equal(offMap.countyFips, "003");
  assert.equal(offMap.totalVotes, 100);
  assert.equal(offMap.thirdPartyCandidateDelta, 4);
});

test("duplicate source identities fail before a geographic allocation is published", () => {
  const duplicated = [baseline[0], { ...baseline[1], id: baseline[0].id }];
  assert.throws(
    () => applyBehaviorScenario(duplicated, settings),
    /unique unit identifiers/,
  );
});

test("unknown geographic allocation profiles fail closed", () => {
  assert.throws(
    () => applyBehaviorScenario(baseline, {
      ...settings,
      thirdPartyGeographicAllocationProfile: "invented-profile",
    }),
    /allocation profile is invalid/,
  );
});

test("plurality colors require the named candidate to be the actual top vote getter", () => {
  const base = {
    harrisVotes: 40,
    trumpVotes: 35,
    steinVotes: 15,
    oliverVotes: 5,
    residualOtherVotes: 5,
    totalVotes: 100,
  };
  assert.equal(atlasPlurality(base), "DEM");
  assert.notEqual(atlasResultColor(base), ATLAS_GREEN);

  const oliverWin = { ...base, harrisVotes: 20, trumpVotes: 19, steinVotes: 10, oliverVotes: 46 };
  assert.equal(atlasPlurality(oliverWin), "LIB");
  assert.notEqual(atlasResultColor(oliverWin), ATLAS_LIBERTARIAN);

  const aggregateOtherWin = { ...base, harrisVotes: 20, trumpVotes: 19, steinVotes: 10, residualOtherVotes: 46 };
  assert.equal(atlasPlurality(aggregateOtherWin), "OTHER");
  assert.notEqual(atlasResultColor(aggregateOtherWin), ATLAS_OTHER);

  const tie = { ...base, harrisVotes: 35, trumpVotes: 35 };
  assert.equal(atlasPlurality(tie), "TIE");
  assert.equal(atlasResultColor(tie), ATLAS_NEUTRAL);
});

test("third-party plurality colors use winner-over-runner-up margin buckets", () => {
  const narrow = {
    harrisVotes: 34,
    trumpVotes: 31,
    steinVotes: 35,
    oliverVotes: 0,
    residualOtherVotes: 0,
    totalVotes: 100,
  };
  const wide = { ...narrow, harrisVotes: 20, steinVotes: 49 };
  assert.equal(atlasPluralityMargin(narrow), 1);
  assert.equal(atlasPluralityMargin(wide), 18);
  assert.notEqual(atlasResultColor(narrow), atlasResultColor(wide));
});

test("an undifferentiated other total never impersonates a named candidate", () => {
  const aggregateOnly = {
    harrisVotes: 30,
    trumpVotes: 20,
    otherVotes: 50,
    totalVotes: 100,
  };
  assert.equal(atlasPlurality(aggregateOnly), "DEM");
  assert.notEqual(atlasResultColor(aggregateOnly), ATLAS_GREEN);
  assert.notEqual(atlasResultColor(aggregateOnly), ATLAS_LIBERTARIAN);
  assert.notEqual(atlasResultColor(aggregateOnly), ATLAS_OTHER);
});
