import {
  DEMOGRAPHIC_GROUP_IDS,
  type DemographicGroupCounts,
} from "./demographicEvidence.ts";

export const PRECINCT_DEMOGRAPHIC_ARTIFACT_SCHEMA_VERSION =
  "sandbox-precinct-demographic-artifact-v1" as const;
export const BLOCK_ALLOCATION_TRACE_SCHEMA_VERSION =
  "sandbox-block-allocation-trace-v1" as const;
export const PRECINCT_DEMOGRAPHIC_BUNDLE_SCHEMA_VERSION =
  "sandbox-precinct-demographic-bundle-v1" as const;

export const BLOCK_ALLOCATION_METHODS = [
  "whole_block_containment",
  "census_internal_point",
  "population_weighted_split",
  "housing_weighted_split",
] as const;

export const BLOCK_UNAVAILABLE_REASONS = [
  "no_compatible_geometry",
  "invalid_source_geometry",
  "county_boundary_conflict",
  "zero_information_split",
] as const;

export type BlockAllocationMethod = typeof BLOCK_ALLOCATION_METHODS[number];
export type BlockUnavailableReason = typeof BLOCK_UNAVAILABLE_REASONS[number];
export type PrecinctDemographicMapUnit = "precinct" | "ward" | "vtd";
export type PrecinctDemographicUnitQuality =
  | "direct_block_assignment"
  | "deterministic_population_split"
  | "mixed"
  | "unavailable";

export interface VotingAgePopulationProfile extends DemographicGroupCounts {
  totalVotingAgePopulation: number;
}

export interface PrecinctDemographicUnit {
  unitId: string;
  countyFips: string;
  geometryId: string;
  status: "available" | "unavailable";
  quality: PrecinctDemographicUnitQuality;
  allocationMethods: readonly BlockAllocationMethod[];
  sourceBlockCount: number;
  splitSourceBlockCount: number;
  profile: VotingAgePopulationProfile | null;
}

export interface PrecinctDemographicArtifact {
  schemaVersion: typeof PRECINCT_DEMOGRAPHIC_ARTIFACT_SCHEMA_VERSION;
  artifactId: string;
  stateCode: string;
  stateFips: string;
  electionId: string;
  transformVersion: string;
  source: {
    demographicSourceId: string;
    precinctGeometrySourceId: string;
    electionResultSourceId: string;
    demographicVintage: string;
    mapVintage: string;
    electionVintage: string;
    sourceTable: string;
    checksums: {
      demographic: string;
      precinctGeometry: string;
      electionResults: string;
    };
  };
  geography: {
    mapUnit: PrecinctDemographicMapUnit;
    countyBoundaryPolicy: "strict_no_cross_county_allocation";
    allocationProfileId: string;
  };
  statewide: {
    sourceProfile: VotingAgePopulationProfile;
    modeledProfile: VotingAgePopulationProfile;
    unavailableProfile: VotingAgePopulationProfile;
  };
  coverage: {
    sourceBlockCount: number;
    allocatedBlockCount: number;
    unavailableBlockCount: number;
    splitBlockCount: number;
    mapUnitCount: number;
    availableMapUnitCount: number;
    unavailableMapUnitCount: number;
    offMapElectionUnitCount: number;
  };
  allocationMethods: readonly {
    method: BlockAllocationMethod;
    blockCount: number;
    allocatedVotingAgePopulation: number;
  }[];
  units: readonly PrecinctDemographicUnit[];
  inferenceBoundary: {
    aggregatePopulationOnly: true;
    observedIndividualTurnout: false;
    observedIndividualCandidatePreference: false;
    ecologicalInferenceAllowed: false;
  };
  limitations: readonly string[];
}

export interface BlockAllocationTarget {
  unitId: string;
  profile: VotingAgePopulationProfile;
  evidenceWeight: {
    numerator: number;
    denominator: number;
  } | null;
}

export interface BlockAllocationTraceRecord {
  blockGeoid: string;
  countyFips: string;
  sourceProfile: VotingAgePopulationProfile;
  disposition: "allocated" | "unavailable";
  method: BlockAllocationMethod | null;
  unavailableReason: BlockUnavailableReason | null;
  allocations: readonly BlockAllocationTarget[];
}

