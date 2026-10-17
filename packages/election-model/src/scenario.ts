import {
  DEMOGRAPHIC_GROUP_IDS,
  type CandidateVotes,
  type DemographicGroupCounts,
  type DemographicGroupId,
  type ReportingUnitResult,
} from "../../data-contracts/src/index.ts";
import {
  assertProbabilityVector,
  assertResultReconciles,
  largestRemainder,
} from "./invariants.ts";

export interface StatewidePresidentialResult {
  code: string;
  totalVotes: number;
  harrisVotes: number;
  trumpVotes: number;
  steinVotes?: number;
  oliverVotes?: number;
  residualOtherVotes?: number;
  otherVotes: number;
  harrisElectoralVotes: number;
  trumpElectoralVotes: number;
  otherElectoralVotes?: number;
}

export interface NationalPresidentialResult {
  totalVotes: number;
  harrisVotes: number;
  trumpVotes: number;
  steinVotes: number;
  oliverVotes: number;
  residualOtherVotes: number;
  otherVotes: number;
  harrisElectoralVotes: number;
  trumpElectoralVotes: number;
  otherElectoralVotes: number;
}

export type PresidentialPluralityCandidate =
  | "harris"
  | "trump"
  | "stein"
  | "oliver"
  | "residual_other"
  | "tie";

type PresidentialVoteResult = Pick<
  StatewidePresidentialResult,
  "harrisVotes" | "trumpVotes" | "steinVotes" | "oliverVotes" | "residualOtherVotes" | "totalVotes"
>;

export function presidentialPlurality(result: PresidentialVoteResult): PresidentialPluralityCandidate {
  const candidates: Array<{ candidate: Exclude<PresidentialPluralityCandidate, "tie">; votes: number }> = [
    { candidate: "harris", votes: result.harrisVotes },
    { candidate: "trump", votes: result.trumpVotes },
  ];
  const namedVector = [result.steinVotes, result.oliverVotes, result.residualOtherVotes]
    .every((votes) => Number.isSafeInteger(votes) && votes! >= 0);
  if (namedVector) {
    candidates.push(
      { candidate: "stein", votes: result.steinVotes! },
      { candidate: "oliver", votes: result.oliverVotes! },
      { candidate: "residual_other", votes: result.residualOtherVotes! },
    );
  }
  candidates.sort((left, right) => right.votes - left.votes || left.candidate.localeCompare(right.candidate));
  return candidates[0].votes === candidates[1].votes ? "tie" : candidates[0].candidate;
}

export function presidentialPluralityMargin(result: PresidentialVoteResult) {
  if (result.totalVotes <= 0) return 0;
  const candidates = [result.harrisVotes, result.trumpVotes];
  if ([result.steinVotes, result.oliverVotes, result.residualOtherVotes]
    .every((votes) => Number.isSafeInteger(votes) && votes! >= 0)) {
    candidates.push(result.steinVotes!, result.oliverVotes!, result.residualOtherVotes!);
  }
  candidates.sort((left, right) => right - left);
  return (candidates[0] - candidates[1]) / result.totalVotes * 100;
}

export function stateElectoralVotes(result: Pick<StatewidePresidentialResult, "harrisElectoralVotes" | "trumpElectoralVotes" | "otherElectoralVotes">) {
  return result.harrisElectoralVotes + result.trumpElectoralVotes + (result.otherElectoralVotes ?? 0);
}

export function electoralAllocationForResult(result: PresidentialVoteResult, electoralVotes: number) {
  const winner = presidentialPlurality(result);
  const majorAllocation = {
    harrisElectoralVotes: winner === "harris" ? electoralVotes : 0,
    trumpElectoralVotes: winner === "trump" ? electoralVotes : 0,
  };
  return winner === "harris" || winner === "trump"
    ? majorAllocation
    : { ...majorAllocation, otherElectoralVotes: electoralVotes };
}

export interface CountyPresidentialResult {
  fips: string;
  name: string;
  totalVotes: number;
  harrisVotes: number;
  trumpVotes: number;
  steinVotes?: number;
  oliverVotes?: number;
  residualOtherVotes?: number;
  otherVotes: number;
}

export interface CountyScenarioResult extends CountyPresidentialResult {
  netHarrisGain: number;
}

export interface BehaviorModelUnit {
  id: string;
  countyFips: string | null;
  geometryId: string | null;
  harrisVotes: number;
  trumpVotes: number;
  steinVotes: number;
  oliverVotes: number;
  residualOtherVotes: number;
  otherVotes: number;
  totalVotes: number;
  turnoutDenominator: number | null;
  turnoutCapacity: number;
  demographicComposition?: DemographicGroupCounts | null;
}

export type ThirdPartyCandidate = "stein" | "oliver" | "residual_other";

export const DEMOGRAPHIC_PREFERENCE_CANDIDATES = [
  "harris",
  "trump",
  "stein",
  "oliver",
  "residualOther",
] as const;

export type DemographicPreferenceCandidate = typeof DEMOGRAPHIC_PREFERENCE_CANDIDATES[number];

export interface DemographicCandidateShareVector {
  harris: number;
  trump: number;
  stein: number;
  oliver: number;
  residualOther: number;
}

export interface DemographicCandidateVoteVector {
  harrisVotes: number;
  trumpVotes: number;
  steinVotes: number;
  oliverVotes: number;
  residualOtherVotes: number;
  totalVotes: number;
}

export interface BehaviorScenarioSettings {
  turnoutIncreasePoints: number;
  addedVoterHarrisShare: number;
  demographicTurnoutIncreasePoints?: Partial<Record<DemographicGroupId, number>>;
  demographicCandidateShares?: Partial<Record<DemographicGroupId, DemographicCandidateShareVector>>;
  preferenceShiftPoints: number;
  thirdPartyCandidate: ThirdPartyCandidate;
  thirdPartyShiftPoints: number;
  thirdPartyHarrisExchangeShare: number;
  thirdPartyGeographicAllocationProfile?: ThirdPartyGeographicAllocationProfile;
}

export interface BehaviorScenarioUnit extends BehaviorModelUnit {
  turnoutAddedVotes: number;
  turnoutHarrisVotes: number;
  turnoutTrumpVotes: number;
  turnoutSteinVotes?: number;
  turnoutOliverVotes?: number;
  turnoutResidualOtherVotes?: number;
  demographicTurnoutAddedVotes?: number;
  demographicTurnoutByGroup?: Partial<
    Record<DemographicGroupId, DemographicCandidateVoteVector>
  >;
  preferenceNetHarrisGain: number;
  thirdPartyCandidateDelta: number;
  netHarrisGain: number;
}

