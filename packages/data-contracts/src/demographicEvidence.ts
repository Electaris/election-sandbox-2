export const DEMOGRAPHIC_EVIDENCE_SCHEMA_VERSION = "sandbox-demographic-evidence-v1" as const;
export const DEMOGRAPHIC_EVIDENCE_INVENTORY_SCHEMA_VERSION =
  "sandbox-demographic-evidence-inventory-v1" as const;

export const DEMOGRAPHIC_GROUP_IDS = [
  "hispanic_any_race",
  "non_hispanic_white",
  "non_hispanic_black",
  "non_hispanic_asian",
  "non_hispanic_other",
] as const;

export const ADMITTED_DEMOGRAPHIC_STATE_CODES = ["MI", "PA", "WI"] as const;

export type DemographicGroupId = typeof DEMOGRAPHIC_GROUP_IDS[number];
export type AdmittedDemographicStateCode = typeof ADMITTED_DEMOGRAPHIC_STATE_CODES[number];
export type DemographicCompositionStatus = "available" | "unavailable";
export type DemographicCompositionQuality =
  | "official_census_tabulation"
  | "mixed_census_and_deterministic_allocation"
  | "unavailable";
export type DemographicGeographyAlignment =
  | "exact_source_geography"
  | "deterministic_cross_vintage_bridge"
  | "official_population_reconstruction";
export type DemographicUnitMethod =
  | "direct_census_vtd"
  | "registered_voter_weighted_vtd_split"
  | "official_ltsb_2020_vap_estimate"
  | "unavailable";

export interface DemographicGroupCounts {
  hispanic_any_race: number;
  non_hispanic_white: number;
  non_hispanic_black: number;
  non_hispanic_asian: number;
  non_hispanic_other: number;
}

export interface DemographicEvidenceContract {
  schemaVersion: typeof DEMOGRAPHIC_EVIDENCE_SCHEMA_VERSION;
  stateCode: AdmittedDemographicStateCode;
  electionId: string;
  sourceIds: readonly string[];
  transformVersion: string;
  geography: {
    mapUnit: "vtd" | "precinct" | "ward";
    sourceUnit: "census_vtd" | "ltsb_ward_estimate";
    mapVintage: string;
    demographicVintage: string;
    electionVintage: string;
    alignment: DemographicGeographyAlignment;
  };
  denominator: {
    measure: "population_age_18_plus";
    sourceTable: string;
    statewidePopulation: number;
    modeledPopulation: number;
    isCitizenVotingAgePopulation: false;
    isElectionYearEligibleVoterEstimate: false;
  };
  composition: {
    status: DemographicCompositionStatus;
    quality: DemographicCompositionQuality;
    groups: readonly DemographicGroupId[];
    statewideCounts: DemographicGroupCounts | null;
    modeledCounts: DemographicGroupCounts | null;
  };
  crosswalk: {
    methods: readonly {
      method: DemographicUnitMethod;
      unitCount: number;
    }[];
  };
  coverage: {
    terrainUnitCount: number;
    resultLinkedUnitCount: number;
    noMappedResultUnitCount: number;
    denominatorObservedUnitCount: number;
    denominatorUnavailableUnitCount: number;
    turnoutReadyUnitCount: number;
    turnoutCappedUnitCount: number;
    turnoutUnavailableResultLinkedUnitCount: number;
    compositionObservedUnitCount: number;
    compositionUnavailableUnitCount: number;
    offMapElectionUnitCount: number;
  };
  capability: {
    aggregateCompositionAvailable: boolean;
    futureGroupTurnoutAssumptionsEligible: boolean;
    futureGroupPreferenceAssumptionsEligible: boolean;
    voteMutationAuthorized: false;
  };
  inferenceBoundary: {
    observedAggregatePopulationComposition: boolean;
    observedIndividualTurnout: false;
    observedIndividualCandidatePreference: false;
    groupTurnoutMustBeUserAuthored: true;
    groupCandidatePreferenceMustBeUserAuthored: true;
    ecologicalInferenceAllowed: false;
  };
  limitations: readonly string[];
}

