import { rankScenarioDeltaRows } from "./scenarioDeltaLedger.ts";
import type {
  ScenarioDeltaLedger,
  ScenarioDeltaMapStatus,
  ScenarioDeltaOperationId,
} from "./scenarioDeltaContracts.ts";

export type ScenarioExplanationDirection = "harris" | "trump" | "none";
export type ScenarioExplanationCandidate = "harris" | "trump" | "stein" | "oliver" | "residual_other" | "tie";

export interface ScenarioExplanationOperation {
  operationId: ScenarioDeltaOperationId;
  marginVotes: number;
  decisiveVotes: number;
  basis: "harris-trump-margin" | "plurality-winner-votes";
  grossShareMillionths: number;
}

export interface ScenarioExplanationGeography {
  id: string;
  name: string;
  context: string | null;
  marginVotes: number;
  decisiveVotes: number;
  basis: "harris-trump-margin" | "plurality-winner-votes";
  mapStatus: ScenarioDeltaMapStatus;
}

export interface ScenarioExplanationElectoral {
  actualWinner: ScenarioExplanationCandidate;
  scenarioWinner: ScenarioExplanationCandidate;
  electoralVotes: number;
  winnerChanged: boolean;
  targetCandidate: ScenarioExplanationCandidate;
  targetElectoralDelta: number;
}

export interface ScenarioExplanation {
  stateCode: string;
  direction: ScenarioExplanationDirection;
  marginVotes: number;
  dominantOperation: ScenarioExplanationOperation | null;
  largestSupportingCounty: ScenarioExplanationGeography | null;
  largestOpposingCounty: ScenarioExplanationGeography | null;
  largestSupportingUnit: ScenarioExplanationGeography | null;
  electoral: ScenarioExplanationElectoral;
}

export interface ScenarioExplanationInput {
  ledger: ScenarioDeltaLedger;
  countyNames?: Readonly<Record<string, string>>;
  unitNames?: Readonly<Record<string, string>>;
}

const operationOrder: Readonly<Record<ScenarioDeltaOperationId, number>> = {
  turnout: 0,
  preference: 1,
  "third-party": 2,
};

function direction(value: number): ScenarioExplanationDirection {
  return value > 0 ? "harris" : value < 0 ? "trump" : "none";
}

function winner(vector: ScenarioDeltaLedger["certified"]): ScenarioExplanationCandidate {
  const ranked = [
    ["harris", vector.harrisVotes],
    ["trump", vector.trumpVotes],
    ["stein", vector.steinVotes],
    ["oliver", vector.oliverVotes],
    ["residual_other", vector.residualOtherVotes],
  ] as const;
  const ordered = [...ranked].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
  return ordered[0][1] === ordered[1][1] ? "tie" : ordered[0][0];
}

function geographySupports(value: number, statewideDirection: ScenarioExplanationDirection) {
  if (statewideDirection === "harris") return value > 0;
  if (statewideDirection === "trump") return value < 0;
  return value !== 0;
}

function geographyOpposes(value: number, statewideDirection: ScenarioExplanationDirection) {
  if (statewideDirection === "harris") return value < 0;
  if (statewideDirection === "trump") return value > 0;
  return false;
}

