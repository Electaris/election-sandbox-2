import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { applyBehaviorScenario } from "../packages/election-model/src/scenario.ts";
import { states2024 } from "../src/data/states.ts";
import { listDetailedStateManifests } from "../src/data/detailedStateManifest.ts";
import { getDetailedStateRuntimeAdapter } from "../src/data/detailedStateRuntimeLoaders.ts";

const keys = ["harrisVotes", "trumpVotes", "steinVotes", "oliverVotes", "residualOtherVotes"];
const sum = (units, key) => units.reduce((total, unit) => total + unit[key], 0);
const base = { turnoutIncreasePoints: 0, addedVoterHarrisShare: 0.63, preferenceShiftPoints: 0,
  thirdPartyCandidate: "stein", thirdPartyShiftPoints: 0, thirdPartyHarrisExchangeShare: 0.5 };
const national = { ballots: sum(states2024, "totalVotes"), harrisEV: sum(states2024, "harrisElectoralVotes"), trumpEV: sum(states2024, "trumpElectoralVotes") };
assert.deepEqual(national, { ballots: 155238302, harrisEV: 226, trumpEV: 312 });
const rows = [];
for (const manifest of listDetailedStateManifests()) {
  const adapter = getDetailedStateRuntimeAdapter(manifest.runtime.loader);
  const foundation = adapter.decode(JSON.parse(await readFile(new URL(`../public/${manifest.runtime.artifactPath}`, import.meta.url), "utf8")));
  const units = adapter.toBehaviorModelUnits(foundation);
  const before = structuredClone(units);
  const actual = states2024.find((state) => state.code === manifest.code);
  for (const key of ["harrisVotes", "trumpVotes", "otherVotes", "totalVotes"]) assert.equal(sum(units, key), actual[key]);
  const cases = [
    ["baseline", {}], ["turnout", { turnoutIncreasePoints: 0.8 }],
    ["preference", { preferenceShiftPoints: 2.5 }], ["reverse-preference", { preferenceShiftPoints: -4.7 }],
    ["saturated-Harris", { preferenceShiftPoints: 200 }], ["saturated-Trump", { preferenceShiftPoints: -200 }],
    ["withdraw-Stein", { thirdPartyShiftPoints: -100 }],
    ["combined", { turnoutIncreasePoints: 1.2, preferenceShiftPoints: -4.7, thirdPartyCandidate: "oliver", thirdPartyShiftPoints: 0.8 }],
  ];
  const results = {};
  for (const [label, delta] of cases) {
    const result = applyBehaviorScenario(units, { ...base, ...delta });
    for (const unit of result.units) {
      for (const key of keys) assert.ok(Number.isSafeInteger(unit[key]) && unit[key] >= 0);
      assert.equal(keys.reduce((total, key) => total + unit[key], 0), unit.totalVotes);
    }
    for (const key of [...keys, "totalVotes"]) assert.equal(sum(result.units, key), result.totals[key]);
    const expectedAdded = Math.min(Math.round(sum(units, "turnoutDenominator") * (delta.turnoutIncreasePoints ?? 0) / 100), sum(units, "turnoutCapacity"));
    assert.equal(result.totals.totalVotes, actual.totalVotes + expectedAdded);
    if (label === "baseline") for (const key of keys) assert.equal(result.totals[key], sum(units, key));
    if (label.includes("preference")) {
      const transfer = Math.round(actual.totalVotes * delta.preferenceShiftPoints / 200);
      assert.equal(result.totals.harrisVotes, actual.harrisVotes + transfer);
      assert.equal(result.totals.trumpVotes, actual.trumpVotes - transfer);
      for (const key of keys.slice(2)) assert.equal(result.totals[key], sum(units, key));
    }
    if (label === "saturated-Harris") assert.equal(result.totals.trumpVotes, 0);
    if (label === "saturated-Trump") assert.equal(result.totals.harrisVotes, 0);
    if (label === "withdraw-Stein") assert.equal(result.totals.steinVotes, 0);
    if (label === "turnout") assert.equal(result.totals.harrisVotes - actual.harrisVotes, Math.round(expectedAdded * base.addedVoterHarrisShare));
    assert.deepEqual(applyBehaviorScenario(units, { ...base, ...delta }).totals, result.totals);
    results[label] = { ballots: result.totals.totalVotes, harrisMinusTrump: result.totals.harrisVotes - result.totals.trumpVotes };
  }
  assert.deepEqual(units, before, "Scenario arithmetic must not mutate certified inputs");
  rows.push({ state: manifest.code, modelUnits: units.length, baselineBallots: actual.totalVotes, results });
}
const report = { kind: "independent-aggregate-audit-v1", national, casesPerState: 8, states: rows };
if (process.argv[2]) await writeFile(process.argv[2], JSON.stringify(report, null, 2) + "\n");
console.log(`Calculation audit passed: ${rows.length} states × 8 cases; exact national baseline, aggregate formulas, saturation, candidate conservation, determinism and input immutability.`);