export interface BehaviorScenarioResult {
  units: BehaviorScenarioUnit[];
  totals: {
    harrisVotes: number;
    trumpVotes: number;
    steinVotes: number;
    oliverVotes: number;
    residualOtherVotes: number;
    otherVotes: number;
    totalVotes: number;
  };
  turnout: {
    requestedVotes: number;
    addedVotes: number;
    harrisVotes: number;
    trumpVotes: number;
    steinVotes: number;
    oliverVotes: number;
    residualOtherVotes: number;
    otherVotes: number;
    denominator: number;
    capacity: number;
  };
  demographicTurnout: {
    status: "not_requested" | "applied" | "unavailable";
    requestedVotes: number;
    addedVotes: number;
    groups: readonly {
      groupId: DemographicGroupId;
      increasePoints: number;
      population: number;
      requestedVotes: number;
      addedVotes: number;
      clippedVotes: number;
      candidateShares: DemographicCandidateShareVector;
      candidateShareMode: "shared-major-party" | "custom-five-candidate";
      candidateVotes: DemographicCandidateVoteVector;
      harrisTrumpMarginVotes: number;
      marginVotesPerThousandAdded: number;
    }[];
  };
  preference: {
    requestedTransfer: number;
    realizedTransfer: number;
  };
  thirdParty: {
    candidate: ThirdPartyCandidate;
    startingCandidateVotes: number;
    exchangeCapacity: number;
    ballotTotal: number;
    requestedCandidateDelta: number;
    realizedCandidateDelta: number;
    harrisVoteDelta: number;
    trumpVoteDelta: number;
  };
}

export interface BehaviorContribution {
  id: string;
  countyFips: string | null;
  geometryId: string | null;
  harrisDelta: number;
  trumpDelta: number;
  otherDelta: number;
  ballotDelta: number;
  marginDelta: number;
}

export interface PreferenceShiftBounds {
  towardTrumpPoints: number;
  towardHarrisPoints: number;
}

export interface ThirdPartyShiftBounds {
  towardZeroPoints: number;
  towardMaximumPoints: number;
}

interface BehaviorBaselineProfile {
  denominator: number;
  capacity: number;
  turnoutWeights: number[];
  turnoutCapacities: number[];
}

export type TwoPartyResult = {
  harrisVotes: number;
  trumpVotes: number;
};

type ThirdPartyVoteKey = "steinVotes" | "oliverVotes" | "residualOtherVotes";

export const THIRD_PARTY_GEOGRAPHIC_ALLOCATION_PROFILE =
  "certified-local-support-affinity-v1" as const;
export const LEGACY_THIRD_PARTY_GEOGRAPHIC_ALLOCATION_PROFILE =
  "statewide-party-proportional-v1" as const;
export type ThirdPartyGeographicAllocationProfile =
  | typeof THIRD_PARTY_GEOGRAPHIC_ALLOCATION_PROFILE
  | typeof LEGACY_THIRD_PARTY_GEOGRAPHIC_ALLOCATION_PROFILE;

const THIRD_PARTY_AFFINITY_PRIOR_BALLOTS = 25;
const THIRD_PARTY_AFFINITY_EXPONENT = 2;

const behaviorBaselineProfileCache = new WeakMap<
  readonly BehaviorModelUnit[],
  BehaviorBaselineProfile
>();
const behaviorBaselineIndexCache = new WeakMap<
  readonly BehaviorModelUnit[],
  ReadonlyMap<string, BehaviorModelUnit>
>();

function behaviorBaselineProfile(
  baselineUnits: readonly BehaviorModelUnit[],
): BehaviorBaselineProfile {
  const cached = behaviorBaselineProfileCache.get(baselineUnits);
  if (cached) return cached;

  let denominator = 0;
  let capacity = 0;
  const turnoutWeights = new Array<number>(baselineUnits.length);
  const turnoutCapacities = new Array<number>(baselineUnits.length);
  for (let index = 0; index < baselineUnits.length; index += 1) {
    const unit = baselineUnits[index];
    if (unit.harrisVotes + unit.trumpVotes + unit.otherVotes !== unit.totalVotes) {
      throw new Error(`${unit.id} baseline votes do not reconcile`);
    }
    if (unit.steinVotes + unit.oliverVotes + unit.residualOtherVotes !== unit.otherVotes) {
      throw new Error(`${unit.id} third-party votes do not reconcile`);
    }
    if (!Number.isSafeInteger(unit.turnoutCapacity) || unit.turnoutCapacity < 0) {
      throw new Error(`${unit.id} has invalid turnout capacity`);
    }
    const turnoutWeight = unit.turnoutDenominator ?? 0;
    turnoutWeights[index] = turnoutWeight;
    turnoutCapacities[index] = unit.turnoutCapacity;
    denominator += turnoutWeight;
    capacity += unit.turnoutCapacity;
  }

  const profile = { denominator, capacity, turnoutWeights, turnoutCapacities };
  behaviorBaselineProfileCache.set(baselineUnits, profile);
  return profile;
}

function behaviorBaselineIndex(
  baselineUnits: readonly BehaviorModelUnit[],
) {
  const cached = behaviorBaselineIndexCache.get(baselineUnits);
  if (cached) return cached;
  const index = new Map(baselineUnits.map((unit) => [unit.id, unit]));
  if (index.size !== baselineUnits.length) {
    throw new Error("Behavior baseline contains duplicate unit identifiers");
  }
  behaviorBaselineIndexCache.set(baselineUnits, index);
  return index;
}

function thirdPartyVoteKey(candidate: ThirdPartyCandidate): ThirdPartyVoteKey {
  if (candidate === "stein") return "steinVotes";
  if (candidate === "oliver") return "oliverVotes";
  return "residualOtherVotes";
}

function splitThirdPartyExchange(ballots: number, harrisShare: number) {
  const harrisVotes = Math.round(ballots * harrisShare);
  return { harrisVotes, trumpVotes: ballots - harrisVotes };
}

