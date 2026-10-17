import { readFile, mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { checkFoundations, encode, renderReport } from "./lib/foundation-admission.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const policy = new URL("../data-sources/foundation-retention-policy.json", import.meta.url);
const output = new URL("../docs/review/v0.29e-foundation-retention/", import.meta.url);
const args = process.argv.slice(2);
if (args.some((arg) => !["--verify", "--reverse"].includes(arg))) throw new Error("Supported arguments: --verify, --reverse");
const registry = JSON.parse(await readFile(policy, "utf8"));
if (args.includes("--reverse")) {
  registry.states.reverse();
  registry.files = Object.fromEntries(Object.entries(registry.files).reverse());
}
const report = await checkFoundations(root, registry);
const outputs = { "retention-check.json": encode(report), "REVIEW.md": renderReport(report) };
if (!args.includes("--verify")) await mkdir(output, { recursive: true });
for (const [name, contents] of Object.entries(outputs)) {
  const target = new URL(name, output);
  if (args.includes("--verify")) {
    if (await readFile(target, "utf8") !== contents) throw new Error(`Unreviewed retention output drift: ${name}`);
  } else await writeFile(target, contents);
}
console.log(`${args.includes("--verify") ? "Verified" : "Wrote"} three-state retention report: PA / MI / WI; no replacement admitted.`);
