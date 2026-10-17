import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { VERSION, hash, inventory, makeManifest, verifyCandidate, writeCandidate } from "./lib/release-candidate.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const docs = "docs/review/v0.30-release-candidate";
const args = process.argv.slice(2);
assert.ok(args.length === 0 || (args.length === 1 && args[0] === "--verify"), "Supported argument: --verify");
const pkg = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
assert.equal(pkg.version, VERSION, "Package version is not this release candidate");

async function sourceInventory() {
  const rows = [];
  for (const folder of ["src", "packages", "scripts", "public"]) {
    rows.push(...(await inventory(join(root, folder), ["node_modules", ".git", "__pycache__"])).map((f) => ({ ...f, path: `${folder}/${f.path}` })));
  }
  for (const path of ["package.json", "package-lock.json", "index.html", "app/index.html", "vite.config.ts", "tsconfig.json",
    "data-sources/foundation-retention-policy.json", "docs/review/v0.29e-foundation-retention/retention-check.json",
    ...["SCOPE.md", "ACCEPTANCE.md", "DELIVERY.md"].map((name) => `${docs}/${name}`)]) {
    const bytes = await readFile(join(root, path));
    rows.push({ path, byteSize: bytes.length, sha256: hash(bytes) });
  }
  return rows.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
}

function npmRun(script) {
  const result = process.platform === "win32"
    ? spawnSync("cmd.exe", ["/d", "/s", "/c", `npm.cmd run ${script}`], { cwd: root, stdio: "inherit", windowsHide: true })
    : spawnSync("npm", ["run", script], { cwd: root, stdio: "inherit" });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `${script} failed; no candidate is published`);
}

if (args.includes("--verify")) {
  npmRun("verify:foundations");
  const latest = JSON.parse(await readFile(join(root, "outputs", VERSION, "latest.json"), "utf8"));
  assert.equal(latest.version, VERSION);
  assert.match(latest.contentId, /^[a-f0-9]{64}$/);
  const directory = join(root, "outputs", VERSION, latest.contentId);
  const manifest = JSON.parse(await readFile(join(directory, "manifest.json"), "utf8"));
  assert.equal(manifest.contentId, latest.contentId);
  await verifyCandidate(directory, manifest);
  assert.deepEqual(await sourceInventory(), manifest.inputs, "Workspace build inputs changed since packaging; rebuild for a new candidate");
  console.log(`Verified local candidate ${manifest.contentId}\n${directory}`);
} else {
  const before = await sourceInventory();
  npmRun("build");
  const after = await sourceInventory();
  assert.deepEqual(after, before, "Build inputs changed during compilation");
  const sources = new Map();
  const files = (await inventory(join(root, "dist"))).map((f) => {
    sources.set(`app/${f.path}`, join(root, "dist", f.path));
    return { ...f, path: `app/${f.path}` };
  });
  for (const name of ["SCOPE.md", "ACCEPTANCE.md", "DELIVERY.md"]) {
    const path = `${docs}/${name}`;
    const bytes = await readFile(join(root, path));
    files.push({ path: `review/${name}`, byteSize: bytes.length, sha256: hash(bytes) });
    sources.set(`review/${name}`, join(root, path));
  }
  const provenance = {
    gitHead: execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8", windowsHide: true }).trim(),
    workingTreeDirty: execFileSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8", windowsHide: true }).trim().length > 0,
  };
  const manifest = makeManifest(files, before, provenance);
  const destination = await writeCandidate(root, manifest, sources);
  console.log(`Packaged local owner-review candidate ${manifest.contentId}\n${destination}\nExternal delivery remains held.`);
}
