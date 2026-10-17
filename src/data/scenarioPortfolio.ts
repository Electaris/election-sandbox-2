import type {
  BehaviorScenarioResult,
  BehaviorScenarioSettings,
  DemographicCandidateShareVector,
  StatewidePresidentialResult,
  ThirdPartyCandidate,
} from "../../packages/election-model/src/scenario.ts";
import {
  DEMOGRAPHIC_GROUP_IDS,
  type DemographicGroupId,
} from "../../packages/data-contracts/src/demographicEvidence.ts";
import {
  electoralAllocationForResult,
  presidentialPlurality,
  presidentialPluralityMargin,
} from "../../packages/election-model/src/scenario.ts";
import {
  getDetailedStateManifest,
  type DetailedStateCode,
} from "./detailedStateManifest.ts";

export interface StateBehaviorRecipeSettings {
  turnoutIncreasePoints: number;
  addedVoterHarrisShare: number;
  demographicTurnoutIncreasePoints: Record<DemographicGroupId, number>;
  demographicCandidateShares: Record<
    DemographicGroupId,
    DemographicCandidateSharePercentVector | null
  >;
  preferenceShiftPoints: number;
  thirdPartyCandidate: ThirdPartyCandidate;
  thirdPartyShiftPoints: number;
  thirdPartyHarrisExchangeShare: number;
}

export interface DemographicCandidateSharePercentVector {
  harris: number;
  trump: number;
  stein: number;
  oliver: number;
  residualOther: number;
}

export interface StateScenarioRecipe {
  stateCode: DetailedStateCode;
  electionId: string;
  dataVersion: string;
  engineVersion: string;
  settings: StateBehaviorRecipeSettings;
}

export interface StateScenarioSummary {
  stateCode: DetailedStateCode;
  electionId: string;
  dataVersion: string;
  engineVersion: string;
  recipeFingerprint: string;
  actualMargin: number;
  scenarioMargin: number;
  actualWinner: "HARRIS" | "TRUMP" | "STEIN" | "OLIVER" | "RESIDUAL_OTHER" | "TIE";
  scenarioWinner: "HARRIS" | "TRUMP" | "STEIN" | "OLIVER" | "RESIDUAL_OTHER" | "TIE";
  actualPluralityMargin: number;
  scenarioPluralityMargin: number;
  harrisVotes: number;
  trumpVotes: number;
  steinVotes: number;
  oliverVotes: number;
  residualOtherVotes: number;
  otherVotes: number;
  totalVotes: number;
  electoralVotes: number;
  harrisElectoralVotes: number;
  trumpElectoralVotes: number;
  otherElectoralVotes: number;
  flipped: boolean;
}

export const DEFAULT_DEMOGRAPHIC_TURNOUT_INCREASE_POINTS: Readonly<
  Record<DemographicGroupId, number>
> = Object.freeze({
  hispanic_any_race: 0,
  non_hispanic_white: 0,
  non_hispanic_black: 0,
  non_hispanic_asian: 0,
  non_hispanic_other: 0,
});

export const DEFAULT_DEMOGRAPHIC_CANDIDATE_SHARES: Readonly<
  Record<DemographicGroupId, null>
> = Object.freeze({
  hispanic_any_race: null,
  non_hispanic_white: null,
  non_hispanic_black: null,
  non_hispanic_asian: null,
  non_hispanic_other: null,
});

export const DEFAULT_STATE_BEHAVIOR_SETTINGS: Readonly<StateBehaviorRecipeSettings> = Object.freeze({
  turnoutIncreasePoints: 0,
  addedVoterHarrisShare: 55,
  demographicTurnoutIncreasePoints: DEFAULT_DEMOGRAPHIC_TURNOUT_INCREASE_POINTS,
  demographicCandidateShares: DEFAULT_DEMOGRAPHIC_CANDIDATE_SHARES,
  preferenceShiftPoints: 0,
  thirdPartyCandidate: "stein",
  thirdPartyShiftPoints: 0,
  thirdPartyHarrisExchangeShare: 50,
});

function normalizedDemographicTurnoutSettings(
  settings: Pick<StateBehaviorRecipeSettings, "demographicTurnoutIncreasePoints">
    | { demographicTurnoutIncreasePoints?: Partial<Record<DemographicGroupId, number>> },
) {
  const supplied = settings.demographicTurnoutIncreasePoints ?? {};
  return Object.fromEntries(DEMOGRAPHIC_GROUP_IDS.map((groupId) => [
    groupId,
    supplied[groupId] ?? 0,
  ])) as Record<DemographicGroupId, number>;
}