export interface BlockAllocationTraceArtifact {
  schemaVersion: typeof BLOCK_ALLOCATION_TRACE_SCHEMA_VERSION;
  artifactId: string;
  transformVersion: string;
  blocks: readonly BlockAllocationTraceRecord[];
}

export interface PrecinctDemographicBundle {
  schemaVersion: typeof PRECINCT_DEMOGRAPHIC_BUNDLE_SCHEMA_VERSION;
  artifact: PrecinctDemographicArtifact;
  trace: BlockAllocationTraceArtifact;
}

export type CreatePrecinctDemographicArtifactInput = Omit<
  PrecinctDemographicArtifact,
  "schemaVersion"
>;
export type CreateBlockAllocationTraceInput = Omit<
  BlockAllocationTraceArtifact,
  "schemaVersion"
>;

const DIRECT_METHODS = new Set<BlockAllocationMethod>([
  "whole_block_containment",
  "census_internal_point",
]);
const SPLIT_METHODS = new Set<BlockAllocationMethod>([
  "population_weighted_split",
  "housing_weighted_split",
]);

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

function requirePositiveInteger(value: number, label: string) {
  const normalized = requireNonnegativeInteger(value, label);
  if (normalized === 0) throw new Error(`${label} must be positive`);
  return normalized;
}

function requireStateCode(value: string) {
  if (!/^[A-Z]{2}$/.test(value)) throw new Error("State code must be two uppercase letters");
  return value;
}

function requireStateFips(value: string) {
  if (!/^\d{2}$/.test(value)) throw new Error("State FIPS must contain two digits");
  return value;
}

function requireCountyFips(value: string, stateFips: string, label: string) {
  if (!/^\d{5}$/.test(value) || !value.startsWith(stateFips)) {
    throw new Error(`${label} must be a five-digit FIPS inside state ${stateFips}`);
  }
  return value;
}

function requireSha256(value: string, label: string) {
  if (!/^sha256:[0-9a-f]{64}$/.test(value)) {
    throw new Error(`${label} must be a canonical SHA-256 fingerprint`);
  }
  return value;
}

function normalizeUniqueStrings(values: readonly string[], label: string, allowEmpty = false) {
  if (!Array.isArray(values) || (!allowEmpty && values.length === 0)) {
    throw new Error(`${label} must${allowEmpty ? " be an array" : " not be empty"}`);
  }
  const normalized = values.map((value) => requireNonemptyText(value, label)).sort();
  if (new Set(normalized).size !== normalized.length) throw new Error(`${label} contains duplicates`);
  return normalized;
}

function normalizeMethods(values: readonly BlockAllocationMethod[], label: string) {
  const normalized = [...values].sort();
  if (new Set(normalized).size !== normalized.length) throw new Error(`${label} contains duplicates`);
  for (const method of normalized) {
    if (!BLOCK_ALLOCATION_METHODS.includes(method)) {
      throw new Error(`${label} contains unsupported method ${String(method)}`);
    }
  }
  return normalized;
}

function normalizeProfile(
  profile: VotingAgePopulationProfile,
  label: string,
): VotingAgePopulationProfile {
  const normalized = {
    totalVotingAgePopulation: requireNonnegativeInteger(
      profile.totalVotingAgePopulation,
      `${label} total VAP`,
    ),
    hispanic_any_race: requireNonnegativeInteger(
      profile.hispanic_any_race,
      `${label} Hispanic VAP`,
    ),
    non_hispanic_white: requireNonnegativeInteger(
      profile.non_hispanic_white,
      `${label} White VAP`,
    ),
    non_hispanic_black: requireNonnegativeInteger(
      profile.non_hispanic_black,
      `${label} Black VAP`,
    ),
    non_hispanic_asian: requireNonnegativeInteger(
      profile.non_hispanic_asian,
      `${label} Asian VAP`,
    ),
    non_hispanic_other: requireNonnegativeInteger(
      profile.non_hispanic_other,
      `${label} Other VAP`,
    ),
  };
  const groupTotal = DEMOGRAPHIC_GROUP_IDS.reduce(
    (sum, groupId) => sum + normalized[groupId],
    0,
  );
  if (groupTotal !== normalized.totalVotingAgePopulation) {
    throw new Error(`${label} groups must reconcile to total VAP`);
  }
  return normalized;
}