function thirdPartyGainCapacity(
  harrisVotes: number,
  trumpVotes: number,
  harrisShare: number,
) {
  let lower = 0;
  let upper = harrisVotes + trumpVotes;
  while (lower < upper) {
    const candidate = Math.ceil((lower + upper) / 2);
    const exchange = splitThirdPartyExchange(candidate, harrisShare);
    if (exchange.harrisVotes <= harrisVotes && exchange.trumpVotes <= trumpVotes) {
      lower = candidate;
    } else {
      upper = candidate - 1;
    }
  }
  return lower;
}

export function preferenceShiftBounds(
  result: Pick<BehaviorModelUnit, "harrisVotes" | "trumpVotes" | "totalVotes">,
): PreferenceShiftBounds {
  if (!Number.isSafeInteger(result.totalVotes) || result.totalVotes <= 0) {
    throw new Error("Preference bounds require a positive safe-integer ballot total");
  }
  if (!Number.isSafeInteger(result.harrisVotes) || result.harrisVotes < 0
    || !Number.isSafeInteger(result.trumpVotes) || result.trumpVotes < 0
    || result.harrisVotes + result.trumpVotes > result.totalVotes) {
    throw new Error("Preference bounds require valid major-party vote totals");
  }
  return {
    towardTrumpPoints: -(result.harrisVotes * 200) / result.totalVotes,
    towardHarrisPoints: (result.trumpVotes * 200) / result.totalVotes,
  };
}

export function thirdPartyShiftBounds(
  result: Pick<
    BehaviorModelUnit,
    | "harrisVotes"
    | "trumpVotes"
    | "steinVotes"
    | "oliverVotes"
    | "residualOtherVotes"
    | "totalVotes"
  >,
  candidate: ThirdPartyCandidate,
  harrisExchangeShare: number,
): ThirdPartyShiftBounds {
  if (!Number.isSafeInteger(result.totalVotes) || result.totalVotes <= 0) {
    throw new Error("Third-party bounds require a positive safe-integer ballot total");
  }
  const candidateVotes = result[thirdPartyVoteKey(candidate)];
  if (![result.harrisVotes, result.trumpVotes, candidateVotes]
    .every((votes) => Number.isSafeInteger(votes) && votes >= 0)) {
    throw new Error("Third-party bounds require valid candidate vote totals");
  }
  if (!Number.isFinite(harrisExchangeShare)
    || harrisExchangeShare < 0
    || harrisExchangeShare > 1) {
    throw new Error("Third-party Harris exchange share must be between zero and one");
  }
  const exchangeCapacity = thirdPartyGainCapacity(
    result.harrisVotes,
    result.trumpVotes,
    harrisExchangeShare,
  );
  return {
    towardZeroPoints: -(candidateVotes * 100) / result.totalVotes,
    towardMaximumPoints: (exchangeCapacity * 100) / result.totalVotes,
  };
}

export function deriveBehaviorContributions(
  baselineUnits: readonly BehaviorModelUnit[],
  scenarioUnits: readonly BehaviorScenarioUnit[],
): BehaviorContribution[] {
  const baselineById = behaviorBaselineIndex(baselineUnits);
  if (scenarioUnits.length !== baselineUnits.length) {
    throw new Error("Behavior contribution inputs must contain the same units");
  }

  let sameOrder = true;
  for (let index = 0; index < scenarioUnits.length; index += 1) {
    if (scenarioUnits[index].id !== baselineUnits[index].id) {
      sameOrder = false;
      break;
    }
  }
  const contributions = scenarioUnits.map((unit, index) => {
    const baseline = sameOrder ? baselineUnits[index] : baselineById.get(unit.id);
    if (!baseline) throw new Error(`Scenario unit ${unit.id} is missing from the baseline`);
    const harrisDelta = unit.harrisVotes - baseline.harrisVotes;
    const trumpDelta = unit.trumpVotes - baseline.trumpVotes;
    return {
      id: unit.id,
      countyFips: unit.countyFips,
      geometryId: unit.geometryId,
      harrisDelta,
      trumpDelta,
      otherDelta: unit.otherVotes - baseline.otherVotes,
      ballotDelta: unit.totalVotes - baseline.totalVotes,
      marginDelta: harrisDelta - trumpDelta,
    };
  });
  if (!sameOrder) {
    const scenarioIds = new Set(scenarioUnits.map((unit) => unit.id));
    if (scenarioIds.size !== scenarioUnits.length
      || baselineUnits.some((unit) => !scenarioIds.has(unit.id))) {
      throw new Error("Behavior contribution inputs must contain each unit exactly once");
    }
  }
  return contributions;
}

function proportionalAllocation(weights: readonly number[], requiredTotal: number) {
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
  if (requiredTotal === 0) return weights.map(() => 0);
  if (weightTotal <= 0) throw new Error("Positive allocation requires a positive weight");
  return largestRemainder(
    weights.map((weight) => (weight / weightTotal) * requiredTotal),
    requiredTotal,
  );
}

function allocateCanonicallyByUnit(
  units: readonly Pick<BehaviorModelUnit, "id">[],
  weights: readonly number[],
  capacities: readonly number[],
  requiredTotal: number,
) {
  if (units.length !== weights.length || units.length !== capacities.length) {
    throw new Error("Canonical allocation inputs must have the same length");
  }
  const canonical = units
    .map((unit, index) => ({ id: unit.id, index }))
    .sort((left, right) => left.id.localeCompare(right.id));
  for (let index = 1; index < canonical.length; index += 1) {
    if (canonical[index - 1].id === canonical[index].id) {
      throw new Error("Canonical allocation requires unique unit identifiers");
    }
  }
  const canonicalAllocation = allocateCappedProportionally(
    canonical.map(({ index }) => weights[index]),
    canonical.map(({ index }) => capacities[index]),
    requiredTotal,
  );
  const allocation = units.map(() => 0);
  canonical.forEach(({ index }, canonicalIndex) => {
    allocation[index] = canonicalAllocation[canonicalIndex];
  });
  return allocation;
}

function thirdPartyGeographicAffinities(
  units: readonly BehaviorModelUnit[],
  candidate: ThirdPartyCandidate,
) {
  const voteKey = thirdPartyVoteKey(candidate);
  const statewideCandidateVotes = units.reduce((sum, unit) => sum + unit[voteKey], 0);
  const statewideBallots = units.reduce((sum, unit) => sum + unit.totalVotes, 0);
  const statewidePriorShare = statewideBallots > 0
    ? Math.max(statewideCandidateVotes / statewideBallots, 1 / statewideBallots)
    : 0;
  return units.map((unit) => {
    const localSupport = (
      unit[voteKey] + THIRD_PARTY_AFFINITY_PRIOR_BALLOTS * statewidePriorShare
    ) / (unit.totalVotes + THIRD_PARTY_AFFINITY_PRIOR_BALLOTS);
    return Math.pow(localSupport, THIRD_PARTY_AFFINITY_EXPONENT);
  });
}

