import { canonicalStringCompare } from "../../election-replay/src/canonical.ts";
import type {
  ScenarioCandidateVector,
  ScenarioDeltaLedger,
  ScenarioDeltaMapStatus,
  ScenarioElectoralTargetCandidate,
} from "./scenarioDeltaContracts.ts";

export type ContributionComparisonScope = "county" | "unit";
export type ContributionStructureCandidate = ScenarioElectoralTargetCandidate | "tie";

export interface ContributionStructureRow {
  id: string;
  name: string;
  context: string;
  countyFips: string | null;
  geometryId: string | null;
  mapStatus: ScenarioDeltaMapStatus;
  rank: number;
  winnerVotes: number;
  runnerUpVotes: number;
  contributionVotes: number;
}

export interface ContributionEndpointStructure {
  winner: ContributionStructureCandidate;
  runnerUp: ContributionStructureCandidate;
  pluralityMarginVotes: number;
  rows: readonly ContributionStructureRow[];
  supportingRows: readonly ContributionStructureRow[];
  strongestResistance: ContributionStructureRow | null;
  unmappedContributionVotes: number;
}

export interface ScenarioContributionComparison {
  stateCode: string;
  scope: ContributionComparisonScope;
  winnerChanged: boolean;
  certified: ContributionEndpointStructure;
  scenario: ContributionEndpointStructure;
  sharedTopIds: readonly string[];
}

export interface ScenarioContributionComparisonInput {
  ledger: ScenarioDeltaLedger;
  scope: ContributionComparisonScope;
  countyNames?: Readonly<Record<string, string>>;
  unitNames?: Readonly<Record<string, string>>;
}

const candidateOrder = [
  "harris",
  "trump",
  "stein",
  "oliver",
  "residual_other",
] as const;

const candidateVoteFields = {
  harris: "harrisVotes",
  trump: "trumpVotes",
  stein: "steinVotes",
  oliver: "oliverVotes",
  residual_other: "residualOtherVotes",
} as const satisfies Readonly<Record<ScenarioElectoralTargetCandidate, keyof ScenarioCandidateVector>>;

function endpointLeaders(vector: ScenarioCandidateVector) {
  const ordered = candidateOrder
    .map((candidate) => ({ candidate, votes: vector[candidateVoteFields[candidate]] }))
    .sort((left, right) => right.votes - left.votes || canonicalStringCompare(left.candidate, right.candidate));
  if (ordered[0].votes === ordered[1].votes) {
    return { winner: "tie" as const, runnerUp: "tie" as const, marginVotes: 0 };
  }
  return {
    winner: ordered[0].candidate,
    runnerUp: ordered[1].candidate,
    marginVotes: ordered[0].votes - ordered[1].votes,
  };
}

function buildEndpointStructure(
  input: ScenarioContributionComparisonInput,
  endpoint: "certified" | "scenario",
): ContributionEndpointStructure {
  const leaders = endpointLeaders(input.ledger[endpoint]);
  if (leaders.winner === "tie") {
    return Object.freeze({
      winner: "tie",
      runnerUp: "tie",
      pluralityMarginVotes: 0,
      rows: Object.freeze([]),
      supportingRows: Object.freeze([]),
      strongestResistance: null,
      unmappedContributionVotes: 0,
    });
  }
  const winnerField = candidateVoteFields[leaders.winner];
  const runnerUpField = candidateVoteFields[leaders.runnerUp];
  const sourceRows = input.scope === "county"
    ? input.ledger.statewideResidual
      ? [...input.ledger.counties, input.ledger.statewideResidual]
      : input.ledger.counties
    : input.ledger.units;
  const rows = sourceRows.map((row) => {
    const vector = row[endpoint];
    const countyFips = "countyFips" in row ? row.countyFips : null;
    const geometryId = "geometryId" in row ? row.geometryId : null;
    const id = input.scope === "county" ? row.id : geometryId ?? row.id;
    const name = input.scope === "county"
      ? countyFips
        ? input.countyNames?.[countyFips] ?? countyFips
        : "Statewide-only residual"
      : geometryId
        ? input.unitNames?.[geometryId] ?? geometryId
        : row.id;
    const context = input.scope === "county"
      ? countyFips ? "County" : "Off-map source units"
      : countyFips
        ? input.countyNames?.[countyFips] ?? countyFips
        : "Off-map source unit";
    return {
      id,
      name,
      context,
      countyFips,
      geometryId,
      mapStatus: row.mapStatus,
      rank: 0,
      winnerVotes: vector[winnerField],
      runnerUpVotes: vector[runnerUpField],
      contributionVotes: vector[winnerField] - vector[runnerUpField],
    } satisfies ContributionStructureRow;
  }).sort((left, right) => (
    right.contributionVotes - left.contributionVotes
    || right.winnerVotes - left.winnerVotes
    || canonicalStringCompare(left.id, right.id)
  ));
  const isSelectable = (row: ContributionStructureRow) => input.scope === "county"
    ? row.countyFips !== null
    : row.geometryId !== null;
  const supportingRows = rows
    .filter((row) => row.contributionVotes > 0 && isSelectable(row))
    .map((row, index) => Object.freeze({ ...row, rank: index + 1 }));
  const strongestResistance = [...rows]
    .filter((row) => row.contributionVotes < 0 && isSelectable(row))
    .sort((left, right) => (
      left.contributionVotes - right.contributionVotes
      || canonicalStringCompare(left.id, right.id)
    ))[0] ?? null;
  return Object.freeze({
    winner: leaders.winner,
    runnerUp: leaders.runnerUp,
    pluralityMarginVotes: leaders.marginVotes,
    rows: Object.freeze(rows.map((row) => Object.freeze(row))),
    supportingRows: Object.freeze(supportingRows),
    strongestResistance: strongestResistance ? Object.freeze(strongestResistance) : null,
    unmappedContributionVotes: rows
      .filter((row) => !isSelectable(row))
      .reduce((sum, row) => sum + row.contributionVotes, 0),
  });
}

export function buildScenarioContributionComparison(
  input: ScenarioContributionComparisonInput,
): ScenarioContributionComparison {
  const certified = buildEndpointStructure(input, "certified");
  const scenario = buildEndpointStructure(input, "scenario");
  const certifiedTopIds = new Set(certified.supportingRows.slice(0, 5).map((row) => row.id));
  const sharedTopIds = scenario.supportingRows
    .slice(0, 5)
    .map((row) => row.id)
    .filter((id) => certifiedTopIds.has(id))
    .sort(canonicalStringCompare);
  return Object.freeze({
    stateCode: input.ledger.stateCode,
    scope: input.scope,
    winnerChanged: certified.winner !== scenario.winner,
    certified,
    scenario,
    sharedTopIds: Object.freeze(sharedTopIds),
  });
}