function emptyProfile(): VotingAgePopulationProfile {
  return {
    totalVotingAgePopulation: 0,
    hispanic_any_race: 0,
    non_hispanic_white: 0,
    non_hispanic_black: 0,
    non_hispanic_asian: 0,
    non_hispanic_other: 0,
  };
}

function addProfile(
  target: VotingAgePopulationProfile,
  addition: VotingAgePopulationProfile,
) {
  target.totalVotingAgePopulation += addition.totalVotingAgePopulation;
  for (const groupId of DEMOGRAPHIC_GROUP_IDS) target[groupId] += addition[groupId];
  return target;
}

function profilesEqual(
  left: VotingAgePopulationProfile,
  right: VotingAgePopulationProfile,
) {
  return left.totalVotingAgePopulation === right.totalVotingAgePopulation
    && DEMOGRAPHIC_GROUP_IDS.every((groupId) => left[groupId] === right[groupId]);
}

function assertProfileSum(
  total: VotingAgePopulationProfile,
  left: VotingAgePopulationProfile,
  right: VotingAgePopulationProfile,
  label: string,
) {
  const combined = addProfile({ ...left }, right);
  if (!profilesEqual(total, combined)) throw new Error(`${label} profiles do not reconcile`);
}

function expectedUnitQuality(methods: readonly BlockAllocationMethod[]) {
  const hasDirect = methods.some((method) => DIRECT_METHODS.has(method));
  const hasSplit = methods.some((method) => SPLIT_METHODS.has(method));
  if (hasDirect && hasSplit) return "mixed" as const;
  if (hasSplit) return "deterministic_population_split" as const;
  return "direct_block_assignment" as const;
}

