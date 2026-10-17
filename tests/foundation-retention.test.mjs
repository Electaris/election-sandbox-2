import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { checkFoundations, encode, localPath, renderReport, textSha256, validateRegistry, verifyFilePins } from "../scripts/lib/foundation-admission.mjs";
import { listDetailedStateManifests } from "../src/data/detailedStateManifest.ts";

const root = fileURLToPath(new URL("../", import.meta.url));
const registry = JSON.parse(await readFile(new URL("../data-sources/foundation-retention-policy.json", import.meta.url), "utf8"));
const review = new URL("../docs/review/v0.29e-foundation-retention/", import.meta.url);
const manifests = listDetailedStateManifests();

test("reviewed retained foundations reproduce canonical report, exact baselines, and distinct capabilities", async () => {
  const report = await checkFoundations(root, registry);
  assert.equal(encode(report), await readFile(new URL("retention-check.json", review), "utf8"));
  assert.equal(renderReport(report), await readFile(new URL("REVIEW.md", review), "utf8"));
  assert.equal(report.replacementAdmissionAuthorized, false);
  assert.equal(report.publicDeliveryAuthorized, false);
  assert.equal(report.humanValidationComplete, false);
  const byState = new Map(report.states.map((s) => [s.stateCode, s]));
  assert.deepEqual(report.states.map((s) => s.stateCode), ["MI", "PA", "WI"]);
  assert.equal(byState.get("PA").baselineVotes.totalVotes, 7058732);
  assert.equal(byState.get("MI").baselineVotes.totalVotes, 5664186);
  assert.equal(byState.get("WI").baselineVotes.totalVotes, 3422918);
  assert.equal(byState.get("PA").offMapVotes.totalVotes, 125172);
  assert.equal(byState.get("MI").offMapVotes.totalVotes, 142574);
  assert.equal(byState.get("WI").offMapVotes.totalVotes, 0);
  assert.equal(report.states.reduce((n, s) => n + s.geometryShardCount, 0), 222);
  assert.equal(byState.get("MI").demographicEvidence.composition.status, "available");
  assert.equal(byState.get("PA").demographicEvidence.composition.status, "available");
  assert.equal(byState.get("WI").demographicEvidence.composition.status, "unavailable");
  assert.equal(byState.get("WI").demographicEvidence.capability.futureGroupTurnoutAssumptionsEligible, false);
});

test("state, manifest, and file enumeration order do not change report identity", async () => {
  const reversed = structuredClone(registry);
  reversed.states.reverse();
  reversed.files = Object.fromEntries(Object.entries(reversed.files).reverse());
  const report = await checkFoundations(root, reversed, { manifests: [...manifests].reverse() });
  assert.equal(encode(report), await readFile(new URL("retention-check.json", review), "utf8"));
});

test("missing, duplicated, unknown states and unknown policy fields fail", () => {
  for (const mutate of [
    (r) => r.states.pop(),
    (r) => { r.states[1] = r.states[0]; },
    (r) => { r.states[0].stateCode = "OH"; },
    (r) => { r.approved = true; },
    (r) => { r.states[0].approved = true; },
  ]) {
    const changed = structuredClone(registry);
    mutate(changed);
    assert.throws(() => validateRegistry(changed, manifests));
  }
});

test("retention cannot be relabeled as admission, source resolution, public delivery, or human validation", () => {
  for (const mutate of [
    (r) => { r.states[0].outcome = "admit_replacement"; },
    (r) => { r.states[0].replacementGate = "no_demonstrated_improvement"; },
    (r) => { r.publicDeliveryAuthorized = true; },
    (r) => { r.humanValidationComplete = true; },
    (r) => { r.states[0].compiler.configurationPaths = []; },
    (r) => { delete r.files[r.decisionPath]; },
    (r) => { delete r.files[r.states[0].evidencePaths[0]]; },
  ]) {
    const changed = structuredClone(registry);
    mutate(changed);
    assert.throws(() => validateRegistry(changed, manifests));
  }
});

test("source text tolerates checkout newline conversion but content drift fails", async () => {
  const original = Buffer.from("review\nretain_existing\n");
  const pins = { "docs/review.txt": textSha256(original) };
  await verifyFilePins(root, pins, async () => Buffer.from("review\r\nretain_existing\r\n"));
  await assert.rejects(verifyFilePins(root, pins, async () => Buffer.from("review\nadmit_replacement\n")), /Unreviewed file drift/);
});

test("inventory rejects traversal, absolute paths, URLs, and malformed pins before reading", async () => {
  for (const path of ["../outside", "docs/../outside", "/outside", "C:/outside", "https://example.com", "docs\\outside", "docs//outside"]) {
    assert.throws(() => localPath(root, path), /Invalid inventory path/);
  }
  await assert.rejects(verifyFilePins(root, { "docs/review.txt": "invalid" }, async () => {
    assert.fail("Malformed hash must fail before reading");
  }), /Invalid SHA-256/);
});

test("unpinned bytes and cross-state runtime routing fail without refreshing review pins", async () => {
  const changed = structuredClone(manifests);
  const mi = changed.find((m) => m.code === "MI");
  mi.runtime.artifactPath = "data/pa/2020/vtd-demographics.json";
  await assert.rejects(checkFoundations(root, registry, { manifests: changed }), /Registry\/runtime artifact mismatch/);
  await assert.rejects(checkFoundations(root, registry, { readFile: async (path) => {
    const bytes = await readFile(path);
    return path.endsWith("ward-demographics.json") ? Buffer.concat([bytes, Buffer.from(" ")]) : bytes;
  } }), /Unreviewed file drift/);
});

test("Wisconsin cannot acquire group capability through a retention-policy flag", async () => {
  const changed = structuredClone(registry);
  changed.states.find((s) => s.stateCode === "WI").expectedGroupComposition = true;
  await assert.rejects(checkFoundations(root, changed), /Unreviewed group capability change/);
});

test("a county map cannot disappear from the checksum inventory while its manifest stays present", async () => {
  const changed = structuredClone(registry);
  delete changed.files["public/data/mi/2024/precincts/26001.topo.json"];
  await assert.rejects(checkFoundations(root, changed), /Unpinned geometry shard/);
});