export function allocateCappedProportionally(
  weights: readonly number[],
  capacities: readonly number[],
  requiredTotal: number,
) {
  if (weights.length !== capacities.length) {
    throw new Error("Weights and capacities must have the same length");
  }
  if (!Number.isSafeInteger(requiredTotal) || requiredTotal < 0) {
    throw new Error("Required allocation must be a non-negative safe integer");
  }
  if (weights.some((weight) => !Number.isFinite(weight) || weight < 0)) {
    throw new Error("Allocation weights must be finite and non-negative");
  }
  if (capacities.some((capacity) => !Number.isSafeInteger(capacity) || capacity < 0)) {
    throw new Error("Allocation capacities must be non-negative safe integers");
  }

  const capacityTotal = capacities.reduce((sum, capacity) => sum + capacity, 0);
  if (requiredTotal > capacityTotal) {
    throw new Error(`Required allocation ${requiredTotal} exceeds capacity ${capacityTotal}`);
  }
  if (weights.every((weight, index) => weight === capacities[index])) {
    return proportionalAllocation(weights, requiredTotal);
  }
  const allocation = weights.map(() => 0);
  let remaining = requiredTotal;

  while (remaining > 0) {
    const active = weights
      .map((weight, index) => ({ index, weight }))
      .filter(({ index, weight }) => weight > 0 && allocation[index] < capacities[index]);
    if (active.length === 0) {
      throw new Error(`Unable to place ${remaining} votes within the supplied capacities`);
    }
    const proposed = proportionalAllocation(
      active.map(({ weight }) => weight),
      remaining,
    );
    let overflow = 0;
    active.forEach(({ index }, activeIndex) => {
      const available = capacities[index] - allocation[index];
      const placed = Math.min(available, proposed[activeIndex]);
      allocation[index] += placed;
      overflow += proposed[activeIndex] - placed;
    });
    remaining = overflow;
  }
  return allocation;
}

function demographicTurnoutSettings(
  settings: BehaviorScenarioSettings,
): Record<DemographicGroupId, number> {
  const supplied = settings.demographicTurnoutIncreasePoints ?? {};
  for (const key of Object.keys(supplied)) {
    if (!DEMOGRAPHIC_GROUP_IDS.includes(key as DemographicGroupId)) {
      throw new Error(`Unsupported demographic turnout group ${key}`);
    }
  }
  return Object.fromEntries(DEMOGRAPHIC_GROUP_IDS.map((groupId) => {
    const points = supplied[groupId] ?? 0;
    if (!Number.isFinite(points) || points < 0 || points > 100) {
      throw new Error(`${groupId} turnout increase must be between zero and 100 points`);
    }
    return [groupId, points];
  })) as Record<DemographicGroupId, number>;
}

function emptyDemographicCandidateVotes(): DemographicCandidateVoteVector {
  return {
    harrisVotes: 0,
    trumpVotes: 0,
    steinVotes: 0,
    oliverVotes: 0,
    residualOtherVotes: 0,
    totalVotes: 0,
  };
}

function validateDemographicCandidateShareVector(
  value: DemographicCandidateShareVector,
  label: string,
) {
  const keys = Object.keys(value).sort();
  const expected = [...DEMOGRAPHIC_PREFERENCE_CANDIDATES].sort();
  if (keys.length !== expected.length || keys.some((key, index) => key !== expected[index])) {
    throw new Error(`${label} candidate-share contract is malformed`);
  }
  assertProbabilityVector(DEMOGRAPHIC_PREFERENCE_CANDIDATES.map((candidate) => value[candidate]));
  return { ...value };
}

function demographicCandidateShares(
  settings: BehaviorScenarioSettings,
): Partial<Record<DemographicGroupId, DemographicCandidateShareVector>> {
  const supplied = settings.demographicCandidateShares ?? {};
  for (const key of Object.keys(supplied)) {
    if (!DEMOGRAPHIC_GROUP_IDS.includes(key as DemographicGroupId)) {
      throw new Error(`Unsupported demographic preference group ${key}`);
    }
  }
  return Object.fromEntries(DEMOGRAPHIC_GROUP_IDS.flatMap((groupId) => {
    const value = supplied[groupId];
    return value == null
      ? []
      : [[groupId, validateDemographicCandidateShareVector(value, groupId)]];
  }));
}

function splitDemographicCandidateVotes(
  totalVotes: number,
  shares: DemographicCandidateShareVector,
): DemographicCandidateVoteVector {
  const allocation = largestRemainder(
    DEMOGRAPHIC_PREFERENCE_CANDIDATES.map((candidate) => totalVotes * shares[candidate]),
    totalVotes,
  );
  return {
    harrisVotes: allocation[0],
    trumpVotes: allocation[1],
    steinVotes: allocation[2],
    oliverVotes: allocation[3],
    residualOtherVotes: allocation[4],
    totalVotes,
  };
}

function allocateCandidateVotesByUnit(
  units: readonly Pick<BehaviorModelUnit, "id">[],
  unitBallots: readonly number[],
  candidateVotes: DemographicCandidateVoteVector,
) {
  const remaining = [...unitBallots];
  const byCandidate = DEMOGRAPHIC_PREFERENCE_CANDIDATES.map((candidate, candidateIndex) => {
    const voteKey = `${candidate}Votes` as keyof DemographicCandidateVoteVector;
    if (candidateIndex === DEMOGRAPHIC_PREFERENCE_CANDIDATES.length - 1) {
      return [...remaining];
    }
    const allocation = allocateCanonicallyByUnit(
      units,
      unitBallots,
      remaining,
      candidateVotes[voteKey],
    );
    allocation.forEach((votes, unitIndex) => {
      remaining[unitIndex] -= votes;
    });
    return allocation;
  });
  return units.map((_, unitIndex): DemographicCandidateVoteVector => ({
    harrisVotes: byCandidate[0][unitIndex],
    trumpVotes: byCandidate[1][unitIndex],
    steinVotes: byCandidate[2][unitIndex],
    oliverVotes: byCandidate[3][unitIndex],
    residualOtherVotes: byCandidate[4][unitIndex],
    totalVotes: unitBallots[unitIndex],
  }));
}

