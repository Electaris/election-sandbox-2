import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { copyFile, lstat, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join, resolve, sep } from "node:path";

export const VERSION = "0.30.0-rc.1";
export const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
export const encode = (value) => JSON.stringify(value, null, 2) + "\n";
const order = (a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0;
const gates = Object.freeze({ localOwnerReview: true, externalDeliveryAuthorized: false, humanAcceptanceComplete: false, demographicMigration: false });

export async function inventory(directory, skip = []) {
  const rows = [];
  async function walk(relative) {
    const location = join(directory, relative);
    assert.ok(!(await lstat(location)).isSymbolicLink(), `Symlink is not a package input: ${location}`);
    for (const entry of await readdir(location, { withFileTypes: true })) {
      if (skip.includes(entry.name)) continue;
      const path = relative ? `${relative}/${entry.name}` : entry.name;
      assert.ok(!entry.isSymbolicLink(), `Symlink is not a package input: ${path}`);
      if (entry.isDirectory()) await walk(path);
      else {
        assert.ok(entry.isFile(), `Unsupported input: ${path}`);
        const bytes = await readFile(join(directory, path));
        rows.push({ path, byteSize: bytes.length, sha256: hash(bytes) });
      }
    }
  }
  await walk("");
  return rows.sort(order);
}

export function validateRows(rows) {
  assert.ok(Array.isArray(rows) && rows.length > 0, "Empty file inventory");
  assert.equal(new Set(rows.map((r) => r.path)).size, rows.length, "Duplicate file identity");
  for (const row of rows) {
    assert.deepEqual(Object.keys(row).sort(), ["byteSize", "path", "sha256"]);
    assert.match(row.path, /^[A-Za-z0-9_][A-Za-z0-9_. /-]*$/);
    assert.ok(!row.path.split("/").some((p) => ["", ".", ".."].includes(p)), "Invalid package path");
    assert.ok(Number.isSafeInteger(row.byteSize) && row.byteSize >= 0, "Invalid byte count");
    assert.match(row.sha256, /^[a-f0-9]{64}$/);
  }
}

export function makeManifest(files, inputs, provenance) {
  validateRows(files);
  validateRows(inputs);
  const paths = new Set(files.map((f) => f.path));
  for (const path of ["app/index.html", "app/app/index.html", "review/SCOPE.md", "review/ACCEPTANCE.md", "review/DELIVERY.md"]) {
    assert.ok(paths.has(path), `Missing package entry: ${path}`);
  }
  assert.ok(files.every((f) => f.path.startsWith("app/") || f.path.startsWith("review/")), "Unexpected package root");
  assert.ok(files.every((f) => !f.path.split("/").some((part) => part.startsWith("."))), "Hidden files are not release assets");
  assert.deepEqual(Object.keys(provenance).sort(), ["gitHead", "workingTreeDirty"]);
  assert.match(provenance.gitHead, /^[a-f0-9]{40}$/);
  assert.equal(typeof provenance.workingTreeDirty, "boolean");
  const payload = { schemaVersion: "sandbox-local-release-candidate-v1", version: VERSION,
    gates, provenance, inputs: [...inputs].sort(order), files: [...files].sort(order) };
  return { ...payload, contentId: hash(encode(payload)) };
}

export async function verifyCandidate(directory, manifest) {
  assert.deepEqual(manifest, makeManifest(manifest.files, manifest.inputs, manifest.provenance), "Candidate metadata/identity drift");
  const actual = (await inventory(directory)).filter((f) => f.path !== "manifest.json");
  assert.deepEqual(actual, manifest.files, "Candidate file drift (missing, extra, or changed bytes)");
  return manifest;
}

export async function ensureDirectory(root, relative) {
  const absoluteRoot = resolve(root);
  let current = absoluteRoot;
  for (const part of relative.split("/")) {
    assert.ok(part && ![".", ".."].includes(part) && !part.includes("\\") && !part.includes(":"), "Invalid output path");
    current = resolve(current, part);
    assert.ok(current.startsWith(absoluteRoot + sep), "Output leaves workspace");
    try { await mkdir(current); } catch (error) { if (error.code !== "EEXIST") throw error; }
    const info = await lstat(current);
    assert.ok(info.isDirectory() && !info.isSymbolicLink(), "Output must be a real directory");
  }
  return current;
}

export async function writeCandidate(root, manifest, sources) {
  assert.deepEqual(manifest, makeManifest(manifest.files, manifest.inputs, manifest.provenance), "Invalid candidate identity");
  const parent = await ensureDirectory(root, `outputs/${VERSION}`);
  const destination = join(parent, manifest.contentId);
  let exists = false;
  try { await lstat(destination); exists = true; } catch (error) { if (error.code !== "ENOENT") throw error; }
  if (exists) {
    assert.deepEqual(JSON.parse(await readFile(join(destination, "manifest.json"), "utf8")), manifest, "Existing candidate differs");
    await verifyCandidate(destination, manifest);
  } else {
    await ensureDirectory(root, `outputs/${VERSION}/${manifest.contentId}`);
    for (const file of manifest.files) {
      const pieces = file.path.split("/");
      await ensureDirectory(destination, pieces.slice(0, -1).join("/"));
      assert.ok(sources.has(file.path), `Missing copy source: ${file.path}`);
      await copyFile(sources.get(file.path), join(destination, file.path));
    }
    await writeFile(join(destination, "manifest.json"), encode(manifest), { flag: "wx" });
    await verifyCandidate(destination, manifest);
  }
  await writeFile(join(parent, "latest.json"), encode({ version: VERSION, contentId: manifest.contentId }));
  return destination;
}
