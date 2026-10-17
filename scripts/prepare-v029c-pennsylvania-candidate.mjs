import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createInterface } from "node:readline";
import { open } from "shapefile";

// Raw sources are deliberately outside public/. No runtime artifact is written.
const root = resolve(process.argv[2] ?? "work/v029c");
const registry = JSON.parse(await readFile("data-sources/pennsylvania/v029c-adams-candidate-sources.json", "utf8"));
for (const [base, entries] of [[root, registry.rawFiles], [process.cwd(), registry.repositoryFiles]]) {
  for (const [path, expected] of Object.entries(entries)) {
    const hash = createHash("sha256");
    for await (const chunk of createReadStream(resolve(base, path))) hash.update(chunk);
    if (hash.digest("hex") !== expected) throw new Error(`Source checksum mismatch: ${path}`);
  }
}
console.log("Verified archives, extracted members, admitted foundation, and election linkage.");

async function lines(path, visit) {
  for await (const line of createInterface({ input: createReadStream(resolve(root, path)), crlfDelay: Infinity })) {
    if (line) visit(line.split("|"));
  }
}
function integer(value) {
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value))) throw new Error(`Invalid count: ${value}`);
  return Number(value);
}
const byRecord = new Map();
const byGeoid = new Map();
await lines("pl94/pageo2020.pl", (f) => {
  if (f[2] !== "750" || f[12] + f[14] !== registry.countyFips) return;
  if (f[9] !== f[12] + f[14] + f[32] + f[34] || !/^\d{15}$/.test(f[9])) throw new Error("Invalid block identity");
  if (byRecord.has(f[7]) || byGeoid.has(f[9])) throw new Error("Duplicate Census block");
  const block = { blockGeoid: f[9], countyFips: registry.countyFips, profile: null, geometry: null,
    internalPoint: [Number(f[93]), Number(f[92])], splitEvidence: null };
  byRecord.set(f[7], block);
  byGeoid.set(f[9], block);
});
await lines("pl94/pa000022020.pl", (f) => {
  const block = byRecord.get(f[4]);
  if (!block) return;
  if (f[3] !== "02" || block.profile) throw new Error("Invalid or duplicate P4 segment");
  block.profile = {
    totalVotingAgePopulation: integer(f[76]), hispanic_any_race: integer(f[77]),
    non_hispanic_white: integer(f[80]), non_hispanic_black: integer(f[81]),
    non_hispanic_asian: integer(f[83]),
    non_hispanic_other: [82, 84, 85, 86].reduce((n, i) => n + integer(f[i]), 0),
  };
  const { totalVotingAgePopulation, ...groups } = block.profile;
  if (Object.values(groups).reduce((a, b) => a + b, 0) !== totalVotingAgePopulation) throw new Error("P4 groups do not reconcile");
});
if (!byGeoid.size || [...byGeoid.values()].some((b) => !b.profile)) throw new Error("Missing block P4 evidence");

async function shapes(stem, visit) {
  const projection = await readFile(resolve(root, `${stem}.prj`), "utf8");
  if (!projection.startsWith('GEOGCS["GCS_North_American_1983"')) throw new Error("Expected native Census NAD83 longitude/latitude");
  const source = await open(resolve(root, `${stem}.shp`), resolve(root, `${stem}.dbf`));
  for (;;) {
    const result = await source.read();
    if (result.done) break;
    const p = result.value.properties;
    if (p.STATEFP20 + p.COUNTYFP20 === registry.countyFips) visit(result.value);
  }
}
const mapUnits = [];
await shapes("vtd/tl_2020_42_vtd20", ({ properties: p, geometry }) => {
  mapUnits.push({ unitId: p.GEOID20, geometryId: p.GEOID20, countyFips: registry.countyFips, geometry });
});
const geometryIds = new Set();
await shapes("blocks/tl_2020_42_tabblock20", ({ properties: p, geometry }) => {
  const block = byGeoid.get(p.GEOID20);
  if (!block || geometryIds.has(p.GEOID20)) throw new Error(`Extra or duplicate block geometry: ${p.GEOID20}`);
  geometryIds.add(p.GEOID20);
  block.geometry = geometry;
});
// Missing geometry stays null; the compiler preserves its population as unavailable.
const foundation = JSON.parse(await readFile("public/data/pa/2020/vtd-demographics.json", "utf8"));
const crosswalk = JSON.parse(await readFile("data-sources/pennsylvania/2024-vtd-crosswalk.json", "utf8"));
const results = JSON.parse(await readFile("public/data/pa/2024/reporting-units.json", "utf8"));
const linked = new Set(crosswalk.matchedGeometry.flatMap((m) => m.reportingUnits.map((u) => u.reportingUnitId)));
const offMap = results.reportingUnits.filter((u) => u.countyFips === registry.countyFips && !linked.has(u.id));
const expectedMapIds = foundation.vtdRows.filter((r) => r[0].startsWith(registry.countyFips)).map((r) => r[0]).sort();
if (JSON.stringify(mapUnits.map((u) => u.unitId).sort()) !== JSON.stringify(expectedMapIds)) throw new Error("Candidate and admitted terrain identities differ");
const input = {
  definition: {
    artifactId: registry.id, stateCode: "PA", stateFips: "42", electionId: foundation.electionId,
    transformVersion: "reference-block-to-election-unit-v1", coordinateReferenceSystem: "EPSG:4269", mapUnit: "vtd",
    source: {
      demographicSourceId: "census-2020-pl94-pa-block-p4", precinctGeometrySourceId: "census-tiger-2020-pa-vtd",
      electionResultSourceId: "pa-2024-normalized-reporting-units", demographicVintage: "2020", mapVintage: "2020", electionVintage: "2024",
      sourceTable: "P4: population age 18 and over, Hispanic origin and race",
      checksums: { demographic: `sha256:${registry.rawFiles["pa2020.pl.zip"]}`, precinctGeometry: `sha256:${registry.rawFiles["tl_2020_42_vtd20.zip"]}`,
        electionResults: `sha256:${registry.repositoryFiles["public/data/pa/2024/reporting-units.json"]}` },
    },
    allocationProfileId: "pa-adams-native-nad83-block-to-vtd-v1", offMapElectionUnitCount: offMap.length,
    limitations: [
      registry.scope,
      "All source and target coordinates are native EPSG:4269 NAD83 longitude/latitude; no datum conversion or simplification.",
      "Artifact statewide profiles describe the bounded county input only, not all Pennsylvania.",
      "2020 VAP is neither 2024 eligible voters nor citizen voting-age population.",
      "2020 VTD terrain does not establish exact 2024 precinct boundaries; existing exact-ID and canonical-name links remain unchanged.",
      "No population or housing split evidence is supplied; unresolved blocks remain unavailable.",
      "Census disclosure avoidance applies; aggregate composition does not identify turnout or candidate preference.",
      "Comparison only: no runtime admission or migration.",
    ],
  },
  mapUnits: mapUnits.sort((a, b) => a.unitId.localeCompare(b.unitId)),
  sourceBlocks: [...byGeoid.values()].sort((a, b) => a.blockGeoid.localeCompare(b.blockGeoid)),
};
await mkdir(root, { recursive: true });
const normalized = JSON.stringify(input) + "\n";
if (createHash("sha256").update(normalized).digest("hex") !== registry.normalizedInput.sha256) {
  throw new Error("Prepared input differs from the frozen normalized source");
}
await writeFile(resolve(root, "normalized-input.json"), normalized);
console.log(JSON.stringify({ blocks: byGeoid.size, blockGeometries: geometryIds.size, mapUnits: mapUnits.length, offMapUnits: offMap.length }));