function addDemographicCandidateVotes(
  target: DemographicCandidateVoteVector,
  addition: DemographicCandidateVoteVector,
) {
  target.harrisVotes += addition.harrisVotes;
  target.trumpVotes += addition.trumpVotes;
  target.steinVotes += addition.steinVotes;
  target.oliverVotes += addition.oliverVotes;
  target.residualOtherVotes += addition.residualOtherVotes;
  target.totalVotes += addition.totalVotes;
}

export function applyBehaviorScenario(
  baselineUnits: readonly BehaviorModelUnit[],
  settings: BehaviorScenarioSettings,
): BehaviorScenarioResult {
  if (!Number.isFinite(settings.turnoutIncreasePoints)
    || settings.turnoutIncreasePoints < 0
    || settings.turnoutIncreasePoints > 100) {
    throw new Error("Turnout increase must be between zero and 100 points");
  }
  if (!Number.isFinite(settings.addedVoterHarrisShare)
    || settings.addedVoterHarrisShare < 0
    || settings.addedVoterHarrisShare > 1) {
    throw new Error("Added-voter Harris share must be between zero and one");
  }
  if (!Number.isFinite(settings.preferenceShiftPoints)) {
    throw new Error("Preference shift must be finite");
  }
  if (!["stein", "oliver", "residual_other"].includes(settings.thirdPartyCandidate)) {
    throw new Error("Third-party candidate is invalid");
  }
  if (!Number.isFinite(settings.thirdPartyShiftPoints)) {
    throw new Error("Third-party shift must be finite");
  }
  if (!Number.isFinite(settings.thirdPartyHarrisExchangeShare)
    || settings.thirdPartyHarrisExchangeShare < 0
    || settings.thirdPartyHarrisExchangeShare > 1) {
    throw new Error("Third-party Harris exchange share must be between zero and one");
  }
  if (settings.thirdPartyGeographicAllocationProfile != null
    && ![
      THIRD_PARTY_GEOGRAPHIC_ALLOCATION_PROFILE,
      LEGACY_THIRD_PARTY_GEOGRAPHIC_ALLOCATION_PROFILE,
    ].includes(settings.thirdPartyGeographicAllocationProfile)) {
    throw new Error("Third-party geographic allocation profile is invalid");
  }

  const groupTurnoutPoints = demographicTurnoutSettings(settings);
  const customDemographicCandidateShares = demographicCandidateShares(settings);
  const demographicTurnoutRequested = DEMOGRAPHIC_GROUP_IDS.some(
    (groupId) => groupTurnoutPoints[groupId] > 0,
  );
  const demographicPreferenceRequested = Object.keys(
    customDemographicCandidateShares,
  ).length > 0;
  const hasDemographicComposition = baselineUnits.some(
    (unit) => unit.demographicComposition != null,
  );
  if ((demographicTurnoutRequested || demographicPreferenceRequested)
    && !hasDemographicComposition) {
    throw new Error("Group-specific demographic behavior is unavailable for this demographic foundation");
  }
  for (const unit of baselineUnits) {
    if (unit.demographicComposition == null) continue;
    const groupPopulation = DEMOGRAPHIC_GROUP_IDS.reduce(
      (sum, groupId) => sum + unit.demographicComposition![groupId],
      0,
    );
    if (!Number.isSafeInteger(groupPopulation) || groupPopulation < 0) {
      throw new Error(`${unit.id} demographic composition is invalid`);
    }
    if (unit.turnoutDenominator != null && groupPopulation !== unit.turnoutDenominator) {
      throw new Error(`${unit.id} demographic composition does not reconcile to its turnout denominator`);
    }
  }

  const baselineProfile = behaviorBaselineProfile(baselineUnits);
  const { denominator, capacity } = baselineProfile;
  const statewideRequestedVotes = Math.round(
    denominator * settings.turnoutIncreasePoints / 100,
  );
  const statewideAddedVotes = Math.min(statewideRequestedVotes, capacity);
  const statewideTurnoutAllocation = allocateCappedProportionally(
    baselineProfile.turnoutWeights,
    baselineProfile.turnoutCapacities,
    statewideAddedVotes,
  );
  const remainingTurnoutCapacities = baselineProfile.turnoutCapacities.map(
    (unitCapacity, index) => unitCapacity - statewideTurnoutAllocation[index],
  );
  const demographicTurnoutAllocation = baselineUnits.map(() => 0);
  const demographicTurnoutCandidateAllocation = baselineUnits.map(
    () => emptyDemographicCandidateVotes(),
  );
  const demographicTurnoutByUnit = baselineUnits.map(
    () => ({} as Partial<Record<DemographicGroupId, DemographicCandidateVoteVector>>),
  );
  const demographicGroups = DEMOGRAPHIC_GROUP_IDS.map((groupId) => {
    const increasePoints = groupTurnoutPoints[groupId];
    const weights = baselineUnits.map((unit) => unit.demographicComposition?.[groupId] ?? 0);
    const population = weights.reduce((sum, count) => sum + count, 0);
    const requestedVotes = Math.round(population * increasePoints / 100);
    const availableCapacity = remainingTurnoutCapacities.reduce(
      (sum, unitCapacity, index) => sum + (weights[index] > 0 ? unitCapacity : 0),
      0,
    );
    const addedVotes = Math.min(requestedVotes, availableCapacity);
    const customShares = customDemographicCandidateShares[groupId];
    const candidateShares = customShares ?? {
      harris: settings.addedVoterHarrisShare,
      trump: 1 - settings.addedVoterHarrisShare,
      stein: 0,
      oliver: 0,
      residualOther: 0,
    };
    const candidateVotes = splitDemographicCandidateVotes(addedVotes, candidateShares);
    if (addedVotes > 0) {
      const allocation = allocateCanonicallyByUnit(
        baselineUnits,
        weights,
        remainingTurnoutCapacities,
        addedVotes,
      );
      allocation.forEach((votes, index) => {
        demographicTurnoutAllocation[index] += votes;
        remainingTurnoutCapacities[index] -= votes;
      });
      const candidateAllocation = allocateCandidateVotesByUnit(
        baselineUnits,
        allocation,
        candidateVotes,
      );
      candidateAllocation.forEach((votes, index) => {
        if (votes.totalVotes === 0) return;
        demographicTurnoutByUnit[index][groupId] = votes;
        addDemographicCandidateVotes(demographicTurnoutCandidateAllocation[index], votes);
      });
    }
    const perThousand = splitDemographicCandidateVotes(1_000, candidateShares);
    return {
      groupId,
      increasePoints,
      population,
      requestedVotes,
      addedVotes,
      clippedVotes: requestedVotes - addedVotes,
      candidateShares,
      candidateShareMode: customShares
        ? "custom-five-candidate" as const
        : "shared-major-party" as const,
      candidateVotes,
      harrisTrumpMarginVotes: candidateVotes.harrisVotes - candidateVotes.trumpVotes,
      marginVotesPerThousandAdded: perThousand.harrisVotes - perThousand.trumpVotes,
    };
  });
  const demographicRequestedVotes = demographicGroups.reduce(
    (sum, group) => sum + group.requestedVotes,
    0,
  );
  const demographicAddedVotes = demographicGroups.reduce(
    (sum, group) => sum + group.addedVotes,
    0,
  );
  const requestedVotes = statewideRequestedVotes + demographicRequestedVotes;
  const addedVotes = statewideAddedVotes + demographicAddedVotes;
  const statewideHarrisTurnoutTotal = Math.round(
    statewideAddedVotes * settings.addedVoterHarrisShare,
  );
  const statewideHarrisTurnoutAllocation = allocateCanonicallyByUnit(
    baselineUnits,
    statewideTurnoutAllocation,
    statewideTurnoutAllocation,
    statewideHarrisTurnoutTotal,
  );
  const demographicCandidateTotals = demographicGroups.reduce(
    (sum, group) => {
      addDemographicCandidateVotes(sum, group.candidateVotes);
      return sum;
    },
    emptyDemographicCandidateVotes(),
  );
  const harrisTurnoutTotal = statewideHarrisTurnoutTotal
    + demographicCandidateTotals.harrisVotes;
  const trumpTurnoutTotal = statewideAddedVotes - statewideHarrisTurnoutTotal
    + demographicCandidateTotals.trumpVotes;
  const afterTurnout = baselineUnits.map((unit, index) => {
    const demographicVotes = demographicTurnoutCandidateAllocation[index];
    const statewideHarrisVotes = statewideHarrisTurnoutAllocation[index];
    const statewideTrumpVotes = statewideTurnoutAllocation[index] - statewideHarrisVotes;
    const turnoutAddedVotes = statewideTurnoutAllocation[index]
      + demographicVotes.totalVotes;
    const turnoutHarrisVotes = statewideHarrisVotes + demographicVotes.harrisVotes;
    const turnoutTrumpVotes = statewideTrumpVotes + demographicVotes.trumpVotes;
    const turnoutSteinVotes = demographicVotes.steinVotes;
    const turnoutOliverVotes = demographicVotes.oliverVotes;
    const turnoutResidualOtherVotes = demographicVotes.residualOtherVotes;
    const turnoutOtherVotes = turnoutSteinVotes + turnoutOliverVotes
      + turnoutResidualOtherVotes;
    return {
      ...unit,
      harrisVotes: unit.harrisVotes + turnoutHarrisVotes,
      trumpVotes: unit.trumpVotes + turnoutTrumpVotes,
      steinVotes: unit.steinVotes + turnoutSteinVotes,
      oliverVotes: unit.oliverVotes + turnoutOliverVotes,
      residualOtherVotes: unit.residualOtherVotes + turnoutResidualOtherVotes,
      otherVotes: unit.otherVotes + turnoutOtherVotes,
      totalVotes: unit.totalVotes + turnoutAddedVotes,
      turnoutAddedVotes,
      turnoutHarrisVotes,
      turnoutTrumpVotes,
      turnoutSteinVotes,
      turnoutOliverVotes,
      turnoutResidualOtherVotes,
      ...(demographicTurnoutRequested
        ? {
            demographicTurnoutAddedVotes: demographicTurnoutAllocation[index],
            demographicTurnoutByGroup: demographicTurnoutByUnit[index],
          }
        : {}),
    };
  });

  const scenarioBallots = afterTurnout.reduce((sum, unit) => sum + unit.totalVotes, 0);
  const requestedTransfer = Math.round(
    scenarioBallots * settings.preferenceShiftPoints / 200,
  );
  const afterPreference = applyTwoPartyVoteTransfer(afterTurnout, requestedTransfer);
  const preferenceRealizedTransfer = afterPreference.reduce(
    (sum, unit) => sum + unit.netHarrisGain,
    0,
  );
  const selectedVoteKey = thirdPartyVoteKey(settings.thirdPartyCandidate);
  const preThirdPartyTotals = {
    harrisVotes: 0,
    trumpVotes: 0,
    steinVotes: 0,
    oliverVotes: 0,
    residualOtherVotes: 0,
    totalVotes: 0,
  };
  for (const unit of afterPreference) {
    preThirdPartyTotals.harrisVotes += unit.harrisVotes;
    preThirdPartyTotals.trumpVotes += unit.trumpVotes;
    preThirdPartyTotals.steinVotes += unit.steinVotes;
    preThirdPartyTotals.oliverVotes += unit.oliverVotes;
    preThirdPartyTotals.residualOtherVotes += unit.residualOtherVotes;
    preThirdPartyTotals.totalVotes += unit.totalVotes;
  }
  const requestedCandidateDelta = Math.round(
    scenarioBallots * settings.thirdPartyShiftPoints / 100,
  );
  const harrisExchangeShare = settings.thirdPartyHarrisExchangeShare;
  const gainCapacity = thirdPartyGainCapacity(
    preThirdPartyTotals.harrisVotes,
    preThirdPartyTotals.trumpVotes,
    harrisExchangeShare,
  );
  const currentCandidateVotes = preThirdPartyTotals[selectedVoteKey];
  const realizedCandidateDelta = requestedCandidateDelta >= 0
    ? Math.min(requestedCandidateDelta, gainCapacity)
    : -Math.min(Math.abs(requestedCandidateDelta), currentCandidateVotes);

  let harrisVoteDelta = 0;
  let trumpVoteDelta = 0;
  let units: BehaviorScenarioUnit[];
  if (realizedCandidateDelta > 0) {
    const exchange = splitThirdPartyExchange(
      realizedCandidateDelta,
      harrisExchangeShare,
    );
    const harrisLossTotal = exchange.harrisVotes;
    const trumpLossTotal = exchange.trumpVotes;
    const harrisLossCapacities = afterPreference.map((unit) => unit.harrisVotes);
    const trumpLossCapacities = afterPreference.map((unit) => unit.trumpVotes);
    const useLegacyAllocation = settings.thirdPartyGeographicAllocationProfile
      === LEGACY_THIRD_PARTY_GEOGRAPHIC_ALLOCATION_PROFILE;
    const geographicAffinities = useLegacyAllocation
      ? null
      : thirdPartyGeographicAffinities(afterPreference, settings.thirdPartyCandidate);
    const harrisLosses = useLegacyAllocation
      ? allocateCappedProportionally(
        harrisLossCapacities,
        harrisLossCapacities,
        harrisLossTotal,
      )
      : allocateCanonicallyByUnit(
        afterPreference,
        geographicAffinities!.map((affinity, index) => affinity * harrisLossCapacities[index]),
        harrisLossCapacities,
        harrisLossTotal,
      );
    const trumpLosses = useLegacyAllocation
      ? allocateCappedProportionally(
        trumpLossCapacities,
        trumpLossCapacities,
        trumpLossTotal,
      )
      : allocateCanonicallyByUnit(
        afterPreference,
        geographicAffinities!.map((affinity, index) => affinity * trumpLossCapacities[index]),
        trumpLossCapacities,
        trumpLossTotal,
      );
    harrisVoteDelta = -harrisLossTotal;
    trumpVoteDelta = -trumpLossTotal;
    units = afterPreference.map((unit, index) => {
      const candidateGain = harrisLosses[index] + trumpLosses[index];
      const namedThirdPartyVotes = {
        steinVotes: unit.steinVotes,
        oliverVotes: unit.oliverVotes,
        residualOtherVotes: unit.residualOtherVotes,
        [selectedVoteKey]: unit[selectedVoteKey] + candidateGain,
      };
      return {
        ...unit,
        ...namedThirdPartyVotes,
        harrisVotes: unit.harrisVotes - harrisLosses[index],
        trumpVotes: unit.trumpVotes - trumpLosses[index],
        otherVotes: unit.otherVotes + candidateGain,
        preferenceNetHarrisGain: unit.netHarrisGain,
        thirdPartyCandidateDelta: candidateGain,
        netHarrisGain:
          unit.harrisVotes - harrisLosses[index] - baselineUnits[index].harrisVotes,
      };
    });
  } else if (realizedCandidateDelta < 0) {
    const releasedVotes = Math.abs(realizedCandidateDelta);
    const selectedCandidateVotes = afterPreference.map((unit) => unit[selectedVoteKey]);
    const useLegacyAllocation = settings.thirdPartyGeographicAllocationProfile
      === LEGACY_THIRD_PARTY_GEOGRAPHIC_ALLOCATION_PROFILE;
    const candidateLosses = useLegacyAllocation
      ? allocateCappedProportionally(
        selectedCandidateVotes,
        selectedCandidateVotes,
        releasedVotes,
      )
      : allocateCanonicallyByUnit(
        afterPreference,
        selectedCandidateVotes,
        selectedCandidateVotes,
        releasedVotes,
      );
    const harrisGainTotal = splitThirdPartyExchange(
      releasedVotes,
      harrisExchangeShare,
    ).harrisVotes;
    const harrisGains = useLegacyAllocation
      ? allocateCappedProportionally(candidateLosses, candidateLosses, harrisGainTotal)
      : allocateCanonicallyByUnit(
        afterPreference,
        candidateLosses,
        candidateLosses,
        harrisGainTotal,
      );
    harrisVoteDelta = harrisGainTotal;
    trumpVoteDelta = releasedVotes - harrisGainTotal;
    units = afterPreference.map((unit, index) => {
      const candidateLoss = candidateLosses[index];
      const trumpGain = candidateLoss - harrisGains[index];
      const namedThirdPartyVotes = {
        steinVotes: unit.steinVotes,
        oliverVotes: unit.oliverVotes,
        residualOtherVotes: unit.residualOtherVotes,
        [selectedVoteKey]: unit[selectedVoteKey] - candidateLoss,
      };
      return {
        ...unit,
        ...namedThirdPartyVotes,
        harrisVotes: unit.harrisVotes + harrisGains[index],
        trumpVotes: unit.trumpVotes + trumpGain,
        otherVotes: unit.otherVotes - candidateLoss,
        preferenceNetHarrisGain: unit.netHarrisGain,
        thirdPartyCandidateDelta: -candidateLoss,
        netHarrisGain:
          unit.harrisVotes + harrisGains[index] - baselineUnits[index].harrisVotes,
      };
    });
  } else {
    units = afterPreference.map((unit, index) => ({
      ...unit,
      preferenceNetHarrisGain: unit.netHarrisGain,
      thirdPartyCandidateDelta: 0,
      netHarrisGain: unit.harrisVotes - baselineUnits[index].harrisVotes,
    }));
  }
  const totals = {
    harrisVotes: 0,
    trumpVotes: 0,
    steinVotes: 0,
    oliverVotes: 0,
    residualOtherVotes: 0,
    otherVotes: 0,
    totalVotes: 0,
  };
  for (const unit of units) {
    totals.harrisVotes += unit.harrisVotes;
    totals.trumpVotes += unit.trumpVotes;
    totals.steinVotes += unit.steinVotes;
    totals.oliverVotes += unit.oliverVotes;
    totals.residualOtherVotes += unit.residualOtherVotes;
    totals.otherVotes += unit.otherVotes;
    totals.totalVotes += unit.totalVotes;
  }

  for (const unit of units) {
    if ([
      unit.harrisVotes,
      unit.trumpVotes,
      unit.steinVotes,
      unit.oliverVotes,
      unit.residualOtherVotes,
      unit.otherVotes,
      unit.totalVotes,
    ].some((votes) => !Number.isSafeInteger(votes) || votes < 0)) {
      throw new Error(`${unit.id} scenario contains invalid candidate votes`);
    }
    if (unit.steinVotes + unit.oliverVotes + unit.residualOtherVotes !== unit.otherVotes
      || unit.harrisVotes + unit.trumpVotes + unit.otherVotes !== unit.totalVotes) {
      throw new Error(`${unit.id} scenario votes do not reconcile`);
    }
  }

  return {
    units,
    totals,
    turnout: {
      requestedVotes,
      addedVotes,
      harrisVotes: harrisTurnoutTotal,
      trumpVotes: trumpTurnoutTotal,
      steinVotes: demographicCandidateTotals.steinVotes,
      oliverVotes: demographicCandidateTotals.oliverVotes,
      residualOtherVotes: demographicCandidateTotals.residualOtherVotes,
      otherVotes: demographicCandidateTotals.steinVotes
        + demographicCandidateTotals.oliverVotes
        + demographicCandidateTotals.residualOtherVotes,
      denominator,
      capacity,
    },
    demographicTurnout: {
      status: !demographicTurnoutRequested
        ? "not_requested"
        : hasDemographicComposition
          ? "applied"
          : "unavailable",
      requestedVotes: demographicRequestedVotes,
      addedVotes: demographicAddedVotes,
      groups: demographicGroups,
    },
    preference: { requestedTransfer, realizedTransfer: preferenceRealizedTransfer },
    thirdParty: {
      candidate: settings.thirdPartyCandidate,
      startingCandidateVotes: currentCandidateVotes,
      exchangeCapacity: gainCapacity,
      ballotTotal: scenarioBallots,
      requestedCandidateDelta,
      realizedCandidateDelta,
      harrisVoteDelta,
      trumpVoteDelta,
    },
  };
}

