import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import test from "node:test";
import { VERSION, hash, makeManifest, validateRows, verifyCandidate, writeCandidate } from "../scripts/lib/release-candidate.mjs";

const paths = ["app/index.html", "app/app/index.html", "review/SCOPE.md", "review/ACCEPTANCE.md", "review/DELIVERY.md"];
const provenance = { gitHead: "a".repeat(40), workingTreeDirty: true };
const row = (path) => ({ path, byteSize: 4, sha256: hash("test") });
const inputs = [row("src/App.tsx")];
const manifest = () => makeManifest(paths.map(row), inputs, provenance);

async function fixture(t) {
  const parent = resolve(tmpdir());
  const root = await mkdtemp(join(parent, "sandbox-v030-test-"));
  t.after(async () => {
    assert.ok(resolve(root).startsWith(parent + sep + "sandbox-v030-test-"));
    await rm(root, { recursive: true, force: true });
  });
  const source = join(root, "source.txt");
  await writeFile(source, "test");
  return { root, sources: new Map(paths.map((path) => [path, source])) };
}

test("candidate identity is deterministic, order-independent, and has explicit unpassed gates", () => {
  const first = manifest();
  assert.deepEqual(first, makeManifest([...paths].reverse().map(row), inputs, provenance));
  assert.equal(first.gates.externalDeliveryAuthorized, false);
  assert.equal(first.gates.humanAcceptanceComplete, false);
  assert.equal(first.gates.demographicMigration, false);
  assert.notEqual(first.contentId, makeManifest(paths.map(row), [row("src/Changed.tsx")], provenance).contentId);
});

test("package paths reject traversal, duplicate identity, missing entry points, and hidden assets", () => {
  for (const path of ["../outside", "/outside", "C:/outside", "app/../outside", "app\\outside", "app//outside"]) {
    assert.throws(() => validateRows([row(path)]));
  }
  assert.throws(() => makeManifest(paths.map(row).slice(1), inputs, provenance), /Missing package entry/);
  assert.throws(() => makeManifest([...paths, paths[0]].map(row), inputs, provenance), /Duplicate/);
  assert.throws(() => makeManifest([...paths, "app/.env"].map(row), inputs, provenance), /Hidden files/);
});

test("writing and verifying a candidate preserves an existing identical package", async (t) => {
  const { root, sources } = await fixture(t);
  const value = manifest();
  const directory = await writeCandidate(root, value, sources);
  assert.deepEqual(await verifyCandidate(directory, value), value);
  assert.equal(await writeCandidate(root, value, sources), directory);
  assert.equal(JSON.parse(await readFile(join(root, "outputs", VERSION, "latest.json"), "utf8")).contentId, value.contentId);
});

test("changed or additional package bytes fail; an existing candidate is never silently repaired", async (t) => {
  const { root, sources } = await fixture(t);
  const value = manifest();
  const directory = await writeCandidate(root, value, sources);
  await writeFile(join(directory, "app/index.html"), "changed");
  await assert.rejects(verifyCandidate(directory, value), /Candidate file drift/);
  await assert.rejects(writeCandidate(root, value, sources), /Candidate file drift/);
  await writeFile(join(directory, "app/index.html"), "test");
  await writeFile(join(directory, "extra.txt"), "extra");
  await assert.rejects(verifyCandidate(directory, value), /Candidate file drift/);
});

test("altered metadata cannot claim human acceptance or external authorization", async (t) => {
  const { root, sources } = await fixture(t);
  const value = manifest();
  const directory = await writeCandidate(root, value, sources);
  const changed = structuredClone(value);
  changed.gates.externalDeliveryAuthorized = true;
  changed.gates.humanAcceptanceComplete = true;
  await assert.rejects(verifyCandidate(directory, changed), /metadata\/identity drift/);
  await assert.rejects(writeCandidate(root, { ...value, contentId: "../../outside" }, sources), /Invalid candidate identity/);
});