export interface DemographicEvidenceInventory {
  schemaVersion: typeof DEMOGRAPHIC_EVIDENCE_INVENTORY_SCHEMA_VERSION;
  contracts: readonly DemographicEvidenceContract[];
}

export type CreateDemographicEvidenceContractInput = Omit<
  DemographicEvidenceContract,
  "schemaVersion"
>;

function requireNonemptyText(value: string, label: string) {
  if (typeof value !== "string" || value.normalize("NFC").trim().length === 0) {
    throw new Error(`${label} must be nonempty`);
  }
  return value.normalize("NFC").trim();
}

function requireNonnegativeInteger(value: number, label: string) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative safe integer`);
  }
  return value;
}

function deepFreeze<T>(value: T): T {
  if (value != null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

function normalizeUniqueStrings(values: readonly string[], label: string) {
  if (!Array.isArray(values) || values.length === 0) throw new Error(`${label} must not be empty`);
  const normalized = values.map((value) => requireNonemptyText(value, label)).sort();
  if (new Set(normalized).size !== normalized.length) throw new Error(`${label} contains duplicates`);
  return normalized;
}

function normalizeCounts(counts: DemographicGroupCounts, label: string): DemographicGroupCounts {
  return {
    hispanic_any_race: requireNonnegativeInteger(counts.hispanic_any_race, `${label} Hispanic count`),
    non_hispanic_white: requireNonnegativeInteger(counts.non_hispanic_white, `${label} White count`),
    non_hispanic_black: requireNonnegativeInteger(counts.non_hispanic_black, `${label} Black count`),
    non_hispanic_asian: requireNonnegativeInteger(counts.non_hispanic_asian, `${label} Asian count`),
    non_hispanic_other: requireNonnegativeInteger(counts.non_hispanic_other, `${label} Other count`),
  };
}

function sumCounts(counts: DemographicGroupCounts) {
  return DEMOGRAPHIC_GROUP_IDS.reduce((sum, group) => sum + counts[group], 0);
}

function stableSerializeValue(value: unknown, path = "$root"): string {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") return JSON.stringify(value.normalize("NFC"));
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) throw new Error(`${path} must contain safe integers`);
    return String(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry, index) => stableSerializeValue(entry, `${path}[${index}]`)).join(",")}]`;
  }
  if (value == null || typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype) {
    throw new Error(`${path} must contain only plain contract values`);
  }
  const entries = Object.entries(value as Record<string, unknown>)
    .map(([key, entry]) => [key.normalize("NFC"), entry] as const)
    .sort(([left], [right]) => left.localeCompare(right));
  if (new Set(entries.map(([key]) => key)).size !== entries.length) {
    throw new Error(`${path} contains duplicate normalized keys`);
  }
  return `{${entries.map(([key, entry]) => (
    `${JSON.stringify(key)}:${stableSerializeValue(entry, `${path}.${key}`)}`
  )).join(",")}}`;
}

