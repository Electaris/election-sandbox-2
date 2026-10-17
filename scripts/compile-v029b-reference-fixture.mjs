import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import {
  fingerprintBlockAllocationTrace,
  fingerprintPrecinctDemographicArtifact,
  fingerprintPrecinctDemographicBundle,
  serializePrecinctDemographicBundle,
} from "../packages/data-contracts/src/precinctDemographicArtifact.ts";
import {
  compileReferencePrecinctDemographics,
} from "../packages/demographic-compiler/src/referenceCompiler.ts";

const inputPath = resolve(
  process.argv[2] ?? "data-sources/reference/v029b-precinct-demographic-fixture.json",
);
const outputPath = resolve(
  process.argv[3] ?? "tests/fixtures/v029b-reference-precinct-demographics.json",
);
const input = JSON.parse(await readFile(inputPath, "utf8"));
const bundle = compileReferencePrecinctDemographics(input);
const serialized = serializePrecinctDemographicBundle(bundle);

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${serialized}\n`, "utf8");

console.log(JSON.stringify({
  inputPath,
  outputPath,
  artifactFingerprint: await fingerprintPrecinctDemographicArtifact(bundle.artifact),
  traceFingerprint: await fingerprintBlockAllocationTrace(bundle.trace),
  bundleFingerprint: await fingerprintPrecinctDemographicBundle(bundle),
  coverage: bundle.artifact.coverage,
  statewide: bundle.artifact.statewide,
}, null, 2));