function deepFreeze<T>(value: T): T {
  if (value != null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
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

async function sha256Fingerprint(value: string) {
  if (!globalThis.crypto?.subtle) throw new Error("Web Crypto SHA-256 is required");
  const digest = new Uint8Array(await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  ));
  return `sha256:${Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export function createPrecinctDemographicArtifact(
  input: CreatePrecinctDemographicArtifactInput,
): PrecinctDemographicArtifact {
  const stateCode = requireStateCode(input.stateCode);
  const stateFips = requireStateFips(input.stateFips);
  if (!(["precinct", "ward", "vtd"] as const).includes(input.geography.mapUnit)) {
    throw new Error("Precinct demographic map unit is invalid");
  }
  if (input.geography.countyBoundaryPolicy !== "strict_no_cross_county_allocation") {
    throw new Error("Cross-county demographic allocation is prohibited");
  }
  if (input.inferenceBoundary.aggregatePopulationOnly !== true
    || input.inferenceBoundary.observedIndividualTurnout !== false
    || input.inferenceBoundary.observedIndividualCandidatePreference !== false
    || input.inferenceBoundary.ecologicalInferenceAllowed !== false) {
    throw new Error("Precinct demographic inference boundary is incompatible");
  }

  const sourceProfile = normalizeProfile(input.statewide.sourceProfile, "Statewide source");
  const modeledProfile = normalizeProfile(input.statewide.modeledProfile, "Statewide modeled");
  const unavailableProfile = normalizeProfile(
    input.statewide.unavailableProfile,
    "Statewide unavailable",
  );
  if (sourceProfile.totalVotingAgePopulation === 0) {
    throw new Error("Statewide source VAP must be positive");
  }
  assertProfileSum(sourceProfile, modeledProfile, unavailableProfile, "Statewide");

  const sourceBlockCount = requirePositiveInteger(
    input.coverage.sourceBlockCount,
    "Source block count",
  );
  const allocatedBlockCount = requireNonnegativeInteger(
    input.coverage.allocatedBlockCount,
    "Allocated block count",
  );
  const unavailableBlockCount = requireNonnegativeInteger(
    input.coverage.unavailableBlockCount,
    "Unavailable block count",
  );
  const splitBlockCount = requireNonnegativeInteger(
    input.coverage.splitBlockCount,
    "Split block count",
  );
  const mapUnitCount = requirePositiveInteger(input.coverage.mapUnitCount, "Map unit count");
  const availableMapUnitCount = requireNonnegativeInteger(
    input.coverage.availableMapUnitCount,
    "Available map unit count",
  );
  const unavailableMapUnitCount = requireNonnegativeInteger(
    input.coverage.unavailableMapUnitCount,
    "Unavailable map unit count",
  );
  const offMapElectionUnitCount = requireNonnegativeInteger(
    input.coverage.offMapElectionUnitCount,
    "Off-map election unit count",
  );
  if (allocatedBlockCount + unavailableBlockCount !== sourceBlockCount) {
    throw new Error("Allocated and unavailable block counts must reconcile to source blocks");
  }
  if (splitBlockCount > allocatedBlockCount) {
    throw new Error("Split block count cannot exceed allocated blocks");
  }
  if (availableMapUnitCount + unavailableMapUnitCount !== mapUnitCount) {
    throw new Error("Available and unavailable map unit counts must reconcile");
  }

  const allocationMethods = [...input.allocationMethods].map((entry) => {
    if (!BLOCK_ALLOCATION_METHODS.includes(entry.method)) {
      throw new Error(`Unsupported allocation method ${String(entry.method)}`);
    }
    return {
      method: entry.method,
      blockCount: requirePositiveInteger(entry.blockCount, `${entry.method} block count`),
      allocatedVotingAgePopulation: requireNonnegativeInteger(
        entry.allocatedVotingAgePopulation,
        `${entry.method} allocated VAP`,
      ),
    };
  }).sort((left, right) => left.method.localeCompare(right.method));
  if (new Set(allocationMethods.map((entry) => entry.method)).size !== allocationMethods.length) {
    throw new Error("Allocation methods contain duplicates");
  }
  if (allocationMethods.reduce((sum, entry) => sum + entry.blockCount, 0)
    !== allocatedBlockCount) {
    throw new Error("Allocation method block counts must reconcile to allocated blocks");
  }
  if (allocationMethods.reduce((sum, entry) => sum + entry.allocatedVotingAgePopulation, 0)
    !== modeledProfile.totalVotingAgePopulation) {
    throw new Error("Allocation method VAP must reconcile to modeled VAP");
  }
  if (allocationMethods.filter((entry) => SPLIT_METHODS.has(entry.method))
    .reduce((sum, entry) => sum + entry.blockCount, 0) !== splitBlockCount) {
    throw new Error("Split allocation method counts must reconcile to split blocks");
  }

  const units = [...input.units].map((unit) => {
    const unitId = requireNonemptyText(unit.unitId, "Map unit identity");
    const methods = normalizeMethods(unit.allocationMethods, `${unitId} allocation methods`);
    const sourceUnitBlocks = requireNonnegativeInteger(
      unit.sourceBlockCount,
      `${unitId} source block count`,
    );
    const splitSourceBlockCount = requireNonnegativeInteger(
      unit.splitSourceBlockCount,
      `${unitId} split source block count`,
    );
    if (splitSourceBlockCount > sourceUnitBlocks) {
      throw new Error(`${unitId} split source blocks exceed source blocks`);
    }
    if (unit.status === "available") {
      if (unit.profile == null || methods.length === 0 || sourceUnitBlocks === 0) {
        throw new Error(`${unitId} available demographic unit is incomplete`);
      }
      const quality = expectedUnitQuality(methods);
      if (unit.quality !== quality) throw new Error(`${unitId} demographic quality is inconsistent`);
      return {
        unitId,
        countyFips: requireCountyFips(unit.countyFips, stateFips, `${unitId} county`),
        geometryId: requireNonemptyText(unit.geometryId, `${unitId} geometry identity`),
        status: "available" as const,
        quality,
        allocationMethods: methods,
        sourceBlockCount: sourceUnitBlocks,
        splitSourceBlockCount,
        profile: normalizeProfile(unit.profile, `${unitId} profile`),
      };
    }
    if (unit.status !== "unavailable" || unit.quality !== "unavailable"
      || unit.profile !== null || methods.length !== 0 || sourceUnitBlocks !== 0
      || splitSourceBlockCount !== 0) {
      throw new Error(`${unitId} unavailable demographic unit carries invented evidence`);
    }
    return {
      unitId,
      countyFips: requireCountyFips(unit.countyFips, stateFips, `${unitId} county`),
      geometryId: requireNonemptyText(unit.geometryId, `${unitId} geometry identity`),
      status: "unavailable" as const,
      quality: "unavailable" as const,
      allocationMethods: [] as readonly BlockAllocationMethod[],
      sourceBlockCount: 0,
      splitSourceBlockCount: 0,
      profile: null,
    };
  }).sort((left, right) => left.unitId.localeCompare(right.unitId));
  if (new Set(units.map((unit) => unit.unitId)).size !== units.length) {
    throw new Error("Precinct demographic units contain duplicate identities");
  }
  if (new Set(units.map((unit) => unit.geometryId)).size !== units.length) {
    throw new Error("Precinct demographic units contain duplicate geometry identities");
  }
  if (units.length !== mapUnitCount
    || units.filter((unit) => unit.status === "available").length !== availableMapUnitCount
    || units.filter((unit) => unit.status === "unavailable").length !== unavailableMapUnitCount) {
    throw new Error("Precinct demographic unit rows must reconcile to map-unit coverage");
  }
  const unitProfileTotal = units.reduce((sum, unit) => {
    if (unit.profile) addProfile(sum, unit.profile);
    return sum;
  }, emptyProfile());
  if (!profilesEqual(unitProfileTotal, modeledProfile)) {
    throw new Error("Precinct demographic unit profiles must reconcile to modeled VAP");
  }

  return deepFreeze({
    schemaVersion: PRECINCT_DEMOGRAPHIC_ARTIFACT_SCHEMA_VERSION,
    artifactId: requireNonemptyText(input.artifactId, "Precinct demographic artifact identity"),
    stateCode,
    stateFips,
    electionId: requireNonemptyText(input.electionId, "Election identity"),
    transformVersion: requireNonemptyText(input.transformVersion, "Transform version"),
    source: {
      demographicSourceId: requireNonemptyText(
        input.source.demographicSourceId,
        "Demographic source identity",
      ),
      precinctGeometrySourceId: requireNonemptyText(
        input.source.precinctGeometrySourceId,
        "Precinct geometry source identity",
      ),
      electionResultSourceId: requireNonemptyText(
        input.source.electionResultSourceId,
        "Election result source identity",
      ),
      demographicVintage: requireNonemptyText(
        input.source.demographicVintage,
        "Demographic vintage",
      ),
      mapVintage: requireNonemptyText(input.source.mapVintage, "Map vintage"),
      electionVintage: requireNonemptyText(input.source.electionVintage, "Election vintage"),
      sourceTable: requireNonemptyText(input.source.sourceTable, "Demographic source table"),
      checksums: {
        demographic: requireSha256(input.source.checksums.demographic, "Demographic checksum"),
        precinctGeometry: requireSha256(
          input.source.checksums.precinctGeometry,
          "Precinct geometry checksum",
        ),
        electionResults: requireSha256(
          input.source.checksums.electionResults,
          "Election results checksum",
        ),
      },
    },
    geography: {
      mapUnit: input.geography.mapUnit,
      countyBoundaryPolicy: "strict_no_cross_county_allocation",
      allocationProfileId: requireNonemptyText(
        input.geography.allocationProfileId,
        "Allocation profile identity",
      ),
    },
    statewide: { sourceProfile, modeledProfile, unavailableProfile },
    coverage: {
      sourceBlockCount,
      allocatedBlockCount,
      unavailableBlockCount,
      splitBlockCount,
      mapUnitCount,
      availableMapUnitCount,
      unavailableMapUnitCount,
      offMapElectionUnitCount,
    },
    allocationMethods,
    units,
    inferenceBoundary: {
      aggregatePopulationOnly: true,
      observedIndividualTurnout: false,
      observedIndividualCandidatePreference: false,
      ecologicalInferenceAllowed: false,
    },
    limitations: normalizeUniqueStrings(input.limitations, "Artifact limitations"),
  });
}

export function validatePrecinctDemographicArtifact(artifact: PrecinctDemographicArtifact) {
  if (artifact.schemaVersion !== PRECINCT_DEMOGRAPHIC_ARTIFACT_SCHEMA_VERSION) {
    throw new Error(`Unsupported precinct demographic schema ${String(artifact.schemaVersion)}`);
  }
  const recreated = createPrecinctDemographicArtifact(artifact);
  if (stableSerializeValue(recreated) !== stableSerializeValue(artifact)) {
    throw new Error("Precinct demographic artifact contains noncanonical or unknown content");
  }
  return recreated;
}

export function createBlockAllocationTrace(
  input: CreateBlockAllocationTraceInput,
): BlockAllocationTraceArtifact {
  const blocks = [...input.blocks].map((block) => {
    if (!/^\d{15}$/.test(block.blockGeoid)) {
      throw new Error("Census block GEOID must contain 15 digits");
    }
    const countyFips = block.blockGeoid.slice(0, 5);
    if (block.countyFips !== countyFips) {
      throw new Error(`${block.blockGeoid} county does not match its Census GEOID`);
    }
    const sourceProfile = normalizeProfile(block.sourceProfile, `${block.blockGeoid} source`);
    const allocations = [...block.allocations].map((allocation) => ({
      unitId: requireNonemptyText(allocation.unitId, `${block.blockGeoid} target unit`),
      profile: normalizeProfile(
        allocation.profile,
        `${block.blockGeoid} ${allocation.unitId} allocation`,
      ),
      evidenceWeight: allocation.evidenceWeight == null
        ? null
        : {
            numerator: requirePositiveInteger(
              allocation.evidenceWeight.numerator,
              `${block.blockGeoid} ${allocation.unitId} weight numerator`,
            ),
            denominator: requirePositiveInteger(
              allocation.evidenceWeight.denominator,
              `${block.blockGeoid} ${allocation.unitId} weight denominator`,
            ),
          },
    })).sort((left, right) => left.unitId.localeCompare(right.unitId));
    if (new Set(allocations.map((allocation) => allocation.unitId)).size !== allocations.length) {
      throw new Error(`${block.blockGeoid} contains duplicate allocation targets`);
    }
    if (block.disposition === "unavailable") {
      if (block.method !== null || !BLOCK_UNAVAILABLE_REASONS.includes(block.unavailableReason!)
        || allocations.length !== 0) {
        throw new Error(`${block.blockGeoid} unavailable block carries an allocation`);
      }
      return {
        blockGeoid: block.blockGeoid,
        countyFips,
        sourceProfile,
        disposition: "unavailable" as const,
        method: null,
        unavailableReason: block.unavailableReason,
        allocations: [] as readonly BlockAllocationTarget[],
      };
    }
    if (block.disposition !== "allocated" || !BLOCK_ALLOCATION_METHODS.includes(block.method!)
      || block.unavailableReason !== null || allocations.length === 0) {
      throw new Error(`${block.blockGeoid} allocated block contract is incomplete`);
    }
    if (DIRECT_METHODS.has(block.method!) && allocations.length !== 1) {
      throw new Error(`${block.blockGeoid} direct allocation must have one target`);
    }
    if (DIRECT_METHODS.has(block.method!) && allocations[0].evidenceWeight !== null) {
      throw new Error(`${block.blockGeoid} direct allocation cannot carry a split weight`);
    }
    if (SPLIT_METHODS.has(block.method!) && allocations.length < 2) {
      throw new Error(`${block.blockGeoid} split allocation must have multiple targets`);
    }
    if (SPLIT_METHODS.has(block.method!)) {
      if (allocations.some((allocation) => allocation.evidenceWeight == null)) {
        throw new Error(`${block.blockGeoid} split allocation requires exact evidence weights`);
      }
      const denominator = allocations[0].evidenceWeight!.denominator;
      if (allocations.some((allocation) => allocation.evidenceWeight!.denominator !== denominator)
        || allocations.reduce(
          (sum, allocation) => sum + allocation.evidenceWeight!.numerator,
          0,
        ) !== denominator) {
        throw new Error(`${block.blockGeoid} split weights must share and sum to their denominator`);
      }
    }
    const allocationTotal = allocations.reduce(
      (sum, allocation) => addProfile(sum, allocation.profile),
      emptyProfile(),
    );
    if (!profilesEqual(allocationTotal, sourceProfile)) {
      throw new Error(`${block.blockGeoid} allocations do not reconcile to its source profile`);
    }
    return {
      blockGeoid: block.blockGeoid,
      countyFips,
      sourceProfile,
      disposition: "allocated" as const,
      method: block.method!,
      unavailableReason: null,
      allocations,
    };
  }).sort((left, right) => left.blockGeoid.localeCompare(right.blockGeoid));
  if (new Set(blocks.map((block) => block.blockGeoid)).size !== blocks.length) {
    throw new Error("Block allocation trace contains duplicate Census blocks");
  }
  return deepFreeze({
    schemaVersion: BLOCK_ALLOCATION_TRACE_SCHEMA_VERSION,
    artifactId: requireNonemptyText(input.artifactId, "Trace artifact identity"),
    transformVersion: requireNonemptyText(input.transformVersion, "Trace transform version"),
    blocks,
  });
}

export function validateBlockAllocationTrace(trace: BlockAllocationTraceArtifact) {
  if (trace.schemaVersion !== BLOCK_ALLOCATION_TRACE_SCHEMA_VERSION) {
    throw new Error(`Unsupported block allocation trace schema ${String(trace.schemaVersion)}`);
  }
  const recreated = createBlockAllocationTrace(trace);
  if (stableSerializeValue(recreated) !== stableSerializeValue(trace)) {
    throw new Error("Block allocation trace contains noncanonical or unknown content");
  }
  return recreated;
}

export function createPrecinctDemographicBundle(
  artifactInput: PrecinctDemographicArtifact,
  traceInput: BlockAllocationTraceArtifact,
): PrecinctDemographicBundle {
  const artifact = validatePrecinctDemographicArtifact(artifactInput);
  const trace = validateBlockAllocationTrace(traceInput);
  if (artifact.artifactId !== trace.artifactId
    || artifact.transformVersion !== trace.transformVersion) {
    throw new Error("Precinct artifact and block trace identities do not match");
  }
  if (trace.blocks.length !== artifact.coverage.sourceBlockCount) {
    throw new Error("Block trace length does not reconcile to source block coverage");
  }

  const unitById = new Map(artifact.units.map((unit) => [unit.unitId, unit]));
  const unitProfiles = new Map<string, VotingAgePopulationProfile>();
  const unitBlocks = new Map<string, Set<string>>();
  const unitSplitBlocks = new Map<string, Set<string>>();
  const unitMethods = new Map<string, Set<BlockAllocationMethod>>();
  const sourceProfile = emptyProfile();
  const modeledProfile = emptyProfile();
  const unavailableProfile = emptyProfile();
  const methodAudit = new Map<BlockAllocationMethod, {
    blockCount: number;
    allocatedVotingAgePopulation: number;
  }>();
  let allocatedBlockCount = 0;
  let unavailableBlockCount = 0;
  let splitBlockCount = 0;

  for (const block of trace.blocks) {
    if (!block.blockGeoid.startsWith(artifact.stateFips)) {
      throw new Error(`${block.blockGeoid} lies outside artifact state ${artifact.stateFips}`);
    }
    addProfile(sourceProfile, block.sourceProfile);
    if (block.disposition === "unavailable") {
      unavailableBlockCount += 1;
      addProfile(unavailableProfile, block.sourceProfile);
      continue;
    }
    allocatedBlockCount += 1;
    if (SPLIT_METHODS.has(block.method!)) splitBlockCount += 1;
    addProfile(modeledProfile, block.sourceProfile);
    const method = block.method!;
    const audit = methodAudit.get(method) ?? { blockCount: 0, allocatedVotingAgePopulation: 0 };
    audit.blockCount += 1;
    audit.allocatedVotingAgePopulation += block.sourceProfile.totalVotingAgePopulation;
    methodAudit.set(method, audit);
    for (const allocation of block.allocations) {
      const unit = unitById.get(allocation.unitId);
      if (!unit) throw new Error(`${block.blockGeoid} targets unknown unit ${allocation.unitId}`);
      if (unit.countyFips !== block.countyFips) {
        throw new Error(`${block.blockGeoid} crosses a county boundary into ${unit.unitId}`);
      }
      addProfile(
        unitProfiles.get(unit.unitId) ?? (() => {
          const profile = emptyProfile();
          unitProfiles.set(unit.unitId, profile);
          return profile;
        })(),
        allocation.profile,
      );
      const blocks = unitBlocks.get(unit.unitId) ?? new Set<string>();
      blocks.add(block.blockGeoid);
      unitBlocks.set(unit.unitId, blocks);
      if (SPLIT_METHODS.has(method)) {
        const splitBlocks = unitSplitBlocks.get(unit.unitId) ?? new Set<string>();
        splitBlocks.add(block.blockGeoid);
        unitSplitBlocks.set(unit.unitId, splitBlocks);
      }
      const methods = unitMethods.get(unit.unitId) ?? new Set<BlockAllocationMethod>();
      methods.add(method);
      unitMethods.set(unit.unitId, methods);
    }
  }

  if (!profilesEqual(sourceProfile, artifact.statewide.sourceProfile)
    || !profilesEqual(modeledProfile, artifact.statewide.modeledProfile)
    || !profilesEqual(unavailableProfile, artifact.statewide.unavailableProfile)) {
    throw new Error("Block trace statewide profiles do not reconcile to the precinct artifact");
  }
  if (allocatedBlockCount !== artifact.coverage.allocatedBlockCount
    || unavailableBlockCount !== artifact.coverage.unavailableBlockCount
    || splitBlockCount !== artifact.coverage.splitBlockCount) {
    throw new Error("Block trace disposition counts do not reconcile to coverage");
  }

  if (methodAudit.size !== artifact.allocationMethods.length
    || artifact.allocationMethods.some((entry) => !methodAudit.has(entry.method))) {
    throw new Error("Block trace method identities do not reconcile to the precinct artifact");
  }
  const expectedMethodAudit = artifact.allocationMethods.map((entry) => ({
    method: entry.method,
    ...methodAudit.get(entry.method),
  }));
  if (stableSerializeValue(expectedMethodAudit) !== stableSerializeValue(artifact.allocationMethods)) {
    throw new Error("Block trace allocation methods do not reconcile to the precinct artifact");
  }

  for (const unit of artifact.units) {
    const tracedProfile = unitProfiles.get(unit.unitId) ?? emptyProfile();
    if (unit.status === "unavailable") {
      if (tracedProfile.totalVotingAgePopulation !== 0) {
        throw new Error(`${unit.unitId} unavailable unit received demographic allocation`);
      }
      continue;
    }
    if (!profilesEqual(tracedProfile, unit.profile!)) {
      throw new Error(`${unit.unitId} trace profile does not reconcile`);
    }
    if ((unitBlocks.get(unit.unitId)?.size ?? 0) !== unit.sourceBlockCount
      || (unitSplitBlocks.get(unit.unitId)?.size ?? 0) !== unit.splitSourceBlockCount
      || stableSerializeValue([...(unitMethods.get(unit.unitId) ?? [])].sort())
        !== stableSerializeValue(unit.allocationMethods)) {
      throw new Error(`${unit.unitId} trace provenance does not reconcile`);
    }
  }

  return deepFreeze({
    schemaVersion: PRECINCT_DEMOGRAPHIC_BUNDLE_SCHEMA_VERSION,
    artifact,
    trace,
  });
}

export function serializePrecinctDemographicArtifact(artifact: PrecinctDemographicArtifact) {
  return stableSerializeValue(validatePrecinctDemographicArtifact(artifact));
}

export function serializeBlockAllocationTrace(trace: BlockAllocationTraceArtifact) {
  return stableSerializeValue(validateBlockAllocationTrace(trace));
}

export function serializePrecinctDemographicBundle(bundle: PrecinctDemographicBundle) {
  return stableSerializeValue(createPrecinctDemographicBundle(bundle.artifact, bundle.trace));
}

export async function fingerprintPrecinctDemographicArtifact(
  artifact: PrecinctDemographicArtifact,
) {
  return sha256Fingerprint(serializePrecinctDemographicArtifact(artifact));
}

export async function fingerprintBlockAllocationTrace(trace: BlockAllocationTraceArtifact) {
  return sha256Fingerprint(serializeBlockAllocationTrace(trace));
}

export async function fingerprintPrecinctDemographicBundle(bundle: PrecinctDemographicBundle) {
  return sha256Fingerprint(serializePrecinctDemographicBundle(bundle));
}

export function deserializePrecinctDemographicBundle(serialized: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    throw new Error("Precinct demographic bundle is not valid JSON");
  }
  if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Precinct demographic bundle must be an object");
  }
  const record = parsed as Record<string, unknown>;
  if (record.schemaVersion !== PRECINCT_DEMOGRAPHIC_BUNDLE_SCHEMA_VERSION
    || record.artifact == null || record.trace == null) {
    throw new Error("Precinct demographic bundle schema is incompatible");
  }
  const bundle = createPrecinctDemographicBundle(
    record.artifact as PrecinctDemographicArtifact,
    record.trace as BlockAllocationTraceArtifact,
  );
  if (stableSerializeValue(bundle) !== stableSerializeValue(parsed)) {
    throw new Error("Precinct demographic bundle contains noncanonical or unknown content");
  }
  return bundle;
}
