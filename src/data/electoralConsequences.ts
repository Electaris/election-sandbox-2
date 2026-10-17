import {
  aggregateNational,
  presidentialPlurality,
  presidentialPluralityMargin,
  stateElectoralVotes,
  type PresidentialPluralityCandidate,
  type NationalPresidentialResult,
  type StatewidePresidentialResult,
} from "../../packages/election-model/src/scenario.ts";

// Retain the historical exported name for URL and route compatibility. The
// target can now be any named candidate represented by the scenario model.
export type MajorCandidate = Exclude<PresidentialPluralityCandidate, "tie">;
export type CandidateElectoralVotes = Record<MajorCandidate, number>;
export type ElectoralThresholdStatus = "tie" | "exact-majority" | "above-majority" | "below-majority";

export interface ElectoralConsequenceRow {
  stateCode: string;
  stateName: string;
  actualMargin: number;
  scenarioMargin: number;
  actualWinner: PresidentialPluralityCandidate;
  scenarioWinner: PresidentialPluralityCandidate;
  electoralVotes: number;
  targetElectoralDelta: number;
  winnerChanged: boolean;
}

export interface ElectoralConsequenceModel {
  targetCandidate: MajorCandidate;
  actualNational: NationalPresidentialResult;
  scenarioNational: NationalPresidentialResult;
  totalElectoralVotes: number;
  majorityThreshold: number;
  targetActualElectoralVotes: number;
  targetScenarioElectoralVotes: number;
  targetElectoralDelta: number;
  electoralVotesToMajority: number;
  electoralVotesAboveMajority: number;
  thresholdStatus: ElectoralThresholdStatus;
  actualCandidateElectoralVotes: CandidateElectoralVotes;
  scenarioCandidateElectoralVotes: CandidateElectoralVotes;
  activeRows: ElectoralConsequenceRow[];
  consequentialRows: ElectoralConsequenceRow[];
}

type NamedStateResult = StatewidePresidentialResult & { name?: string };

export const candidateNames: Record<PresidentialPluralityCandidate, string> = {
  harris: "Harris",
  trump: "Trump",
  stein: "Stein",
  oliver: "Oliver",
  residual_other: "Aggregate other",
  tie: "Tie",
};

function resultMargin(result: StatewidePresidentialResult) {
  return presidentialPluralityMargin(result);
}

function winner(result: StatewidePresidentialResult): PresidentialPluralityCandidate {
  return presidentialPlurality(result);
}

function stateCandidateElectoralVotes(result: StatewidePresidentialResult, candidate: MajorCandidate) {
  if (candidate === "harris") return result.harrisElectoralVotes;
  if (candidate === "trump") return result.trumpElectoralVotes;
  return winner(result) === candidate ? (result.otherElectoralVotes ?? 0) : 0;
}

export function electoralVotesByCandidate(
  states: readonly StatewidePresidentialResult[],
): CandidateElectoralVotes {
  const totals: CandidateElectoralVotes = {
    harris: 0,
    trump: 0,
    stein: 0,
    oliver: 0,
    residual_other: 0,
  };
  for (const state of states) {
    totals.harris += state.harrisElectoralVotes;
    totals.trump += state.trumpElectoralVotes;
    const stateWinner = winner(state);
    if (stateWinner !== "tie" && stateWinner !== "harris" && stateWinner !== "trump") {
      totals[stateWinner] += state.otherElectoralVotes ?? 0;
    }
  }
  return totals;
}

