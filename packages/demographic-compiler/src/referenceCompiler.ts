import type { MultiPolygon, Polygon } from "geojson";

import {
  createBlockAllocationTrace,
  createPrecinctDemographicArtifact,
  createPrecinctDemographicBundle,
  type BlockAllocationMethod,
  type BlockAllocationTraceRecord,
  type PrecinctDemographicMapUnit,
  type PrecinctDemographicUnit,
  type VotingAgePopulationProfile,
} from "../../data-contracts/src/precinctDemographicArtifact.ts";
import { DEMOGRAPHIC_GROUP_IDS } from "../../data-contracts/src/demographicEvidence.ts";

export const REFERENCE_PRECINCT_DEMOGRAPHIC_COMPILER_VERSION =
  "reference-block-to-election-unit-v1" as const;
export const REFERENCE_COMPILER_CRS = "OGC:CRS84" as const;
export const CENSUS_GEOGRAPHIC_CRS = "EPSG:4269" as const;

type SurfaceGeometry = Polygon | MultiPolygon;
type Coordinate = [number, number];

export interface ReferenceCompilerDefinition {
  artifactId: string;
  stateCode: string;
  stateFips: string;
  electionId: string;
  transformVersion: typeof REFERENCE_PRECINCT_DEMOGRAPHIC_COMPILER_VERSION;
  coordinateReferenceSystem: typeof REFERENCE_COMPILER_CRS | typeof CENSUS_GEOGRAPHIC_CRS;
  mapUnit: PrecinctDemographicMapUnit;
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
  allocationProfileId: string;
  offMapElectionUnitCount: number;
  limitations: readonly string[];
}

export interface ReferenceElectionMapUnit {
  unitId: string;
  countyFips: string;
  geometryId: string;
  geometry: unknown;
}

export interface ReferenceSplitEvidencePoint {
  position: readonly [number, number];
  weight: number;
}

export interface ReferenceSourceBlock {
  blockGeoid: string;
  countyFips: string;
  profile: VotingAgePopulationProfile;
  geometry: unknown;
  internalPoint: readonly [number, number] | null;
  splitEvidence: {
    basis: "population" | "housing";
    points: readonly ReferenceSplitEvidencePoint[];
  } | null;
}

export interface ReferenceCompilerInput {
  definition: ReferenceCompilerDefinition;
  mapUnits: readonly ReferenceElectionMapUnit[];
  sourceBlocks: readonly ReferenceSourceBlock[];
}

function compareText(left: string, right: string) {
  return left < right ? -1 : left > right ? 1 : 0;
}

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

function normalizePosition(value: unknown, label: string): Coordinate {
  if (!Array.isArray(value) || value.length < 2
    || !Number.isFinite(value[0]) || !Number.isFinite(value[1])) {
    throw new Error(`${label} must be a finite longitude-latitude pair`);
  }
  const longitude = Number(value[0]);
  const latitude = Number(value[1]);
  if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
    throw new Error(`${label} lies outside OGC:CRS84 bounds`);
  }
  return [longitude, latitude];
}

function positionsEqual(left: Coordinate, right: Coordinate) {
  return left[0] === right[0] && left[1] === right[1];
}

function orientation(a: Coordinate, b: Coordinate, c: Coordinate) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function pointOnSegment(point: Coordinate, start: Coordinate, end: Coordinate) {
  const cross = orientation(start, end, point);
  if (Math.abs(cross) > 1e-12) return false;
  return point[0] >= Math.min(start[0], end[0]) - 1e-12
    && point[0] <= Math.max(start[0], end[0]) + 1e-12
    && point[1] >= Math.min(start[1], end[1]) - 1e-12
    && point[1] <= Math.max(start[1], end[1]) + 1e-12;
}

function properSegmentsCross(
  firstStart: Coordinate,
  firstEnd: Coordinate,
  secondStart: Coordinate,
  secondEnd: Coordinate,
) {
  const a = orientation(firstStart, firstEnd, secondStart);
  const b = orientation(firstStart, firstEnd, secondEnd);
  const c = orientation(secondStart, secondEnd, firstStart);
  const d = orientation(secondStart, secondEnd, firstEnd);
  return ((a > 1e-12 && b < -1e-12) || (a < -1e-12 && b > 1e-12))
    && ((c > 1e-12 && d < -1e-12) || (c < -1e-12 && d > 1e-12));
}

