import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import { compileReferencePrecinctDemographics } from "../packages/demographic-compiler/src/referenceCompiler.ts";
import { fingerprintBlockAllocationTrace, fingerprintPrecinctDemographicArtifact, fingerprintPrecinctDemographicBundle,
  serializePrecinctDemographicArtifact, serializePrecinctDemographicBundle } from "../packages/data-contracts/src/precinctDemographicArtifact.ts";
import { comparePennsylvaniaCandidate } from "./lib/pennsylvania-candidate-comparison.mjs";

const args = process.argv.slice(2);
if (args.some((arg) => !["--verify", "--reverse"].includes(arg))) throw new Error("Usage: npm run data:v029c:pa -- [--verify] [--reverse]");
const sha = (data) => createHash("sha256").update(data).digest("hex");
const registry = JSON.parse(await readFile("data-sources/pennsylvania/v029c-adams-candidate-sources.json", "utf8"));
const compressed = await readFile(registry.normalizedInput.path);
if (sha(compressed) !== registry.normalizedInput.compressedSha256) throw new Error("Normalized source checksum mismatch");
const normalized = gunzipSync(compressed);
if (sha(normalized) !== registry.normalizedInput.sha256) throw new Error("Normalized source content checksum mismatch");
for (const [path, expected] of Object.entries(registry.repositoryFiles)) {
  if (sha(await readFile(path)) !== expected) throw new Error(`Admitted evidence checksum drift: ${path}`);
}
const input = JSON.parse(normalized);
if (args.includes("--reverse")) { input.mapUnits.reverse(); input.sourceBlocks.reverse(); }
console.log(`Compiling ${registry.scope}: ${input.sourceBlocks.length} blocks, ${input.mapUnits.length} VTDs.`);
const bundle = compileReferencePrecinctDemographics(input);
const json = async (path) => JSON.parse(await readFile(path, "utf8"));
const foundation = await json("public/data/pa/2020/vtd-demographics.json");
const report = comparePennsylvaniaCandidate({ bundle, foundation,
  crosswalk: await json("data-sources/pennsylvania/2024-vtd-crosswalk.json"),
  results: await json("public/data/pa/2024/reporting-units.json"), countyFips: registry.countyFips });
const serialized = serializePrecinctDemographicBundle(bundle) + "\n";
report.fingerprints = {
  normalizedInput: `sha256:${sha(normalized)}`,
  artifact: await fingerprintPrecinctDemographicArtifact(bundle.artifact),
  trace: await fingerprintBlockAllocationTrace(bundle.trace), bundle: await fingerprintPrecinctDemographicBundle(bundle),
  sources: registry.repositoryFiles,
};
const admittedSlice = { encoding: foundation.encoding, vtdFields: foundation.vtdFields,
  vtdRows: foundation.vtdRows.filter((r) => r[0].startsWith(registry.countyFips)) };
report.bytes = { candidateArtifact: Buffer.byteLength(serializePrecinctDemographicArtifact(bundle.artifact) + "\n"),
  candidateBundleWithTrace: Buffer.byteLength(serialized), normalizedInput: normalized.length,
  normalizedInputGzip: compressed.length, admittedPilotRowsWithFieldList: Buffer.byteLength(JSON.stringify(admittedSlice) + "\n"),
  admittedStatewideRuntime: (await readFile("public/data/pa/2020/vtd-demographics.json")).length,
  note: "Pilot row slice omits shared statewide metadata; candidate artifact includes metadata. Trace and geometry input are build-time evidence, not runtime payload." };