export function createDemographicEvidenceContract(
  input: CreateDemographicEvidenceContractInput,
): DemographicEvidenceContract {
  if (!ADMITTED_DEMOGRAPHIC_STATE_CODES.includes(input.stateCode)) {
    throw new Error(`State ${String(input.stateCode)} is not admitted to the demographic contract`);
  }
  if (!(["vtd", "precinct", "ward"] as const).includes(input.geography.mapUnit)) {
    throw new Error("Demographic map unit is invalid");
  }
  if (!(["census_vtd", "ltsb_ward_estimate"] as const).includes(input.geography.sourceUnit)) {
    throw new Error("Demographic source unit is invalid");
  }
  if (!([
    "exact_source_geography",
    "deterministic_cross_vintage_bridge",
    "official_population_reconstruction",
  ] as const).includes(input.geography.alignment)) {
    throw new Error("Demographic geography alignment is invalid");
  }
  if (input.denominator.measure !== "population_age_18_plus") {
    throw new Error("Only population age 18 and over is admitted as the current denominator");
  }
  if (input.denominator.isCitizenVotingAgePopulation !== false
    || input.denominator.isElectionYearEligibleVoterEstimate !== false) {
    throw new Error("The current denominator cannot claim CVAP or election-year eligibility");
  }

  const statewidePopulation = requireNonnegativeInteger(
    input.denominator.statewidePopulation,
    "Statewide denominator",
  );
  const modeledPopulation = requireNonnegativeInteger(
    input.denominator.modeledPopulation,
    "Modeled denominator",
  );
  if (modeledPopulation > statewidePopulation) {
    throw new Error("Modeled denominator cannot exceed the statewide denominator");
  }

  const terrainUnitCount = requireNonnegativeInteger(input.coverage.terrainUnitCount, "Terrain units");
  const resultLinkedUnitCount = requireNonnegativeInteger(
    input.coverage.resultLinkedUnitCount,
    "Result-linked units",
  );
  const noMappedResultUnitCount = requireNonnegativeInteger(
    input.coverage.noMappedResultUnitCount,
    "No-result units",
  );
  const denominatorObservedUnitCount = requireNonnegativeInteger(
    input.coverage.denominatorObservedUnitCount,
    "Observed-denominator units",
  );
  const denominatorUnavailableUnitCount = requireNonnegativeInteger(
    input.coverage.denominatorUnavailableUnitCount,
    "Unavailable-denominator units",
  );
  const turnoutReadyUnitCount = requireNonnegativeInteger(
    input.coverage.turnoutReadyUnitCount,
    "Turnout-ready units",
  );
  const turnoutCappedUnitCount = requireNonnegativeInteger(
    input.coverage.turnoutCappedUnitCount,
    "Turnout-capped units",
  );
  const turnoutUnavailableResultLinkedUnitCount = requireNonnegativeInteger(
    input.coverage.turnoutUnavailableResultLinkedUnitCount,
    "Turnout-unavailable result-linked units",
  );
  const compositionObservedUnitCount = requireNonnegativeInteger(
    input.coverage.compositionObservedUnitCount,
    "Composition-observed units",
  );
  const compositionUnavailableUnitCount = requireNonnegativeInteger(
    input.coverage.compositionUnavailableUnitCount,
    "Composition-unavailable units",
  );
  const offMapElectionUnitCount = requireNonnegativeInteger(
    input.coverage.offMapElectionUnitCount,
    "Off-map election units",
  );

  if (resultLinkedUnitCount + noMappedResultUnitCount !== terrainUnitCount) {
    throw new Error("Result-linked and no-result terrain counts must reconcile");
  }
  if (denominatorObservedUnitCount + denominatorUnavailableUnitCount !== terrainUnitCount) {
    throw new Error("Observed and unavailable denominator counts must reconcile");
  }
  if (turnoutReadyUnitCount + turnoutCappedUnitCount
    + turnoutUnavailableResultLinkedUnitCount !== resultLinkedUnitCount) {
    throw new Error("Turnout-ready, capped, and unavailable result-linked counts must reconcile");
  }
  if (turnoutUnavailableResultLinkedUnitCount > denominatorUnavailableUnitCount) {
    throw new Error("Unavailable result-linked turnout count exceeds unavailable denominators");
  }
  if (compositionObservedUnitCount + compositionUnavailableUnitCount !== terrainUnitCount) {
    throw new Error("Observed and unavailable composition counts must reconcile");
  }

  const methods = [...input.crosswalk.methods]
    .map((entry) => {
      if (!([
        "direct_census_vtd",
        "registered_voter_weighted_vtd_split",
        "official_ltsb_2020_vap_estimate",
        "unavailable",
      ] as const).includes(entry.method)) {
        throw new Error(`Unsupported demographic unit method ${String(entry.method)}`);
      }
      return {
        method: entry.method,
        unitCount: requireNonnegativeInteger(entry.unitCount, `${entry.method} unit count`),
      };
    })
    .sort((left, right) => left.method.localeCompare(right.method));
  if (new Set(methods.map((entry) => entry.method)).size !== methods.length) {
    throw new Error("Demographic unit methods contain duplicates");
  }
  if (methods.reduce((sum, entry) => sum + entry.unitCount, 0) !== terrainUnitCount) {
    throw new Error("Demographic unit methods must reconcile to terrain units");
  }

  const compositionAvailable = input.composition.status === "available";
  if (compositionAvailable !== input.capability.aggregateCompositionAvailable
    || compositionAvailable !== input.inferenceBoundary.observedAggregatePopulationComposition) {
    throw new Error("Composition status and aggregate-composition capability disagree");
  }
  if (input.capability.futureGroupTurnoutAssumptionsEligible !== compositionAvailable
    || input.capability.futureGroupPreferenceAssumptionsEligible !== compositionAvailable) {
    throw new Error("Group behavior assumptions require available aggregate composition");
  }
  if (input.capability.voteMutationAuthorized !== false) {
    throw new Error("v0.28A demographic contracts cannot authorize vote mutation");
  }
  if (input.inferenceBoundary.observedIndividualTurnout !== false
    || input.inferenceBoundary.observedIndividualCandidatePreference !== false
    || input.inferenceBoundary.groupTurnoutMustBeUserAuthored !== true
    || input.inferenceBoundary.groupCandidatePreferenceMustBeUserAuthored !== true
    || input.inferenceBoundary.ecologicalInferenceAllowed !== false) {
    throw new Error("Demographic inference boundary is incompatible with v0.28A");
  }

  let statewideCounts: DemographicGroupCounts | null = null;
  let modeledCounts: DemographicGroupCounts | null = null;
  let groups: readonly DemographicGroupId[] = [];
  if (compositionAvailable) {
    if (input.composition.quality === "unavailable"
      || !input.composition.statewideCounts
      || !input.composition.modeledCounts
      || stableSerializeValue(input.composition.groups) !== stableSerializeValue(DEMOGRAPHIC_GROUP_IDS)) {
      throw new Error("Available composition requires the complete canonical group contract");
    }
    statewideCounts = normalizeCounts(input.composition.statewideCounts, "Statewide composition");
    modeledCounts = normalizeCounts(input.composition.modeledCounts, "Modeled composition");
    if (sumCounts(statewideCounts) !== statewidePopulation) {
      throw new Error("Statewide demographic groups must reconcile to statewide VAP");
    }
    if (sumCounts(modeledCounts) !== modeledPopulation) {
      throw new Error("Modeled demographic groups must reconcile to modeled VAP");
    }
    if (compositionObservedUnitCount !== denominatorObservedUnitCount) {
      throw new Error("Current available composition must cover every observed denominator unit");
    }
    groups = [...DEMOGRAPHIC_GROUP_IDS];
  } else {
    if (input.composition.quality !== "unavailable"
      || input.composition.statewideCounts !== null
      || input.composition.modeledCounts !== null
      || input.composition.groups.length !== 0
      || compositionObservedUnitCount !== 0) {
      throw new Error("Unavailable composition cannot carry group counts or observed units");
    }
  }

  return deepFreeze({
    schemaVersion: DEMOGRAPHIC_EVIDENCE_SCHEMA_VERSION,
    stateCode: input.stateCode,
    electionId: requireNonemptyText(input.electionId, "Election identity"),
    sourceIds: normalizeUniqueStrings(input.sourceIds, "Demographic source identities"),
    transformVersion: requireNonemptyText(input.transformVersion, "Demographic transform version"),
    geography: {
      mapUnit: input.geography.mapUnit,
      sourceUnit: input.geography.sourceUnit,
      mapVintage: requireNonemptyText(input.geography.mapVintage, "Map vintage"),
      demographicVintage: requireNonemptyText(
        input.geography.demographicVintage,
        "Demographic vintage",
      ),
      electionVintage: requireNonemptyText(input.geography.electionVintage, "Election vintage"),
      alignment: input.geography.alignment,
    },
    denominator: {
      measure: "population_age_18_plus",
      sourceTable: requireNonemptyText(input.denominator.sourceTable, "Denominator source table"),
      statewidePopulation,
      modeledPopulation,
      isCitizenVotingAgePopulation: false,
      isElectionYearEligibleVoterEstimate: false,
    },
    composition: {
      status: input.composition.status,
      quality: input.composition.quality,
      groups,
      statewideCounts,
      modeledCounts,
    },
    crosswalk: { methods },
    coverage: {
      terrainUnitCount,
      resultLinkedUnitCount,
      noMappedResultUnitCount,
      denominatorObservedUnitCount,
      denominatorUnavailableUnitCount,
      turnoutReadyUnitCount,
      turnoutCappedUnitCount,
      turnoutUnavailableResultLinkedUnitCount,
      compositionObservedUnitCount,
      compositionUnavailableUnitCount,
      offMapElectionUnitCount,
    },
    capability: {
      aggregateCompositionAvailable: compositionAvailable,
      futureGroupTurnoutAssumptionsEligible: compositionAvailable,
      futureGroupPreferenceAssumptionsEligible: compositionAvailable,
      voteMutationAuthorized: false,
    },
    inferenceBoundary: {
      observedAggregatePopulationComposition: compositionAvailable,
      observedIndividualTurnout: false,
      observedIndividualCandidatePreference: false,
      groupTurnoutMustBeUserAuthored: true,
      groupCandidatePreferenceMustBeUserAuthored: true,
      ecologicalInferenceAllowed: false,
    },
    limitations: normalizeUniqueStrings(input.limitations, "Demographic limitations"),
  });
}