function normalizeRing(value: unknown, label: string): Coordinate[] {
  if (!Array.isArray(value) || value.length < 4) {
    throw new Error(`${label} must contain a closed ring with at least four positions`);
  }
  const ring = value.map((position, index) => normalizePosition(position, `${label}[${index}]`));
  if (!positionsEqual(ring[0], ring[ring.length - 1])) {
    throw new Error(`${label} must be closed`);
  }
  const areaTwice = ring.slice(0, -1).reduce((sum, point, index) => {
    const next = ring[index + 1];
    return sum + point[0] * next[1] - next[0] * point[1];
  }, 0);
  if (Math.abs(areaTwice) <= 1e-12) throw new Error(`${label} has zero area`);
  for (let left = 0; left < ring.length - 1; left += 1) {
    for (let right = left + 1; right < ring.length - 1; right += 1) {
      if (Math.abs(left - right) <= 1
        || (left === 0 && right === ring.length - 2)) continue;
      if (properSegmentsCross(ring[left], ring[left + 1], ring[right], ring[right + 1])) {
        throw new Error(`${label} self-intersects`);
      }
    }
  }
  return ring;
}

function normalizePolygonCoordinates(value: unknown, label: string): Coordinate[][] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${label} must contain at least one ring`);
  }
  return value.map((ring, index) => normalizeRing(ring, `${label}[${index}]`));
}

function normalizeSurfaceGeometry(value: unknown, label: string): SurfaceGeometry {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be a Polygon or MultiPolygon`);
  }
  const geometry = value as { type?: unknown; coordinates?: unknown };
  if (geometry.type === "Polygon") {
    return {
      type: "Polygon",
      coordinates: normalizePolygonCoordinates(geometry.coordinates, `${label} coordinates`),
    };
  }
  if (geometry.type === "MultiPolygon") {
    if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length === 0) {
      throw new Error(`${label} must contain at least one polygon`);
    }
    return {
      type: "MultiPolygon",
      coordinates: geometry.coordinates.map((polygon, index) => (
        normalizePolygonCoordinates(polygon, `${label} coordinates[${index}]`)
      )),
    };
  }
  throw new Error(`${label} must be a Polygon or MultiPolygon`);
}

function geometryPolygons(geometry: SurfaceGeometry): Coordinate[][][] {
  return geometry.type === "Polygon"
    ? [geometry.coordinates as Coordinate[][]]
    : geometry.coordinates as Coordinate[][][];
}

function pointInRing(point: Coordinate, ring: readonly Coordinate[]) {
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const current = ring[index];
    const prior = ring[previous];
    if (pointOnSegment(point, prior, current)) return { inside: true, boundary: true };
    const crosses = (current[1] > point[1]) !== (prior[1] > point[1])
      && point[0] < (prior[0] - current[0]) * (point[1] - current[1])
        / (prior[1] - current[1]) + current[0];
    if (crosses) inside = !inside;
  }
  return { inside, boundary: false };
}

function pointInPolygon(point: Coordinate, polygon: Coordinate[][]) {
  const exterior = pointInRing(point, polygon[0]);
  if (!exterior.inside) return false;
  for (const hole of polygon.slice(1)) {
    const relationship = pointInRing(point, hole);
    if (relationship.inside) return false;
  }
  return true;
}

function pointInGeometry(point: Coordinate, geometry: SurfaceGeometry) {
  return geometryPolygons(geometry).some((polygon) => pointInPolygon(point, polygon));
}

function geometryBoundarySegments(geometry: SurfaceGeometry) {
  return geometryPolygons(geometry).flatMap((polygon) => polygon.flatMap((ring) => (
    ring.slice(0, -1).map((start, index) => [start, ring[index + 1]] as const)
  )));
}