const output = "docs/review/v0.29c-pennsylvania-comparison";
await mkdir(output, { recursive: true });
const summary = `# v0.29C Pennsylvania candidate comparison\n\n`
  + `Scope: **Adams County only (42001)**, all ${report.coverage.sourceBlockCount.toLocaleString("en-US")} Census blocks and ${report.coverage.mapUnitCount} VTDs. This is not statewide validation.\n\n`
  + `Verdict: **retain the existing VTD foundation; no migration**. The candidate does not demonstrate strictly better evidence.\n\n`
  + `| Measure | Admitted VTD foundation | Block candidate |\n|---|---:|---:|\n`
  + `| Available VTDs in pilot | ${report.local.length} | ${report.coverage.availableMapUnitCount} |\n`
  + `| Population age 18+ | ${report.composition.admittedProfile.totalVotingAgePopulation} | ${report.composition.candidateModeledProfile.totalVotingAgePopulation} |\n`
  + `| VTDs with linked results | ${report.linkage.admittedMappedVtdCount} | ${report.linkage.candidateAvailableMappedVtdCount} |\n`
  + `| Linked 2024 ballots | ${report.linkage.admittedMappedVotes} | ${report.linkage.candidateAvailableMappedVotes} |\n`
  + `| Pilot row slice / candidate artifact bytes* | ${report.bytes.admittedPilotRowsWithFieldList} | ${report.bytes.candidateArtifact} |\n\n`
  + `*The admitted slice includes rows and field names; the candidate includes its own metadata. The full candidate with build-time trace is ${report.bytes.candidateBundleWithTrace} bytes.\n\n`
  + `${report.composition.identicalUnitCount} VTDs match all five groups and total VAP exactly; ${report.composition.changedUnitCount} differ. Maximum absolute group-share change: ${report.composition.maxAbsoluteGroupShareDeltaPp} percentage points.\n\n`
  + `Allocated blocks: ${report.coverage.allocatedBlockCount}; unavailable blocks: ${report.coverage.unavailableBlockCount}; split blocks: ${report.coverage.splitBlockCount}; cross-county allocations: 0. Method counts and every local comparison are in [comparison.json](comparison.json).\n\n`
  + `The result crosswalk is reused and verified, with ${report.linkage.exactIdentifierSourceUnitCount} exact-ID and ${report.linkage.canonicalNameSourceUnitCount} canonical-name source links in the pilot. The statewide off-map inventory remains ${report.linkage.offMapStatewide.length} units / ${report.linkage.statewideOffMapVotes} votes, including ${report.linkage.statewideResidualVotes} statewide-only residual votes. None is assigned to candidate terrain.\n\n`
  + `The pilot was chosen before compilation as the first Pennsylvania county by FIPS, providing a complete, bounded county without selecting units by result. It does not test an urban county, new election-cycle terrain, positive population splits, or all statewide residual conditions.\n\n`
  + `The source is [2020 Census P.L. 94-171 P4](${registry.sourceUrls.demographic}) and original [block](${registry.sourceUrls.blocks}) / [VTD](${registry.sourceUrls.vtd}) geometry. Coordinates stay in native NAD83 longitude/latitude (EPSG:4269); no simplification, datum relabeling, area weighting, or preference inference is used. The 2024 linkage still crosses vintages.\n\n`
  + `Block trace improves auditability, while composition, demographic vintage, terrain vintage, and result coverage remain unchanged. A statewide or exact-cycle replacement needs a separate comparison and admission review.\n\n`
  + `Reproduce offline: \`npm run data:v029c:pa -- --verify\`. Verify order independence: \`npm run data:v029c:pa -- --verify --reverse\`.\n\n`
  + `Artifact: \`${report.fingerprints.artifact}\`\n\nTrace: \`${report.fingerprints.trace}\`\n\nBundle: \`${report.fingerprints.bundle}\`\n`;
for (const [name, content] of [["candidate-bundle.json", serialized], ["comparison.json", JSON.stringify(report, null, 2) + "\n"], ["COMPARISON.md", summary]]) {
  const path = `${output}/${name}`;
  if (args.includes("--verify")) {
    if (await readFile(path, "utf8") !== content) throw new Error(`Reproduction differs: ${path}`);
  } else await writeFile(path, content);
}
console.log(JSON.stringify({ verified: args.includes("--verify"), coverage: report.coverage,
  identicalUnits: report.composition.identicalUnitCount, changedUnits: report.composition.changedUnitCount,
  decision: report.verdict.decision, fingerprints: report.fingerprints, bytes: report.bytes }, null, 2));
