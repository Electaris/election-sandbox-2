import { createPrecinctDemographicBundle } from "../../packages/data-contracts/src/precinctDemographicArtifact.ts";

export const PROFILE_FIELDS = {
  totalVotingAgePopulation: "votingAgePopulation", hispanic_any_race: "hispanicAnyRace",
  non_hispanic_white: "nonHispanicWhite", non_hispanic_black: "nonHispanicBlack",
  non_hispanic_asian: "nonHispanicAsian", non_hispanic_other: "nonHispanicOther",
};
const voteFields = ["harrisVotes", "trumpVotes", "steinVotes", "oliverVotes", "residualOtherVotes"];
const empty = () => Object.fromEntries(Object.keys(PROFILE_FIELDS).map((key) => [key, 0]));
const sum = (profiles) => profiles.reduce((total, profile) => {
  for (const key of Object.keys(total)) total[key] += profile[key];
  return total;
}, empty());
const difference = (left, right) => Object.fromEntries(Object.keys(PROFILE_FIELDS).map((key) => [key, left[key] - right[key]]));
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export function comparePennsylvaniaCandidate({ bundle, foundation, crosswalk, results, countyFips }) {
  const { artifact, trace } = createPrecinctDemographicBundle(bundle.artifact, bundle.trace);
  if (artifact.stateCode !== "PA" || artifact.geography.mapUnit !== "vtd"
    || artifact.electionId !== foundation.electionId || !/^42\d{3}$/.test(countyFips)) throw new Error("Incompatible comparison scope");
  if (artifact.units.some((u) => u.countyFips !== countyFips)
    || trace.blocks.some((b) => b.countyFips !== countyFips)) throw new Error("Candidate crosses comparison county");
  if (foundation.schemaVersion !== 3 || foundation.encoding !== "vtd-row-v1") throw new Error("Unsupported admitted foundation");
  const fields = foundation.vtdFields;
  for (const f of ["geoid", ...Object.values(PROFILE_FIELDS), ...voteFields, "exactSourceUnitCount", "canonicalSourceUnitCount"]) {
    if (fields.filter((x) => x === f).length !== 1) throw new Error(`Missing or duplicate admitted field: ${f}`);
  }
  const baselineRows = foundation.vtdRows.map((r) => Object.fromEntries(fields.map((f, i) => [f, r[i]])))
    .filter((r) => r.geoid.startsWith(countyFips)).sort((a, b) => a.geoid.localeCompare(b.geoid));
  const baselineById = new Map(baselineRows.map((r) => [r.geoid, r]));
  if (baselineById.size !== baselineRows.length || !equal([...baselineById.keys()], artifact.units.map((u) => u.unitId).sort())
    || artifact.units.some((u) => u.geometryId !== u.unitId)) throw new Error("Candidate terrain does not match admitted VTD identity");
  const resultById = new Map(results.reportingUnits.map((u) => [u.id, u]));
  if (resultById.size !== results.reportingUnits.length) throw new Error("Duplicate reporting unit");
  const linked = new Set();
  const matchByGeometry = new Map();
  for (const match of crosswalk.matchedGeometry) {
    if (matchByGeometry.has(match.geometryId)) throw new Error("Duplicate crosswalk geometry");
    matchByGeometry.set(match.geometryId, match);
    for (const link of match.reportingUnits) {
      const unit = resultById.get(link.reportingUnitId);
      if (!unit || linked.has(unit.id) || unit.countyFips !== match.geometryId.slice(0, 5)) throw new Error("Invalid, duplicate, or cross-county result linkage");
      if (!["exact_vtd_identifier", "exact_canonical_name"].includes(link.matchMethod)) throw new Error("Unsupported result link method");
      linked.add(unit.id);
    }
  }
  const local = artifact.units.map((unit) => {
    const admitted = baselineById.get(unit.unitId);
    const profile = Object.fromEntries(Object.entries(PROFILE_FIELDS).map(([key, field]) => [key, admitted[field]]));
    if (Object.values(profile).some((v) => !Number.isSafeInteger(v) || v < 0)
      || profile.totalVotingAgePopulation !== Object.entries(profile).filter(([k]) => k !== "totalVotingAgePopulation").reduce((n, [, v]) => n + v, 0)) throw new Error("Invalid admitted profile");
    const links = matchByGeometry.get(unit.unitId)?.reportingUnits ?? [];
    for (const field of voteFields) {
      if (links.reduce((n, l) => n + resultById.get(l.reportingUnitId)[field], 0) !== admitted[field]) throw new Error("Result votes differ from admitted foundation");
    }
    const exact = links.filter((l) => l.matchMethod === "exact_vtd_identifier").length;
    if (exact !== admitted.exactSourceUnitCount || links.length - exact !== admitted.canonicalSourceUnitCount) throw new Error("Result method drift");
    const groupShareDeltaPp = unit.profile && unit.profile.totalVotingAgePopulation > 0 && profile.totalVotingAgePopulation > 0
      ? Object.fromEntries(Object.keys(PROFILE_FIELDS).filter((key) => key !== "totalVotingAgePopulation").map((key) => [key,
        100 * (unit.profile[key] / unit.profile.totalVotingAgePopulation - profile[key] / profile.totalVotingAgePopulation)])) : null;
    return { unitId: unit.unitId, name: admitted.censusName, status: unit.status, quality: unit.quality,
      sourceBlockCount: unit.sourceBlockCount, splitBlockCount: unit.splitSourceBlockCount,
      admittedProfile: profile, candidateProfile: unit.profile,
      delta: unit.profile ? difference(unit.profile, profile) : null, groupShareDeltaPp,
      resultLinks: { exactIdentifier: exact, canonicalName: links.length - exact },
      mappedVotes: voteFields.reduce((n, field) => n + admitted[field], 0) };
  });
  const offMapStatewide = results.reportingUnits.filter((u) => !linked.has(u.id)).map((u) => ({
    id: u.id, countyFips: u.countyFips, type: u.type, totalVotes: u.totalVotes,
  })).sort((a, b) => a.id.localeCompare(b.id));
  const offMapPilot = offMapStatewide.filter((u) => u.countyFips === countyFips);
  if (artifact.coverage.offMapElectionUnitCount !== offMapPilot.length) throw new Error("Off-map election count drift");
  const admittedProfile = sum(local.map((r) => r.admittedProfile));
  const unavailableReasons = Object.fromEntries([...new Set(trace.blocks.map((b) => b.unavailableReason).filter(Boolean))].sort().map((reason) => {
    const blocks = trace.blocks.filter((b) => b.unavailableReason === reason);
    return [reason, { blockCount: blocks.length, profile: sum(blocks.map((b) => b.sourceProfile)) }];
  }));
  const matchedUnits = local.filter((u) => u.resultLinks.exactIdentifier + u.resultLinks.canonicalName > 0);
  const matchedAvailable = matchedUnits.filter((u) => u.candidateProfile != null);
  return {
    schemaVersion: "pa-demographic-candidate-comparison-v1",
    scope: { stateCode: "PA", countyFips, countyName: "Adams", statewide: false, terrain: "2020 Census VTD", electionVintage: "2024" },
    verdict: { decision: "retain_existing_vtd_foundation", migrationAuthorized: false, strictlyBetterEvidenceDemonstrated: false,
      reasons: ["A bounded county pilot cannot establish statewide replacement quality.",
        "The candidate uses the same 2020 geography and demographic vintage; block trace adds auditability, not fresher evidence.",
        "Existing 2024 result linkage is reused and verified, so election linkage coverage does not improve."] },
    coverage: artifact.coverage,
    composition: { admittedProfile, candidateSourceProfile: artifact.statewide.sourceProfile,
      candidateModeledProfile: artifact.statewide.modeledProfile, candidateUnavailableProfile: artifact.statewide.unavailableProfile,
      sourceDelta: difference(artifact.statewide.sourceProfile, admittedProfile),
      modeledDelta: difference(artifact.statewide.modeledProfile, admittedProfile),
      identicalUnitCount: local.filter((u) => u.delta && Object.values(u.delta).every((v) => v === 0)).length,
      changedUnitCount: local.filter((u) => u.delta && Object.values(u.delta).some((v) => v !== 0)).length,
      maxAbsoluteGroupShareDeltaPp: Math.max(0, ...local.flatMap((u) => Object.values(u.groupShareDeltaPp ?? {}).map(Math.abs))) },
    allocationMethods: artifact.allocationMethods, unavailableReasons,
    countyIntegrity: { crossCountyAllocationCount: 0, checkedBlockCount: trace.blocks.length },
    linkage: { admittedMappedVtdCount: matchedUnits.length, candidateAvailableMappedVtdCount: matchedAvailable.length,
      admittedMappedVotes: matchedUnits.reduce((n, u) => n + u.mappedVotes, 0),
      candidateAvailableMappedVotes: matchedAvailable.reduce((n, u) => n + u.mappedVotes, 0),
      exactIdentifierSourceUnitCount: local.reduce((n, u) => n + u.resultLinks.exactIdentifier, 0),
      canonicalNameSourceUnitCount: local.reduce((n, u) => n + u.resultLinks.canonicalName, 0),
      offMapPilot, offMapStatewide,
      statewideResidualVotes: offMapStatewide.filter((u) => u.countyFips == null).reduce((n, u) => n + u.totalVotes, 0),
      statewideOffMapVotes: offMapStatewide.reduce((n, u) => n + u.totalVotes, 0) },
    local,
  };
}