function polygonContainedByGeometry(polygon: Coordinate[][], target: SurfaceGeometry) {
  const exterior = polygon[0];
  if (!exterior.slice(0, -1).every((point) => pointInGeometry(point, target))) return false;
  for (let index = 0; index < exterior.length - 1; index += 1) {
    const start = exterior[index];
    const end = exterior[index + 1];
    const midpoint: Coordinate = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
    if (!pointInGeometry(midpoint, target)) return false;
    if (geometryBoundarySegments(target).some(([boundaryStart, boundaryEnd]) => (
      properSegmentsCross(start, end, boundaryStart, boundaryEnd)
    ))) return false;
  }
  return true;
}

function geometryContainedByGeometry(source: SurfaceGeometry, target: SurfaceGeometry) {
  return geometryPolygons(source).every((polygon) => polygonContainedByGeometry(polygon, target));
}

function geometriesTouchOrOverlap(left: SurfaceGeometry, right: SurfaceGeometry) {
  const leftPolygons = geometryPolygons(left);
  const rightPolygons = geometryPolygons(right);
  if (leftPolygons.some((polygon) => polygon[0].slice(0, -1)
    .some((point) => pointInGeometry(point, right)))) return true;
  if (rightPolygons.some((polygon) => polygon[0].slice(0, -1)
    .some((point) => pointInGeometry(point, left)))) return true;
  const rightSegments = geometryBoundarySegments(right);
  return geometryBoundarySegments(left).some(([leftStart, leftEnd]) => (
    rightSegments.some(([rightStart, rightEnd]) => (
      properSegmentsCross(leftStart, leftEnd, rightStart, rightEnd)
    ))
  ));
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

function greatestCommonDivisor(left: number, right: number): number {
  let a = Math.abs(left);
  let b = Math.abs(right);
  while (b !== 0) [a, b] = [b, a % b];
  return a;
}

function allocateIntegerByWeights(
  total: number,
  weightedTargets: readonly { unitId: string; weight: number }[],
) {
  const denominator = weightedTargets.reduce((sum, target) => sum + target.weight, 0);
  const rows = weightedTargets.map((target) => {
    const numerator = total * target.weight;
    return {
      unitId: target.unitId,
      votes: Math.floor(numerator / denominator),
      remainder: numerator % denominator,
    };
  });
  let remaining = total - rows.reduce((sum, row) => sum + row.votes, 0);
  [...rows].sort((left, right) => (
    right.remainder - left.remainder || compareText(left.unitId, right.unitId)
  )).forEach((row) => {
    if (remaining > 0) {
      row.votes += 1;
      remaining -= 1;
    }
  });
  if (remaining !== 0) throw new Error("Weighted integer allocation did not reconcile");
  return new Map(rows.map((row) => [row.unitId, row.votes]));
}

function allocateProfileByWeights(
  profile: VotingAgePopulationProfile,
  weightedTargets: readonly { unitId: string; weight: number }[],
) {
  const allocations = new Map(weightedTargets.map((target) => [target.unitId, emptyProfile()]));
  for (const groupId of DEMOGRAPHIC_GROUP_IDS) {
    const groupAllocation = allocateIntegerByWeights(profile[groupId], weightedTargets);
    for (const [unitId, count] of groupAllocation) allocations.get(unitId)![groupId] = count;
  }
  for (const allocation of allocations.values()) {
    allocation.totalVotingAgePopulation = DEMOGRAPHIC_GROUP_IDS.reduce(
      (sum, groupId) => sum + allocation[groupId],
      0,
    );
  }
  return allocations;
}

function directTraceRecord(
  block: ReferenceSourceBlock,
  unitId: string,
  method: "whole_block_containment" | "census_internal_point",
): BlockAllocationTraceRecord {
  return {
    blockGeoid: block.blockGeoid,
    countyFips: block.countyFips,
    sourceProfile: block.profile,
    disposition: "allocated",
    method,
    unavailableReason: null,
    allocations: [{ unitId, profile: block.profile, evidenceWeight: null }],
  };
}

function unavailableTraceRecord(
  block: ReferenceSourceBlock,
  unavailableReason: "no_compatible_geometry" | "invalid_source_geometry"
    | "county_boundary_conflict" | "zero_information_split",
): BlockAllocationTraceRecord {
  return {
    blockGeoid: block.blockGeoid,
    countyFips: block.countyFips,
    sourceProfile: block.profile,
    disposition: "unavailable",
    method: null,
    unavailableReason,
    allocations: [],
  };
}

export function compileReferencePrecinctDemographics(
  input: ReferenceCompilerInput,
) {
  if (input.definition.transformVersion !== REFERENCE_PRECINCT_DEMOGRAPHIC_COMPILER_VERSION) {
    throw new Error("Reference compiler transform version is incompatible");
  }
  if (input.definition.coordinateReferenceSystem !== REFERENCE_COMPILER_CRS
    && input.definition.coordinateReferenceSystem !== CENSUS_GEOGRAPHIC_CRS) {
    throw new Error("Reference compiler accepts only normalized OGC:CRS84 or EPSG:4269 geometry");
  }
  if (!Number.isSafeInteger(input.definition.offMapElectionUnitCount)
    || input.definition.offMapElectionUnitCount < 0) {
    throw new Error("Off-map election unit count must be a non-negative safe integer");
  }

  const mapUnits = [...input.mapUnits].map((unit) => ({
    unitId: requireNonemptyText(unit.unitId, "Map unit identity"),
    countyFips: unit.countyFips,
    geometryId: requireNonemptyText(unit.geometryId, `${unit.unitId} geometry identity`),
    geometry: normalizeSurfaceGeometry(unit.geometry, `${unit.unitId} geometry`),
  })).sort((left, right) => compareText(left.unitId, right.unitId));
  if (mapUnits.length === 0) throw new Error("Reference compiler requires map units");
  if (new Set(mapUnits.map((unit) => unit.unitId)).size !== mapUnits.length
    || new Set(mapUnits.map((unit) => unit.geometryId)).size !== mapUnits.length) {
    throw new Error("Reference map units contain duplicate identities");
  }

  const sourceBlocks = [...input.sourceBlocks].sort((left, right) => (
    compareText(left.blockGeoid, right.blockGeoid)
  ));
  if (sourceBlocks.length === 0) throw new Error("Reference compiler requires Census blocks");
  if (new Set(sourceBlocks.map((block) => block.blockGeoid)).size !== sourceBlocks.length) {
    throw new Error("Reference source blocks contain duplicate identities");
  }

  const traceRecords = sourceBlocks.map((block): BlockAllocationTraceRecord => {
    let geometry: SurfaceGeometry;
    try {
      geometry = normalizeSurfaceGeometry(block.geometry, `${block.blockGeoid} geometry`);
    } catch {
      return unavailableTraceRecord(block, "invalid_source_geometry");
    }
    const sameCountyUnits = mapUnits.filter((unit) => unit.countyFips === block.countyFips);
    const containingUnits = sameCountyUnits.filter((unit) => (
      geometryContainedByGeometry(geometry, unit.geometry)
    ));
    if (containingUnits.length > 1) {
      throw new Error(`${block.blockGeoid} is contained by overlapping map units`);
    }
    if (containingUnits.length === 1) {
      return directTraceRecord(block, containingUnits[0].unitId, "whole_block_containment");
    }

    if (block.internalPoint != null) {
      const point = normalizePosition(block.internalPoint, `${block.blockGeoid} internal point`);
      if (!pointInGeometry(point, geometry)) {
        throw new Error(`${block.blockGeoid} internal point lies outside its source geometry`);
      }
      const pointTargets = mapUnits.filter((unit) => pointInGeometry(point, unit.geometry));
      if (pointTargets.length > 1) {
        throw new Error(`${block.blockGeoid} internal point lies in overlapping map units`);
      }
      if (pointTargets.length === 1) {
        if (pointTargets[0].countyFips !== block.countyFips) {
          return unavailableTraceRecord(block, "county_boundary_conflict");
        }
        return directTraceRecord(block, pointTargets[0].unitId, "census_internal_point");
      }
    }

    if (block.splitEvidence != null) {
      if (block.splitEvidence.basis !== "population" && block.splitEvidence.basis !== "housing") {
        throw new Error(`${block.blockGeoid} split evidence basis is unsupported`);
      }
      if (!Array.isArray(block.splitEvidence.points) || block.splitEvidence.points.length === 0) {
        return unavailableTraceRecord(block, "zero_information_split");
      }
      const weights = new Map<string, number>();
      for (const [index, evidence] of block.splitEvidence.points.entries()) {
        const point = normalizePosition(
          evidence.position,
          `${block.blockGeoid} split evidence point ${index}`,
        );
        if (!pointInGeometry(point, geometry)) {
          throw new Error(
            `${block.blockGeoid} split evidence point ${index} lies outside its source geometry`,
          );
        }
        const weight = requirePositiveInteger(
          evidence.weight,
          `${block.blockGeoid} split evidence weight ${index}`,
        );
        const targets = mapUnits.filter((unit) => pointInGeometry(point, unit.geometry));
        if (targets.length > 1) {
          throw new Error(`${block.blockGeoid} split evidence lies in overlapping map units`);
        }
        if (targets.length === 0) return unavailableTraceRecord(block, "zero_information_split");
        if (targets[0].countyFips !== block.countyFips) {
          return unavailableTraceRecord(block, "county_boundary_conflict");
        }
        weights.set(targets[0].unitId, (weights.get(targets[0].unitId) ?? 0) + weight);
      }
      if (weights.size < 2) return unavailableTraceRecord(block, "zero_information_split");
      const divisor = [...weights.values()].reduce(greatestCommonDivisor);
      const weightedTargets = [...weights].map(([unitId, weight]) => ({
        unitId,
        weight: weight / divisor,
      })).sort((left, right) => compareText(left.unitId, right.unitId));
      const denominator = weightedTargets.reduce((sum, target) => sum + target.weight, 0);
      const allocations = allocateProfileByWeights(block.profile, weightedTargets);
      const method: BlockAllocationMethod = block.splitEvidence.basis === "population"
        ? "population_weighted_split"
        : "housing_weighted_split";
      return {
        blockGeoid: block.blockGeoid,
        countyFips: block.countyFips,
        sourceProfile: block.profile,
        disposition: "allocated",
        method,
        unavailableReason: null,
        allocations: weightedTargets.map((target) => ({
          unitId: target.unitId,
          profile: allocations.get(target.unitId)!,
          evidenceWeight: { numerator: target.weight, denominator },
        })),
      };
    }

    const intersectingUnits = sameCountyUnits.filter((unit) => (
      geometriesTouchOrOverlap(geometry, unit.geometry)
    ));
    const outsideCountyIntersection = mapUnits.some((unit) => (
      unit.countyFips !== block.countyFips && geometriesTouchOrOverlap(geometry, unit.geometry)
    ));
    if (outsideCountyIntersection) {
      return unavailableTraceRecord(block, "county_boundary_conflict");
    }
    return unavailableTraceRecord(
      block,
      intersectingUnits.length > 1 ? "zero_information_split" : "no_compatible_geometry",
    );
  });

  const trace = createBlockAllocationTrace({
    artifactId: input.definition.artifactId,
    transformVersion: input.definition.transformVersion,
    blocks: traceRecords,
  });
  const sourceProfile = trace.blocks.reduce(
    (sum, block) => addProfile(sum, block.sourceProfile),
    emptyProfile(),
  );
  const modeledProfile = trace.blocks.reduce((sum, block) => {
    if (block.disposition === "allocated") addProfile(sum, block.sourceProfile);
    return sum;
  }, emptyProfile());
  const unavailableProfile = trace.blocks.reduce((sum, block) => {
    if (block.disposition === "unavailable") addProfile(sum, block.sourceProfile);
    return sum;
  }, emptyProfile());

  const unitProfiles = new Map<string, VotingAgePopulationProfile>();
  const unitBlocks = new Map<string, Set<string>>();
  const unitSplitBlocks = new Map<string, Set<string>>();
  const unitMethods = new Map<string, Set<BlockAllocationMethod>>();
  for (const block of trace.blocks) {
    if (block.disposition !== "allocated") continue;
    if (block.method == null) throw new Error(`${block.blockGeoid} allocated without a method`);
    for (const allocation of block.allocations) {
      addProfile(
        unitProfiles.get(allocation.unitId) ?? (() => {
          const profile = emptyProfile();
          unitProfiles.set(allocation.unitId, profile);
          return profile;
        })(),
        allocation.profile,
      );
      const blocks = unitBlocks.get(allocation.unitId) ?? new Set<string>();
      blocks.add(block.blockGeoid);
      unitBlocks.set(allocation.unitId, blocks);
      if (block.method === "population_weighted_split" || block.method === "housing_weighted_split") {
        const splitBlocks = unitSplitBlocks.get(allocation.unitId) ?? new Set<string>();
        splitBlocks.add(block.blockGeoid);
        unitSplitBlocks.set(allocation.unitId, splitBlocks);
      }
      const methods = unitMethods.get(allocation.unitId) ?? new Set<BlockAllocationMethod>();
      methods.add(block.method);
      unitMethods.set(allocation.unitId, methods);
    }
  }

  const units: PrecinctDemographicUnit[] = mapUnits.map((unit) => {
    const profile = unitProfiles.get(unit.unitId);
    if (!profile) return {
      unitId: unit.unitId,
      countyFips: unit.countyFips,
      geometryId: unit.geometryId,
      status: "unavailable",
      quality: "unavailable",
      allocationMethods: [],
      sourceBlockCount: 0,
      splitSourceBlockCount: 0,
      profile: null,
    };
    const methods = [...unitMethods.get(unit.unitId)!].sort();
    const hasDirect = methods.some((method) => (
      method === "whole_block_containment" || method === "census_internal_point"
    ));
    const hasSplit = methods.some((method) => (
      method === "population_weighted_split" || method === "housing_weighted_split"
    ));
    return {
      unitId: unit.unitId,
      countyFips: unit.countyFips,
      geometryId: unit.geometryId,
      status: "available",
      quality: hasDirect && hasSplit
        ? "mixed"
        : hasSplit
          ? "deterministic_population_split"
          : "direct_block_assignment",
      allocationMethods: methods,
      sourceBlockCount: unitBlocks.get(unit.unitId)!.size,
      splitSourceBlockCount: unitSplitBlocks.get(unit.unitId)?.size ?? 0,
      profile,
    };
  });

  const methodAudit = new Map<BlockAllocationMethod, {
    blockCount: number;
    allocatedVotingAgePopulation: number;
  }>();
  for (const block of trace.blocks) {
    if (block.disposition !== "allocated") continue;
    if (block.method == null) throw new Error(`${block.blockGeoid} allocated without a method`);
    const audit = methodAudit.get(block.method) ?? {
      blockCount: 0,
      allocatedVotingAgePopulation: 0,
    };
    audit.blockCount += 1;
    audit.allocatedVotingAgePopulation += block.sourceProfile.totalVotingAgePopulation;
    methodAudit.set(block.method, audit);
  }

  const artifact = createPrecinctDemographicArtifact({
    artifactId: input.definition.artifactId,
    stateCode: input.definition.stateCode,
    stateFips: input.definition.stateFips,
    electionId: input.definition.electionId,
    transformVersion: input.definition.transformVersion,
    source: input.definition.source,
    geography: {
      mapUnit: input.definition.mapUnit,
      countyBoundaryPolicy: "strict_no_cross_county_allocation",
      allocationProfileId: input.definition.allocationProfileId,
    },
    statewide: { sourceProfile, modeledProfile, unavailableProfile },
    coverage: {
      sourceBlockCount: trace.blocks.length,
      allocatedBlockCount: trace.blocks.filter((block) => block.disposition === "allocated").length,
      unavailableBlockCount: trace.blocks.filter((block) => block.disposition === "unavailable").length,
      splitBlockCount: trace.blocks.filter((block) => (
        block.method === "population_weighted_split" || block.method === "housing_weighted_split"
      )).length,
      mapUnitCount: units.length,
      availableMapUnitCount: units.filter((unit) => unit.status === "available").length,
      unavailableMapUnitCount: units.filter((unit) => unit.status === "unavailable").length,
      offMapElectionUnitCount: input.definition.offMapElectionUnitCount,
    },
    allocationMethods: [...methodAudit].map(([method, audit]) => ({ method, ...audit })),
    units,
    inferenceBoundary: {
      aggregatePopulationOnly: true,
      observedIndividualTurnout: false,
      observedIndividualCandidatePreference: false,
      ecologicalInferenceAllowed: false,
    },
    limitations: input.definition.limitations,
  });
  return createPrecinctDemographicBundle(artifact, trace);
}