export function validateDemographicEvidenceContract(contract: DemographicEvidenceContract) {
  if (contract.schemaVersion !== DEMOGRAPHIC_EVIDENCE_SCHEMA_VERSION) {
    throw new Error(`Unsupported demographic evidence schema ${String(contract.schemaVersion)}`);
  }
  const recreated = createDemographicEvidenceContract(contract);
  if (stableSerializeValue(recreated) !== stableSerializeValue(contract)) {
    throw new Error("Demographic evidence contains noncanonical or unknown content");
  }
  return recreated;
}

export function createDemographicEvidenceInventory(
  contracts: readonly DemographicEvidenceContract[],
): DemographicEvidenceInventory {
  const validated = contracts.map(validateDemographicEvidenceContract)
    .sort((left, right) => left.stateCode.localeCompare(right.stateCode));
  if (new Set(validated.map((contract) => contract.stateCode)).size !== validated.length) {
    throw new Error("Demographic inventory contains duplicate states");
  }
  if (stableSerializeValue(validated.map((contract) => contract.stateCode))
    !== stableSerializeValue(ADMITTED_DEMOGRAPHIC_STATE_CODES)) {
    throw new Error("Demographic inventory must contain exactly admitted PA, MI, and WI contracts");
  }
  return deepFreeze({
    schemaVersion: DEMOGRAPHIC_EVIDENCE_INVENTORY_SCHEMA_VERSION,
    contracts: validated,
  });
}

export function serializeDemographicEvidenceInventory(inventory: DemographicEvidenceInventory) {
  return stableSerializeValue(createDemographicEvidenceInventory(inventory.contracts));
}

export function deserializeDemographicEvidenceInventory(serialized: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    throw new Error("Demographic evidence inventory is not valid JSON");
  }
  if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Demographic evidence inventory must be an object");
  }
  const record = parsed as Record<string, unknown>;
  if (record.schemaVersion !== DEMOGRAPHIC_EVIDENCE_INVENTORY_SCHEMA_VERSION
    || !Array.isArray(record.contracts)) {
    throw new Error("Demographic evidence inventory schema is incompatible");
  }
  const inventory = createDemographicEvidenceInventory(
    record.contracts as DemographicEvidenceContract[],
  );
  if (stableSerializeValue(inventory) !== stableSerializeValue(parsed)) {
    throw new Error("Demographic evidence inventory contains noncanonical or unknown content");
  }
  return inventory;
}