export function buildScenarioExplanation(input: ScenarioExplanationInput): ScenarioExplanation {
  const { ledger } = input;
  const statewideDirection = direction(ledger.delta.harrisTrumpMarginVotes);
  const actualWinner = winner(ledger.certified);
  const scenarioWinner = winner(ledger.scenario);
  const pluralityVoteField = scenarioWinner === "stein"
    ? "steinVotes"
    : scenarioWinner === "oliver"
      ? "oliverVotes"
      : scenarioWinner === "residual_other"
        ? "residualOtherVotes"
        : null;
  const dominantBasis = pluralityVoteField && actualWinner !== scenarioWinner
    ? "plurality-winner-votes" as const
    : "harris-trump-margin" as const;
  const decisiveMovement = (operation: ScenarioDeltaLedger["operations"][number]) => dominantBasis === "plurality-winner-votes"
    ? operation.delta[pluralityVoteField!]
    : operation.delta.harrisTrumpMarginVotes;
  const operationGrossMovement = ledger.operations.reduce(
    (sum, operation) => sum + Math.abs(decisiveMovement(operation)),
    0,
  );
  const dominantOperationRow = [...ledger.operations]
    .filter((operation) => decisiveMovement(operation) !== 0)
    .sort((left, right) => (
      Math.abs(decisiveMovement(right)) - Math.abs(decisiveMovement(left))
      || operationOrder[left.operationId] - operationOrder[right.operationId]
    ))[0] ?? null;
  const dominantOperation = dominantOperationRow ? Object.freeze({
    operationId: dominantOperationRow.operationId,
    marginVotes: dominantOperationRow.delta.harrisTrumpMarginVotes,
    decisiveVotes: decisiveMovement(dominantOperationRow),
    basis: dominantBasis,
    grossShareMillionths: operationGrossMovement > 0
      ? Math.round(Math.abs(decisiveMovement(dominantOperationRow)) * 1_000_000 / operationGrossMovement)
      : 0,
  }) : null;

  const geographyMovement = (row: ScenarioDeltaLedger["counties"][number] | ScenarioDeltaLedger["units"][number]) => (
    dominantBasis === "plurality-winner-votes"
      ? row.delta[pluralityVoteField!]
      : row.delta.harrisTrumpMarginVotes
  );
  const rankedCounties = dominantBasis === "plurality-winner-votes"
    ? [...ledger.counties].sort((left, right) => (
      Math.abs(geographyMovement(right)) - Math.abs(geographyMovement(left))
      || right.id.localeCompare(left.id)
    ))
    : rankScenarioDeltaRows(ledger.counties);
  const supportingCounty = rankedCounties.find((county) => (
    dominantBasis === "plurality-winner-votes"
      ? geographyMovement(county) > 0
      : geographySupports(county.delta.harrisTrumpMarginVotes, statewideDirection)
  ));
  const opposingCounty = rankedCounties.find((county) => (
    dominantBasis === "plurality-winner-votes"
      ? geographyMovement(county) < 0
      : geographyOpposes(county.delta.harrisTrumpMarginVotes, statewideDirection)
  ));
  const rankedUnits = (dominantBasis === "plurality-winner-votes"
    ? [...ledger.units].sort((left, right) => (
      Math.abs(geographyMovement(right)) - Math.abs(geographyMovement(left))
      || right.id.localeCompare(left.id)
    ))
    : rankScenarioDeltaRows(ledger.units))
    .filter((unit) => unit.geometryId !== null);
  const supportingUnit = rankedUnits.find((unit) => (
    dominantBasis === "plurality-winner-votes"
      ? geographyMovement(unit) > 0
      : geographySupports(unit.delta.harrisTrumpMarginVotes, statewideDirection)
  ));

  const countyGeography = supportingCounty ? Object.freeze({
    id: supportingCounty.id,
    name: input.countyNames?.[supportingCounty.countyFips] ?? supportingCounty.countyFips,
    context: "County",
    marginVotes: supportingCounty.delta.harrisTrumpMarginVotes,
    decisiveVotes: geographyMovement(supportingCounty),
    basis: dominantBasis,
    mapStatus: supportingCounty.mapStatus,
  }) : null;
  const opposingCountyGeography = opposingCounty ? Object.freeze({
    id: opposingCounty.id,
    name: input.countyNames?.[opposingCounty.countyFips] ?? opposingCounty.countyFips,
    context: "County offset",
    marginVotes: opposingCounty.delta.harrisTrumpMarginVotes,
    decisiveVotes: geographyMovement(opposingCounty),
    basis: dominantBasis,
    mapStatus: opposingCounty.mapStatus,
  }) : null;
  const unitGeography = supportingUnit ? Object.freeze({
    id: supportingUnit.geometryId!,
    name: input.unitNames?.[supportingUnit.geometryId!] ?? supportingUnit.geometryId!,
    context: supportingUnit.countyFips
      ? input.countyNames?.[supportingUnit.countyFips] ?? supportingUnit.countyFips
      : null,
    marginVotes: supportingUnit.delta.harrisTrumpMarginVotes,
    decisiveVotes: geographyMovement(supportingUnit),
    basis: dominantBasis,
    mapStatus: supportingUnit.mapStatus,
  }) : null;

  const electoralVotes = ledger.electoral.actualHarrisElectoralVotes
    + ledger.electoral.actualTrumpElectoralVotes
    + ledger.electoral.actualOtherElectoralVotes;
  return Object.freeze({
    stateCode: ledger.stateCode,
    direction: statewideDirection,
    marginVotes: ledger.delta.harrisTrumpMarginVotes,
    dominantOperation,
    largestSupportingCounty: countyGeography,
    largestOpposingCounty: opposingCountyGeography,
    largestSupportingUnit: unitGeography,
    electoral: Object.freeze({
      actualWinner,
      scenarioWinner,
      electoralVotes,
      winnerChanged: ledger.electoral.winnerChanged,
      targetCandidate: ledger.electoral.targetCandidate,
      targetElectoralDelta: ledger.electoral.targetElectoralDelta,
    }),
  });
}