export function applyTwoPartyVoteTransfer<T extends TwoPartyResult>(
  results: readonly T[],
  signedTransferTowardHarris: number,
): Array<T & { netHarrisGain: number }> {
  if (!Number.isSafeInteger(signedTransferTowardHarris)) {
    throw new Error("Two-party vote transfer must be a safe integer");
  }

  const towardHarris = signedTransferTowardHarris >= 0;
  const requestedTransfer = Math.abs(signedTransferTowardHarris);
  const availableByResult = results.map((result) => (
    towardHarris ? result.trumpVotes : result.harrisVotes
  ));
  const availableTotal = availableByResult.reduce((sum, votes) => sum + votes, 0);
  const transfer = Math.min(requestedTransfer, availableTotal);
  const allocation = largestRemainder(
    availableTotal === 0
      ? results.map(() => 0)
      : availableByResult.map((votes) => (votes / availableTotal) * transfer),
    transfer,
  );

  return results.map((result, index) => {
    const netHarrisGain = towardHarris ? allocation[index] : -allocation[index];
    return {
      ...result,
      harrisVotes: result.harrisVotes + netHarrisGain,
      trumpVotes: result.trumpVotes - netHarrisGain,
      netHarrisGain,
    };
  });
}

export function aggregateNational(
  states: readonly StatewidePresidentialResult[],
): NationalPresidentialResult {
  return states.reduce<NationalPresidentialResult>(
    (total, state) => ({
      totalVotes: total.totalVotes + state.totalVotes,
      harrisVotes: total.harrisVotes + state.harrisVotes,
      trumpVotes: total.trumpVotes + state.trumpVotes,
      steinVotes: total.steinVotes + (state.steinVotes ?? 0),
      oliverVotes: total.oliverVotes + (state.oliverVotes ?? 0),
      residualOtherVotes: total.residualOtherVotes + (state.residualOtherVotes
        ?? Math.max(0, state.otherVotes - (state.steinVotes ?? 0) - (state.oliverVotes ?? 0))),
      otherVotes: total.otherVotes + state.otherVotes,
      harrisElectoralVotes: total.harrisElectoralVotes + state.harrisElectoralVotes,
      trumpElectoralVotes: total.trumpElectoralVotes + state.trumpElectoralVotes,
      otherElectoralVotes: total.otherElectoralVotes + (state.otherElectoralVotes ?? 0),
    }),
    {
      totalVotes: 0,
      harrisVotes: 0,
      trumpVotes: 0,
      steinVotes: 0,
      oliverVotes: 0,
      residualOtherVotes: 0,
      otherVotes: 0,
      harrisElectoralVotes: 0,
      trumpElectoralVotes: 0,
      otherElectoralVotes: 0,
    },
  );
}

