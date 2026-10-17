import {
  DEMOGRAPHIC_GROUP_IDS,
  createDemographicEvidenceContract,
  createDemographicEvidenceInventory,
  type CreateDemographicEvidenceContractInput,
  type DemographicGroupCounts,
} from "../../packages/data-contracts/src/demographicEvidence.ts";
import type { DetailedStateFoundation } from "./detailedStateFoundation.ts";
import { isMichiganFoundation, isPennsylvaniaFoundation } from "./detailedStateFoundation.ts";

function groupCounts(input: {
  hispanicAnyRace: number;
  nonHispanicWhite: number;
  nonHispanicBlack: number;
  nonHispanicAsian: number;
  nonHispanicOther: number;
}): DemographicGroupCounts {
  return {
    hispanic_any_race: input.hispanicAnyRace,
    non_hispanic_white: input.nonHispanicWhite,
    non_hispanic_black: input.nonHispanicBlack,
    non_hispanic_asian: input.nonHispanicAsian,
    non_hispanic_other: input.nonHispanicOther,
  };
}

function readWisconsinSourceText(
  source: Record<string, unknown>,
  key: "id",
) {
  const value = source[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Wisconsin demographic source ${key} is unavailable`);
  }
  return value;
}

function readWisconsinLimitations(source: Record<string, unknown>) {
  if (!Array.isArray(source.limitations)
    || !source.limitations.every((limitation) => typeof limitation === "string")) {
    throw new Error("Wisconsin demographic source limitations are unavailable");
  }
  return source.limitations as string[];
}

function sharedInferenceBoundary(compositionAvailable: boolean) {
  return {
    observedAggregatePopulationComposition: compositionAvailable,
    observedIndividualTurnout: false as const,
    observedIndividualCandidatePreference: false as const,
    groupTurnoutMustBeUserAuthored: true as const,
    groupCandidatePreferenceMustBeUserAuthored: true as const,
    ecologicalInferenceAllowed: false as const,
  };
}

function sharedCapability(compositionAvailable: boolean) {
  return {
    aggregateCompositionAvailable: compositionAvailable,
    futureGroupTurnoutAssumptionsEligible: compositionAvailable,
    futureGroupPreferenceAssumptionsEligible: compositionAvailable,
    voteMutationAuthorized: false as const,
  };
}

export function buildDetailedStateDemographicEvidenceContract(
  foundation: DetailedStateFoundation,
) {
  if (isPennsylvaniaFoundation(foundation)) {
    const status = foundation.totals.denominatorStatus;
    const input: CreateDemographicEvidenceContractInput = {
      stateCode: "PA",
      electionId: foundation.electionId,
      sourceIds: [foundation.source.id],
      transformVersion: foundation.source.pipelineVersion,
      geography: {
        mapUnit: "vtd",
        sourceUnit: "census_vtd",
        mapVintage: foundation.join.geometryVintage,
        demographicVintage: foundation.join.demographicVintage,
        electionVintage: foundation.join.electionVintage,
        alignment: "exact_source_geography",
      },
      denominator: {
        measure: "population_age_18_plus",
        sourceTable: foundation.source.table,
        statewidePopulation: foundation.totals.statewideDemographics.votingAgePopulation,
        modeledPopulation: foundation.totals.matchedDemographics.votingAgePopulation,
        isCitizenVotingAgePopulation: false,
        isElectionYearEligibleVoterEstimate: false,
      },
      composition: {
        status: "available",
        quality: "official_census_tabulation",
        groups: DEMOGRAPHIC_GROUP_IDS,
        statewideCounts: groupCounts(foundation.totals.statewideDemographics),
        modeledCounts: groupCounts(foundation.totals.matchedDemographics),
      },
      crosswalk: {
        methods: [{ method: "direct_census_vtd", unitCount: foundation.vtds.length }],
      },
      coverage: {
        terrainUnitCount: foundation.join.geometryFeatureCount,
        resultLinkedUnitCount: foundation.join.mappedElectionGeometryCount,
        noMappedResultUnitCount: status.noMappedResultVtdCount,
        denominatorObservedUnitCount: foundation.vtds.length,
        denominatorUnavailableUnitCount: 0,
        turnoutReadyUnitCount: status.availableVtdCount,
        turnoutCappedUnitCount: status.ballotsExceed2020VapVtdCount,
        turnoutUnavailableResultLinkedUnitCount: 0,
        compositionObservedUnitCount: foundation.vtds.length,
        compositionUnavailableUnitCount: 0,
        offMapElectionUnitCount: foundation.residualUnits.length,
      },
      capability: sharedCapability(true),
      inferenceBoundary: sharedInferenceBoundary(true),
      limitations: foundation.source.limitations,
    };
    return createDemographicEvidenceContract(input);
  }

  if (isMichiganFoundation(foundation)) {
    const status = foundation.totals.denominatorStatus;
    const denominatorObserved = foundation.join.directVtdBridgeCount
      + foundation.join.weightedSplitGeometryCount;
    const input: CreateDemographicEvidenceContractInput = {
      stateCode: "MI",
      electionId: foundation.electionId,
      sourceIds: [foundation.source.id],
      transformVersion: foundation.source.pipelineVersion,
      geography: {
        mapUnit: "precinct",
        sourceUnit: "census_vtd",
        mapVintage: foundation.join.geometryVintage,
        demographicVintage: foundation.join.demographicVintage,
        electionVintage: foundation.join.electionVintage,
        alignment: "deterministic_cross_vintage_bridge",
      },
      denominator: {
        measure: "population_age_18_plus",
        sourceTable: foundation.source.table,
        statewidePopulation: foundation.totals.statewideDemographics.votingAgePopulation,
        modeledPopulation: foundation.totals.matchedDemographics.votingAgePopulation,
        isCitizenVotingAgePopulation: false,
        isElectionYearEligibleVoterEstimate: false,
      },
      composition: {
        status: "available",
        quality: "mixed_census_and_deterministic_allocation",
        groups: DEMOGRAPHIC_GROUP_IDS,
        statewideCounts: groupCounts(foundation.totals.statewideDemographics),
        modeledCounts: groupCounts(foundation.totals.matchedDemographics),
      },
      crosswalk: {
        methods: [
          { method: "direct_census_vtd", unitCount: foundation.join.directVtdBridgeCount },
          {
            method: "registered_voter_weighted_vtd_split",
            unitCount: foundation.join.weightedSplitGeometryCount,
          },
          { method: "unavailable", unitCount: foundation.join.unavailableDemographicGeometryCount },
        ],
      },
      coverage: {
        terrainUnitCount: foundation.join.geometryFeatureCount,
        resultLinkedUnitCount: foundation.join.mappedElectionGeometryCount,
        noMappedResultUnitCount: status.noMappedResultPrecinctCount,
        denominatorObservedUnitCount: denominatorObserved,
        denominatorUnavailableUnitCount: status.demographicBridgeUnavailablePrecinctCount,
        turnoutReadyUnitCount: status.availablePrecinctCount,
        turnoutCappedUnitCount: status.ballotsExceed2020VapPrecinctCount,
        turnoutUnavailableResultLinkedUnitCount:
          status.demographicBridgeUnavailablePrecinctCount,
        compositionObservedUnitCount: denominatorObserved,
        compositionUnavailableUnitCount: status.demographicBridgeUnavailablePrecinctCount,
        offMapElectionUnitCount: foundation.residualUnits.length,
      },
      capability: sharedCapability(true),
      inferenceBoundary: sharedInferenceBoundary(true),
      limitations: foundation.source.limitations,
    };
    return createDemographicEvidenceContract(input);
  }

  const status = foundation.totals.denominatorStatus;
  const denominatorObserved = foundation.join.mappedElectionGeometryCount;
  const input: CreateDemographicEvidenceContractInput = {
    stateCode: "WI",
    electionId: foundation.electionId,
    sourceIds: [readWisconsinSourceText(foundation.source, "id")],
    transformVersion: "wi-ltsb-ward-foundation-v1",
    geography: {
      mapUnit: "ward",
      sourceUnit: "ltsb_ward_estimate",
      mapVintage: foundation.join.geometryVintage,
      demographicVintage: foundation.join.demographicVintage,
      electionVintage: foundation.join.electionVintage,
      alignment: "official_population_reconstruction",
    },
    denominator: {
      measure: "population_age_18_plus",
      sourceTable: "LTSB PERSONS18 estimate derived from 2020 Census P.L. 94-171",
      statewidePopulation: foundation.totals.statewideVotingAgePopulation,
      modeledPopulation: foundation.totals.statewideVotingAgePopulation,
      isCitizenVotingAgePopulation: false,
      isElectionYearEligibleVoterEstimate: false,
    },
    composition: {
      status: "unavailable",
      quality: "unavailable",
      groups: [],
      statewideCounts: null,
      modeledCounts: null,
    },
    crosswalk: {
      methods: [
        { method: "official_ltsb_2020_vap_estimate", unitCount: denominatorObserved },
        { method: "unavailable", unitCount: status.noMappedResultWardCount },
      ],
    },
    coverage: {
      terrainUnitCount: foundation.join.geometryFeatureCount,
      resultLinkedUnitCount: foundation.join.mappedElectionGeometryCount,
      noMappedResultUnitCount: status.noMappedResultWardCount,
      denominatorObservedUnitCount: denominatorObserved,
      denominatorUnavailableUnitCount: status.noMappedResultWardCount,
      turnoutReadyUnitCount: status.availableWardCount,
      turnoutCappedUnitCount: status.ballotsExceed2020VapWardCount,
      turnoutUnavailableResultLinkedUnitCount: 0,
      compositionObservedUnitCount: 0,
      compositionUnavailableUnitCount: foundation.join.geometryFeatureCount,
      offMapElectionUnitCount: foundation.residualUnits.length,
    },
    capability: sharedCapability(false),
    inferenceBoundary: sharedInferenceBoundary(false),
    limitations: [
      ...readWisconsinLimitations(foundation.source),
      "The current Wisconsin runtime artifact contains total VAP only and cannot support group-specific demographic behavior.",
    ],
  };
  return createDemographicEvidenceContract(input);
}

export function buildAdmittedDemographicEvidenceInventory(
  foundations: readonly DetailedStateFoundation[],
) {
  return createDemographicEvidenceInventory(
    foundations.map(buildDetailedStateDemographicEvidenceContract),
  );
}