export function buildElectoralConsequenceModel(
  actualStates: readonly NamedStateResult[],
  scenarioStates: readonly NamedStateResult[],
  activeStateCodes: readonly string[],
  targetCandidate: MajorCandidate,
): ElectoralConsequenceModel {
  const actualNational = aggregateNational(actualStates);
  const scenarioNational = aggregateNational(scenarioStates);
  const totalElectoralVotes = actualNational.harrisElectoralVotes
    + actualNational.trumpElectoralVotes
    + actualNational.otherElectoralVotes;
  const scenarioElectoralVotes = scenarioNational.harrisElectoralVotes
    + scenarioNational.trumpElectoralVotes
    + scenarioNational.otherElectoralVotes;
  if (scenarioElectoralVotes !== totalElectoralVotes) {
    throw new Error("Scenario Electoral College allocation does not reconcile to the certified baseline");
  }
  const majorityThreshold = Math.floor(totalElectoralVotes / 2) + 1;
  const actualCandidateElectoralVotes = electoralVotesByCandidate(actualStates);
  const scenarioCandidateElectoralVotes = electoralVotesByCandidate(scenarioStates);
  const targetActualElectoralVotes = actualCandidateElectoralVotes[targetCandidate];
  const targetScenarioElectoralVotes = scenarioCandidateElectoralVotes[targetCandidate];
  const activeCodes = new Set(activeStateCodes);
  const scenarioByCode = new Map(scenarioStates.map((state) => [state.code, state]));
  const activeRows = actualStates
    .filter((actual) => activeCodes.has(actual.code))
    .map((actual): ElectoralConsequenceRow => {
      const scenario = scenarioByCode.get(actual.code) ?? actual;
      const actualWinner = winner(actual);
      const scenarioWinner = winner(scenario);
      return {
        stateCode: actual.code,
        stateName: actual.name ?? actual.code,
        actualMargin: resultMargin(actual),
        scenarioMargin: resultMargin(scenario),
        actualWinner,
        scenarioWinner,
        electoralVotes: stateElectoralVotes(actual),
        targetElectoralDelta: stateCandidateElectoralVotes(scenario, targetCandidate)
          - stateCandidateElectoralVotes(actual, targetCandidate),
        winnerChanged: actualWinner !== scenarioWinner,
      };
    })
    .sort((left, right) => (
      Math.abs(right.targetElectoralDelta) - Math.abs(left.targetElectoralDelta)
      || left.stateName.localeCompare(right.stateName)
    ));
  const rankedElectoralTotals = Object.values(scenarioCandidateElectoralVotes)
    .sort((left, right) => right - left);
  const electoralTie = rankedElectoralTotals[0] === rankedElectoralTotals[1]
    && rankedElectoralTotals[0] < majorityThreshold;
  const thresholdStatus: ElectoralThresholdStatus = electoralTie
    ? "tie"
    : targetScenarioElectoralVotes === majorityThreshold
      ? "exact-majority"
      : targetScenarioElectoralVotes > majorityThreshold
        ? "above-majority"
        : "below-majority";

  return {
    targetCandidate,
    actualNational,
    scenarioNational,
    totalElectoralVotes,
    majorityThreshold,
    targetActualElectoralVotes,
    targetScenarioElectoralVotes,
    targetElectoralDelta: targetScenarioElectoralVotes - targetActualElectoralVotes,
    electoralVotesToMajority: Math.max(0, majorityThreshold - targetScenarioElectoralVotes),
    electoralVotesAboveMajority: Math.max(0, targetScenarioElectoralVotes - majorityThreshold),
    thresholdStatus,
    actualCandidateElectoralVotes,
    scenarioCandidateElectoralVotes,
    activeRows,
    consequentialRows: activeRows.filter((row) => row.winnerChanged),
  };
}

function joinStateNames(rows: readonly ElectoralConsequenceRow[]) {
  const names = rows.map((row) => row.stateName);
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names.at(-1)}`;
}

export function electoralCausalSummary(model: ElectoralConsequenceModel) {
  const targetName = candidateNames[model.targetCandidate];
  if (model.activeRows.length === 0) {
    return "The scenario matches the certified Electoral College baseline.";
  }
  if (model.consequentialRows.length === 0) {
    return `${model.activeRows.length === 1 ? model.activeRows[0].stateName : `${model.activeRows.length} active states`} changed in the model, but no state changed its Electoral College allocation.`;
  }
  if (model.targetElectoralDelta === 0) {
    if (model.consequentialRows.every((row) => row.targetElectoralDelta === 0)) {
      const transfers = model.consequentialRows.map((row) => (
        `${row.stateName}'s ${row.electoralVotes} EV move from ${candidateNames[row.actualWinner]} to ${candidateNames[row.scenarioWinner]}`
      ));
      return `${transfers.join("; ")}. ${targetName}'s Electoral College total is unchanged.`;
    }
    return `${candidateNames[model.targetCandidate]}'s electoral gains and losses cancel across ${joinStateNames(model.consequentialRows)}, leaving the certified Electoral College total unchanged.`;
  }
  const direction = model.targetElectoralDelta > 0 ? "gains" : "loses";
  const votes = Math.abs(model.targetElectoralDelta);
  const states = joinStateNames(model.consequentialRows);
  return `${targetName} ${direction} ${votes} electoral ${votes === 1 ? "vote" : "votes"} relative to the certified baseline because ${states} changed ${model.consequentialRows.length === 1 ? "its" : "their"} winner.`;
}

export function electoralThresholdHeadline(model: ElectoralConsequenceModel) {
  const targetName = candidateNames[model.targetCandidate].toUpperCase();
  switch (model.thresholdStatus) {
    case "tie": return `ELECTORAL COLLEGE TIE · ${Object.values(model.scenarioCandidateElectoralVotes).sort((left, right) => right - left).slice(0, 2).join("-")}`;
    case "exact-majority": return `${targetName} REACHES ${model.majorityThreshold} · MINIMUM WINNING THRESHOLD`;
    case "above-majority": return `${targetName} HOLDS AN ELECTORAL COLLEGE MAJORITY`;
    case "below-majority": return `${model.electoralVotesToMajority} EV NEEDED FOR ${targetName}`;
  }
}

export function electoralThresholdDetail(model: ElectoralConsequenceModel) {
  if (model.thresholdStatus === "tie") return "No candidate has secured an Electoral College majority.";
  if (model.thresholdStatus === "exact-majority") return "The target candidate is exactly at the minimum winning threshold.";
  if (model.thresholdStatus === "above-majority") {
    return `${model.electoralVotesAboveMajority} EV above the ${model.majorityThreshold}-vote majority threshold.`;
  }
  return `${model.electoralVotesToMajority} additional EV required to reach the ${model.majorityThreshold}-vote majority threshold.`;
}