export function applyTwoPartyMarginShift(
  result: StatewidePresidentialResult,
  shiftTowardHarrisPoints: number,
): StatewidePresidentialResult {
  if (!Number.isFinite(shiftTowardHarrisPoints)) {
    throw new Error("Margin shift must be finite");
  }

  const requestedTransfer = Math.round(
    (result.totalVotes * shiftTowardHarrisPoints) / 200,
  );
  const transfer = Math.max(
    -result.harrisVotes,
    Math.min(result.trumpVotes, requestedTransfer),
  );
  const harrisVotes = result.harrisVotes + transfer;
  const trumpVotes = result.trumpVotes - transfer;
  const electoralVotes = stateElectoralVotes(result);
  const allocation = electoralAllocationForResult({ ...result, harrisVotes, trumpVotes }, electoralVotes);

  return {
    ...result,
    harrisVotes,
    trumpVotes,
    ...allocation,
  };
}

export function applyCountyTwoPartyMarginShift(
  counties: readonly CountyPresidentialResult[],
  statewideResult: StatewidePresidentialResult,
  shiftTowardHarrisPoints: number,
): CountyScenarioResult[] {
  if (!Number.isFinite(shiftTowardHarrisPoints)) {
    throw new Error("Margin shift must be finite");
  }

  const requestedTransfer = Math.round(
    Math.abs((statewideResult.totalVotes * shiftTowardHarrisPoints) / 200),
  );
  const signedTransfer = shiftTowardHarrisPoints >= 0
    ? requestedTransfer
    : -requestedTransfer;
  return applyTwoPartyVoteTransfer(counties, signedTransfer);
}

export function toReportingUnitResult(
  result: StatewidePresidentialResult,
): ReportingUnitResult {
  const votes: CandidateVotes[] = [
    { candidateId: "harris", partyId: "democratic", votes: result.harrisVotes },
    { candidateId: "trump", partyId: "republican", votes: result.trumpVotes },
    { candidateId: "other", partyId: null, votes: result.otherVotes },
  ];
  const unit: ReportingUnitResult = {
    reportingUnitId: `state-${result.code.toLowerCase()}`,
    contestId: "2024-president",
    votes,
    totalVotes: result.totalVotes,
    ballotMode: null,
  };
  assertResultReconciles(unit);
  return unit;
}
