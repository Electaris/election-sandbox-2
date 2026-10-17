import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { listDetailedStateManifests } from "../../src/data/detailedStateManifest.ts";
import { getDetailedStateRuntimeAdapter } from "../../src/data/detailedStateRuntimeLoaders.ts";
import { buildDetailedStateDemographicEvidenceContract } from "../../src/data/demographicEvidence.ts";
import { applyBehaviorScenario } from "../../packages/election-model/src/scenario.ts";
import { states2024 } from "../../src/data/states.ts";

export const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
export const textSha256 = (bytes) => sha256(bytes.toString("utf8").replaceAll("\r\n", "\n"));
const canonical = (value) => Array.isArray(value) ? value.map(canonical)
  : value !== null && typeof value === "object"
    ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])])) : value;
export const encode = (value) => JSON.stringify(canonical(value)) + "\n";

function exactKeys(value, keys, label) {
  assert.ok(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  assert.deepEqual(Object.keys(value).sort(), [...keys].sort(), `${label} has unknown or missing fields`);
}

export function localPath(root, path) {
  assert.ok(typeof path === "string" && /^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(path), "Invalid inventory path");
  assert.ok(!path.split("/").some((part) => part === ".." || part === "." || !part), "Invalid inventory path");
  const target = resolve(root, path);
  assert.ok(target.startsWith(resolve(root) + sep), "Inventory path leaves repository");
  return target;
}

export async function verifyFilePins(root, files, read = readFile) {
  assert.ok(files && typeof files === "object" && !Array.isArray(files), "Missing file pins");
  const verified = new Map();
  for (const [path, digest] of Object.entries(files).sort(([a], [b]) => a.localeCompare(b))) {
    assert.match(digest, /^[0-9a-f]{64}$/, "Invalid SHA-256 pin");
    const bytes = await read(localPath(root, path));
    assert.equal(textSha256(bytes), digest, `Unreviewed file drift: ${path}`);
    verified.set(path, bytes);
  }
  return verified;
}

export function validateRegistry(registry, manifests) {
  exactKeys(registry, ["schemaVersion", "reviewId", "fileHashEncoding", "decisionPath", "publicDeliveryAuthorized", "humanValidationComplete", "files", "states"], "Registry");
  assert.equal(registry.schemaVersion, "sandbox-foundation-retention-policy-v1");
  assert.equal(registry.reviewId, "v0.29e-three-state-retention");
  assert.equal(registry.fileHashEncoding, "utf8-lf", "Unsupported source-text hash encoding");
  assert.equal(registry.publicDeliveryAuthorized, false, "This review cannot authorize public delivery");
  assert.equal(registry.humanValidationComplete, false, "Technical checks are not human validation");
  assert.ok(registry.files[registry.decisionPath], "Decision must be pinned");
  assert.deepEqual(registry.states.map((s) => s.stateCode).sort(), manifests.map((m) => m.code).sort(), "Must review exactly the registered states once");
  for (const state of registry.states) {
    exactKeys(state, ["stateCode", "outcome", "replacementGate", "reason", "evidencePaths", "compiler", "expectedGroupComposition"], "State decision");
    assert.equal(state.outcome, "retain_existing", "Replacement admission requires a new reviewed policy and runtime integration");
    assert.ok(["no_demonstrated_improvement", "source_hold", "not_proposed"].includes(state.replacementGate), "Unknown replacement gate");
    assert.equal(state.replacementGate, { MI: "source_hold", PA: "no_demonstrated_improvement", WI: "not_proposed" }[state.stateCode], "Replacement gate contradicts the reviewed decision");
    assert.ok(typeof state.reason === "string" && state.reason.trim(), "Missing retention reason");
    assert.equal(typeof state.expectedGroupComposition, "boolean");
    assert.ok(Array.isArray(state.evidencePaths) && state.evidencePaths.length > 0, "Missing review evidence");
    assert.equal(new Set(state.evidencePaths).size, state.evidencePaths.length, "Duplicate review evidence");
    exactKeys(state.compiler, ["scriptPath", "configurationPaths", "reproduce"], "Compiler inventory");
    assert.ok(Array.isArray(state.compiler.configurationPaths) && state.compiler.configurationPaths.length > 0, "Missing compiler configuration");
    assert.ok(typeof state.compiler.reproduce === "string" && state.compiler.reproduce.trim(), "Missing reproduction command");
    for (const path of [...state.evidencePaths, state.compiler.scriptPath, ...state.compiler.configurationPaths]) {
      assert.ok(registry.files[path], `Unpinned review/compiler input: ${path}`);
    }
  }
}

const voteFields = ["harrisVotes", "trumpVotes", "steinVotes", "oliverVotes", "residualOtherVotes", "otherVotes", "totalVotes"];
const zeroSettings = { turnoutIncreasePoints: 0, addedVoterHarrisShare: 0.5, preferenceShiftPoints: 0,
  thirdPartyCandidate: "stein", thirdPartyShiftPoints: 0, thirdPartyHarrisExchangeShare: 0.5 };

export async function checkFoundations(root, registry, options = {}) {
  const manifests = options.manifests ?? listDetailedStateManifests();
  validateRegistry(registry, manifests);
  const verified = await verifyFilePins(root, registry.files, options.readFile);
  const json = (path) => {
    assert.ok(verified.has(path), `Required file is not pinned: ${path}`);
    return JSON.parse(verified.get(path).toString("utf8"));
  };
  const decisions = new Map(registry.states.map((s) => [s.stateCode, s]));
  const rows = [];
  for (const manifest of [...manifests].sort((a, b) => a.code.localeCompare(b.code))) {
    const decision = decisions.get(manifest.code);
    const artifactPath = `public/${manifest.runtime.artifactPath}`;
    const document = json(artifactPath);
    const demographicRegistry = json(manifest.sources.demographicRegistryPath);
    const electionRegistry = json(manifest.sources.electionRegistryPath);
    const geometry = json(`public/${manifest.geography.precinctGeometryManifestPath}`);
    assert.equal(demographicRegistry.artifact.path, artifactPath, "Registry/runtime artifact mismatch");
    assert.equal(demographicRegistry.artifact.sha256, registry.files[artifactPath], "Registry artifact digest mismatch");
    assert.equal(sha256(verified.get(artifactPath)), demographicRegistry.artifact.sha256, "Runtime artifact bytes changed");
    assert.equal(verified.get(artifactPath).length, manifest.runtime.artifactByteSize, "Runtime byte size drift");
    assert.equal(verified.get(artifactPath).length, demographicRegistry.artifact.byteSize, "Source registry byte size drift");
    assert.equal(document.schemaVersion, manifest.runtime.schemaVersion, "Runtime schema drift");
    assert.equal(document.encoding, manifest.runtime.encoding, "Runtime encoding drift");
    assert.equal(geometry.stateCode, manifest.code, "Geometry state mismatch");
    assert.equal(geometry.electionId, manifest.election.contestId, "Geometry election mismatch");
    assert.equal(geometry.stateFips, manifest.geography.countyFipsPrefix, "Geometry county prefix mismatch");
    const shardPaths = geometry.counties.map((county) => {
      assert.match(county.dataUrl, /^\.\/data\/[a-z]{2}\/2024\/precincts\/[0-9]{5}\.topo\.json$/, "Unexpected geometry shard path");
      const path = `public/${county.dataUrl.slice(2)}`;
      assert.ok(path.startsWith(`public/data/${manifest.code.toLowerCase()}/`), "Cross-state geometry shard");
      assert.ok(verified.has(path), `Unpinned geometry shard: ${path}`);
      assert.equal(verified.get(path).length, county.byteSize, `Geometry shard byte size drift: ${path}`);
      return path;
    });
    assert.equal(new Set(shardPaths).size, shardPaths.length, "Duplicate geometry shard");
    const adapter = getDetailedStateRuntimeAdapter(manifest.runtime.loader);
    assert.ok(adapter, "No admitted runtime adapter");
    const foundation = adapter.decode(document);
    assert.equal(foundation.stateCode, manifest.code, "Runtime state mismatch");
    assert.equal(foundation.electionId, `${manifest.election.contestId}-${manifest.code.toLowerCase()}`, "Runtime election mismatch");
    const evidence = buildDetailedStateDemographicEvidenceContract(foundation);
    assert.equal(evidence.composition.status === "available", decision.expectedGroupComposition, "Unreviewed group capability change");
    assert.equal(evidence.coverage.terrainUnitCount, geometry.totals.geometryFeatureCount, "Terrain coverage drift");
    const units = adapter.toBehaviorModelUnits(foundation);
    assert.equal(new Set(units.map((u) => u.id)).size, units.length, "Duplicate model identity");
    const baseline = applyBehaviorScenario(units, zeroSettings);
    assert.deepEqual(baseline.totals, foundation.totals.certifiedVotes, "Zero-change certified baseline drift");
    const national = states2024.find((state) => state.code === manifest.code);
    for (const field of ["harrisVotes", "trumpVotes", "otherVotes", "totalVotes"]) {
      assert.equal(baseline.totals[field], national[field], "Detailed/national baseline drift");
    }
    const original = new Map(units.map((u) => [u.id, u]));
    for (const u of baseline.units) {
      const before = original.get(u.id);
      for (const field of [...voteFields, "geometryId", "countyFips"]) assert.equal(u[field], before[field], "Zero-change local baseline drift");
    }
    const offMap = units.filter((u) => u.geometryId === null);
    const offMapVotes = Object.fromEntries(voteFields.map((f) => [f, offMap.reduce((n, u) => n + u[f], 0)]));
    assert.deepEqual(offMapVotes, foundation.totals.residualVotes, "Off-map accounting drift");
    const probe = () => applyBehaviorScenario(units, { ...zeroSettings, demographicTurnoutIncreasePoints: { non_hispanic_white: 1 } });
    if (decision.expectedGroupComposition) assert.equal(probe().demographicTurnout.status, "applied", "Runtime group capability drift");
    else assert.throws(probe, /Group-specific demographic behavior is unavailable/, "Unavailable composition must reject group assumptions");
    rows.push({ stateCode: manifest.code, outcome: decision.outcome, replacementGate: decision.replacementGate,
      reason: decision.reason, replacementAdmissionAuthorized: false, runtime: manifest.runtime,
      artifactSha256: registry.files[artifactPath], compiler: decision.compiler,
      sourceInventory: { demographic: demographicRegistry.source, election: electionRegistry.sources ?? electionRegistry.source,
        geometry: geometry.geometrySource }, evidencePaths: [...decision.evidencePaths].sort(),
      demographicEvidence: evidence, baselineVotes: baseline.totals, offMapVotes, modelUnitCount: units.length,
      geometryShardCount: shardPaths.length,
      offMapModelUnitCount: offMap.length, baselineVerified: true, groupCapabilityVerified: true });
  }
  return { schemaVersion: "sandbox-foundation-retention-check-v1", reviewId: registry.reviewId,
    decisionPath: registry.decisionPath, policySha256: sha256(encode({ ...registry, states: [...registry.states].sort((a, b) => a.stateCode.localeCompare(b.stateCode)) })), fileHashEncoding: registry.fileHashEncoding, filePins: registry.files,
    outcome: "retain_existing_foundations", replacementAdmissionAuthorized: false,
    publicDeliveryAuthorized: false, humanValidationComplete: false, states: rows };
}

export function renderReport(report) {
  return ["# v0.29E foundation admission and retention checks", "",
    "**All three existing foundations pass the recorded retention checks. No replacement is admitted.**", "",
    "| State | Decision | Replacement gate | Terrain units | Group composition | Baseline ballots | Off-map ballots |",
    "|---|---|---|---:|---|---:|---:|",
    ...report.states.map((s) => `| ${s.stateCode} | ${s.outcome} | ${s.replacementGate} | ${s.demographicEvidence.coverage.terrainUnitCount} | ${s.demographicEvidence.composition.status} | ${s.baselineVotes.totalVotes} | ${s.offMapVotes.totalVotes} |`), "",
    ...report.states.flatMap((s) => [`## ${s.stateCode}`, "", s.reason, "",
      `Runtime: \`${s.runtime.artifactPath}\`. SHA-256: \`${s.artifactSha256}\`.`, "",
      `Compiler reproduction: \`${s.compiler.reproduce}\`.`, "",
      `Evidence: ${s.evidencePaths.map((p) => `[${p.split("/").at(-1)}](../../../${p})`).join(", ")}.`, ""]),
    "## What this check establishes", "",
    "Pinned runtime artifacts, all 222 county map files, source registries, geometry manifests, compiler inputs, and review evidence match the retention decision. Actual runtime adapters decode the artifacts. The zero-change scenario preserves every model unit and reproduces both certified detailed totals and the national baseline. Off-map votes reconcile separately. A group-turnout probe verifies PA/MI capability and Wisconsin's explicit rejection of unsupported group assumptions.", "",
    "This is an offline build-time check. It does not contact sources, reconstruct raw imports, certify boundaries, infer voter preferences, enable new capabilities, or migrate runtime data. Full source reproduction remains documented in the pinned state-specific compiler configuration. Michigan's candidate and Sturgis sensitivities remain held; Pennsylvania's comparison is Adams-only; Wisconsin has no replacement proposal.", "",
    "## Replacement admission path", "",
    "A replacement requires a reviewed source inventory and compiler configuration, a validated v0.29A artifact plus trace, conserved county-bounded allocation, comparison against the retained foundation, resolution of source/quality holds, and an explicit decision bound to the candidate fingerprints. Its runtime adapter and capabilities must then pass integrated tests. Changing a status flag or passing this retention checker cannot admit a candidate. This policy deliberately rejects replacement-admission requests; a future migration needs a new reviewed policy and runtime integration.", "",
    "Both production build commands verify this report before compiling the app. Run `npm run verify:foundations`; regenerate reviewed outputs with `npm run data:v029e:review`. Do not refresh pins merely to make a failure pass.", "",
    "Technical retention is separate from deferred human validation and the recorded public/paid delivery gates. Both remain incomplete. See [verification](VERIFICATION.md), [reproduction](REPRODUCE.md), and [decision 0063](../../decisions/0063-foundation-retention-build-gate.md).", ""].join("\n");
}
