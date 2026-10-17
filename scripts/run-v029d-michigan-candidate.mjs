import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
if (args.some((arg) => !["--verify", "--reverse", "--test", "--normalized", "--sturgis-review", "--evidence-review"].includes(arg))) {
  throw new Error("Supported arguments: --verify, --reverse, --test, --normalized, --sturgis-review, --evidence-review");
}
const isTest = args.includes("--test");
const isReview = args.includes("--sturgis-review");
const isEvidence = args.includes("--evidence-review");
if ([isReview, isEvidence, args.includes("--normalized")].filter(Boolean).length > 1) throw new Error("Choose one candidate or review mode");
const script = fileURLToPath(new URL(isEvidence
  ? (isTest ? "../tests/test_michigan_evidence_review.py" : "./review-v029d3-evidence.py")
  : isReview
  ? (isTest ? "../tests/test_sturgis_review.py" : "./review-v029d2-sturgis.py")
  : isTest ? (args.includes("--normalized") ? "../tests/test_michigan_normalization.py" : "../tests/test_michigan_candidate.py") : "./compile-v029d-michigan-candidate.py", import.meta.url));
const forwarded = args.filter((arg) => arg !== "--test" && arg !== "--sturgis-review" && arg !== "--evidence-review" && !(isTest && arg === "--normalized"));
const geoPython = process.env.SANDBOX_GEO_PYTHON;
let child;
if (!geoPython && process.platform === "win32" && existsSync("C:/OSGeo4W/bin/python-qgis.bat")) {
  const quote = (text) => `'${text.replaceAll("'", "''")}'`;
  child = spawn("powershell.exe", ["-NoProfile", "-Command",
    `& 'C:/OSGeo4W/bin/python-qgis.bat' ${[script, ...forwarded].map(quote).join(" ")}; exit $LASTEXITCODE`],
  { stdio: "inherit", windowsHide: true });
} else {
  child = spawn(geoPython ?? "python3", [script, ...forwarded], { stdio: "inherit", windowsHide: true });
}
child.on("error", (error) => { console.error(error.message); process.exitCode = 1; });
child.on("exit", (code) => { process.exitCode = code ?? 1; });