function normalizedDemographicCandidateShares(
  settings: Pick<StateBehaviorRecipeSettings, "demographicCandidateShares">
    | { demographicCandidateShares?: Partial<Record<DemographicGroupId, DemographicCandidateSharePercentVector | null>> },
) {
  const supplied = settings.demographicCandidateShares ?? {};
  return Object.fromEntries(DEMOGRAPHIC_GROUP_IDS.map((groupId) => {
    const value = supplied[groupId];
    return [groupId, value == null ? null : { ...value }];
  })) as Record<DemographicGroupId, DemographicCandidateSharePercentVector | null>;
}

function canonicalNumber(value: number) {
  const normalized = Object.is(value, -0) ? 0 : value;
  return String(Number(normalized.toFixed(4)));
}

export function isDefaultStateBehaviorSettings(settings: StateBehaviorRecipeSettings) {
  const demographicSettings = normalizedDemographicTurnoutSettings(settings);
  const candidateShares = normalizedDemographicCandidateShares(settings);
  return settings.turnoutIncreasePoints === DEFAULT_STATE_BEHAVIOR_SETTINGS.turnoutIncreasePoints
    && settings.addedVoterHarrisShare === DEFAULT_STATE_BEHAVIOR_SETTINGS.addedVoterHarrisShare
    && DEMOGRAPHIC_GROUP_IDS.every((groupId) => (
      demographicSettings[groupId]
        === DEFAULT_DEMOGRAPHIC_TURNOUT_INCREASE_POINTS[groupId]
    ))
    && DEMOGRAPHIC_GROUP_IDS.every((groupId) => candidateShares[groupId] == null)
    && settings.preferenceShiftPoints === DEFAULT_STATE_BEHAVIOR_SETTINGS.preferenceShiftPoints
    && settings.thirdPartyCandidate === DEFAULT_STATE_BEHAVIOR_SETTINGS.thirdPartyCandidate
    && settings.thirdPartyShiftPoints === DEFAULT_STATE_BEHAVIOR_SETTINGS.thirdPartyShiftPoints
    && settings.thirdPartyHarrisExchangeShare === DEFAULT_STATE_BEHAVIOR_SETTINGS.thirdPartyHarrisExchangeShare;
}

export function createStateScenarioRecipe(
  stateCode: DetailedStateCode,
  settings: StateBehaviorRecipeSettings,
): StateScenarioRecipe {
  const manifest = getDetailedStateManifest(stateCode);
  const demographicSettings = normalizedDemographicTurnoutSettings(settings);
  const candidateShares = normalizedDemographicCandidateShares(settings);
  return {
    stateCode,
    electionId: manifest.election.contestId,
    dataVersion: manifest.compatibility.dataVersion,
    engineVersion: manifest.compatibility.engineVersion,
    settings: {
      ...settings,
      demographicTurnoutIncreasePoints: demographicSettings,
      demographicCandidateShares: candidateShares,
    },
  };
}

export function stateScenarioRecipeFingerprint(recipe: StateScenarioRecipe) {
  const settings = recipe.settings;
  const demographicSettings = normalizedDemographicTurnoutSettings(settings);
  const candidateShares = normalizedDemographicCandidateShares(settings);
  const base = [
    recipe.stateCode,
    recipe.electionId,
    recipe.dataVersion,
    recipe.engineVersion,
    canonicalNumber(settings.turnoutIncreasePoints),
    canonicalNumber(settings.addedVoterHarrisShare),
    canonicalNumber(settings.preferenceShiftPoints),
    settings.thirdPartyCandidate,
    canonicalNumber(settings.thirdPartyShiftPoints),
    canonicalNumber(settings.thirdPartyHarrisExchangeShare),
  ];
  if (DEMOGRAPHIC_GROUP_IDS.some(
    (groupId) => demographicSettings[groupId] !== 0,
  )) {
    base.push(`demographic:${DEMOGRAPHIC_GROUP_IDS.map(
      (groupId) => canonicalNumber(demographicSettings[groupId]),
    ).join(",")}`);
  }
  if (DEMOGRAPHIC_GROUP_IDS.some((groupId) => candidateShares[groupId] != null)) {
    base.push(`demographic-preference:${DEMOGRAPHIC_GROUP_IDS.map((groupId) => {
      const shares = candidateShares[groupId];
      return shares == null
        ? "inherit"
        : [shares.harris, shares.trump, shares.stein, shares.oliver, shares.residualOther]
          .map(canonicalNumber)
          .join(",");
    }).join(";")}`);
  }
  return base.join("|");
}

export function toBehaviorScenarioSettings(
  settings: StateBehaviorRecipeSettings,
): BehaviorScenarioSettings {
  const demographicSettings = normalizedDemographicTurnoutSettings(settings);
  const candidateShares = normalizedDemographicCandidateShares(settings);
  return {
    turnoutIncreasePoints: settings.turnoutIncreasePoints,
    addedVoterHarrisShare: settings.addedVoterHarrisShare / 100,
    demographicTurnoutIncreasePoints: demographicSettings,
    demographicCandidateShares: Object.fromEntries(DEMOGRAPHIC_GROUP_IDS.flatMap((groupId) => {
      const shares = candidateShares[groupId];
      if (shares == null) return [];
      const normalized: DemographicCandidateShareVector = {
        harris: shares.harris / 100,
        trump: shares.trump / 100,
        stein: shares.stein / 100,
        oliver: shares.oliver / 100,
        residualOther: shares.residualOther / 100,
      };
      return [[groupId, normalized]];
    })),
    preferenceShiftPoints: settings.preferenceShiftPoints,
    thirdPartyCandidate: settings.thirdPartyCandidate,
    thirdPartyShiftPoints: settings.thirdPartyShiftPoints,
    thirdPartyHarrisExchangeShare: settings.thirdPartyHarrisExchangeShare / 100,
  };
}

function signedMargin(result: Pick<StatewidePresidentialResult, "harrisVotes" | "trumpVotes" | "totalVotes">) {
  return (result.harrisVotes - result.trumpVotes) / result.totalVotes * 100;
}

export function buildStateScenarioSummary(
  recipe: StateScenarioRecipe,
  actual: StatewidePresidentialResult,
  scenario: BehaviorScenarioResult,
): StateScenarioSummary {
  const manifest = getDetailedStateManifest(recipe.stateCode);
  const winnerLabel = (winner: ReturnType<typeof presidentialPlurality>) => winner.toUpperCase() as StateScenarioSummary["scenarioWinner"];
  const actualWinner = winnerLabel(presidentialPlurality(actual));
  const scenarioWinner = winnerLabel(presidentialPlurality(scenario.totals));
  const allocation = electoralAllocationForResult(
    scenario.totals,
    manifest.election.electoralVotes,
  );
  return {
    stateCode: recipe.stateCode,
    electionId: recipe.electionId,
    dataVersion: recipe.dataVersion,
    engineVersion: recipe.engineVersion,
    recipeFingerprint: stateScenarioRecipeFingerprint(recipe),
    actualMargin: signedMargin(actual),
    scenarioMargin: signedMargin(scenario.totals),
    actualPluralityMargin: presidentialPluralityMargin(actual),
    scenarioPluralityMargin: presidentialPluralityMargin(scenario.totals),
    actualWinner,
    scenarioWinner,
    ...scenario.totals,
    electoralVotes: manifest.election.electoralVotes,
    ...allocation,
    otherElectoralVotes: "otherElectoralVotes" in allocation ? allocation.otherElectoralVotes : 0,
    flipped: actualWinner !== scenarioWinner,
  };
}

export function summaryAsStateResult(
  summary: StateScenarioSummary,
  actual: StatewidePresidentialResult,
): StatewidePresidentialResult {
  return {
    ...actual,
    harrisVotes: summary.harrisVotes,
    trumpVotes: summary.trumpVotes,
    steinVotes: summary.steinVotes,
    oliverVotes: summary.oliverVotes,
    residualOtherVotes: summary.residualOtherVotes,
    otherVotes: summary.otherVotes,
    totalVotes: summary.totalVotes,
    harrisElectoralVotes: summary.harrisElectoralVotes,
    trumpElectoralVotes: summary.trumpElectoralVotes,
    otherElectoralVotes: summary.otherElectoralVotes,
  };
}

export function recipesAsRecord(recipes: readonly StateScenarioRecipe[]) {
  return Object.fromEntries(recipes.map((recipe) => [recipe.stateCode, recipe])) as Partial<
    Record<DetailedStateCode, StateScenarioRecipe>
  >;
}
