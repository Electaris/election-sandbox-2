import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";

const evidenceDirectory = process.env.SANDBOX_REVIEW_SCREENSHOT_DIR;

async function ready(page: Page) {
  await expect(page.getByRole("button", { name: "Copy scenario link" })).toBeEnabled({ timeout: 30_000 });
}

async function openTab(page: Page, name: string) {
  const tab = page.getByRole("tab", { name, exact: true });
  if (!await tab.isVisible()) await page.getByRole("button", { name: "Open controls", exact: true }).click();
  await tab.click();
}

async function capture(page: Page, name: string) {
  if (!evidenceDirectory) return;
  mkdirSync(evidenceDirectory, { recursive: true });
  await page.screenshot({ path: resolve(evidenceDirectory, `${name}.png`), animations: "disabled" });
  writeFileSync(resolve(evidenceDirectory, `${name}.json`), JSON.stringify({
    url: page.url(),
    viewport: page.viewportSize(),
    text: await page.locator("body").innerText(),
  }, null, 2) + "\n");
}

test("acceptance baseline and three-state county/local inspection preserve identity and evidence", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator(".methodology-footer")).toContainText("155,238,302 ballots");
  await page.getByRole("button", { name: "Enter the laboratory", exact: true }).first().click();
  await ready(page);
  await expect(page.getByTestId("candidate-electoral-votes-harris")).toContainText("226");
  await expect(page.getByTestId("candidate-electoral-votes-trump")).toContainText("312");
  await capture(page, "acceptance-national-baseline");

  for (const state of [
    { code: "PA", name: "Pennsylvania", units: "VTDs", evidence: "2020 Census voting districts (VTDs)", offMap: "125,172" },
    { code: "MI", name: "Michigan", units: "Precincts", evidence: "2024 precinct reporting units", offMap: "142,574" },
    { code: "WI", name: "Wisconsin", units: "Wards", evidence: "population-disaggregated", offMap: "0" },
  ]) {
    await page.getByRole("button", { name: state.name, exact: true }).first().click();
    await ready(page);
    await openTab(page, "Contributors");
    await page.getByRole("button", { name: "Result structure", exact: true }).click();
    await page.getByRole("button", { name: "Counties", exact: true }).click();
    const county = page.locator(".contribution-structure-list button").first();
    const countyName = await county.locator(".contribution-name strong").innerText();
    await county.click();
    await expect(page.getByRole("region", { name: `Data inspector for ${countyName}`, exact: true })).toBeVisible();
    expect(new URL(page.url()).searchParams.get("state")).toBe(state.code);
    await capture(page, `acceptance-${state.code}-county`);
    await openTab(page, "Contributors");
    await page.getByRole("button", { name: state.units, exact: true }).click();
    const local = page.locator(".contribution-structure-list button").first();
    const localName = await local.locator(".contribution-name strong").innerText();
    await local.click();
    await expect(page.getByRole("region", { name: `Data inspector for ${localName}`, exact: true })).toBeVisible();
    expect(new URL(page.url()).searchParams.get("state")).toBe(state.code);
    expect(new URL(page.url()).searchParams.get("vtd")).toBeTruthy();
    await capture(page, `acceptance-${state.code}-local`);
    await openTab(page, "Data");
    const ledger = page.getByRole("region", { name: `${state.name} data foundation` });
    await expect(ledger).toContainText(state.evidence);
    await expect(ledger).toContainText(`${state.offMap} off-map ballots`);
    await capture(page, `acceptance-${state.code}-evidence`);
    await page.getByRole("button", { name: "United States", exact: true }).click();
  }
});

test("acceptance PA keyboard edits preserve transfer totals and reset the local and national baseline", async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/app/");
  await page.getByRole("button", { name: "Pennsylvania", exact: true }).first().click();
  await ready(page);
  await openTab(page, "Behavior");
  await page.getByRole("button", { name: "Turnout", exact: true }).click();
  const participation = page.getByRole("slider", { name: "Participation increase", exact: true });
  await participation.focus();
  await expect(participation).toBeFocused();
  await participation.press("ArrowRight");
  await expect(participation).toHaveValue("0.1");
  await participation.press("End");
  await expect(participation).toHaveValue("1.5");
  await ready(page);
  await expect(page.locator(".model-contract")).toContainText("not CVAP or a 2024 eligibility estimate");
  await openTab(page, "Contributors");
  const firstCounty = page.locator(".contribution-list button").first();
  await firstCounty.focus();
  await firstCounty.press("ArrowDown");
  await expect(page.locator(".contribution-list button").nth(1)).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("tab", { name: "Inspector", exact: true })).toBeFocused();
  await openTab(page, "Contributors");
  await page.getByRole("button", { name: "VTDs", exact: true }).click();
  await page.locator(".contribution-list button").first().click();
  const rows = page.locator(".candidate-ledger-row");
  const baseline = await rows.locator("b").allTextContents();
  const turnoutVotes = await rows.locator("strong").allTextContents();
  const sum = (values: string[]) => values.reduce((total, value) => total + Number(value.replaceAll(",", "")), 0);
  expect(sum(turnoutVotes)).toBeGreaterThan(sum(baseline));
  await capture(page, "acceptance-mobile-local-turnout");
  await openTab(page, "Behavior");
  await page.getByRole("button", { name: "Preference", exact: true }).click();
  await page.getByRole("slider", { name: "Two-party preference transfer" }).fill("6.2");
  await ready(page);
  await expect(page.locator(".transfer-explainer")).toContainText("changes the two-candidate margin by 2 votes");
  await openTab(page, "Inspector");
  const transferred = await rows.locator("strong").allTextContents();
  expect(transferred).not.toEqual(turnoutVotes);
  expect(sum(transferred)).toBe(sum(turnoutVotes));
  await openTab(page, "Behavior");
  const reset = page.getByRole("button", { name: "Reset PA to exact baseline", exact: true });
  await reset.focus();
  await reset.press("Enter");
  await ready(page);
  await expect(reset).toBeDisabled();
  await expect(page.getByTestId("candidate-electoral-votes-harris")).toContainText("226");
  await expect(page.getByTestId("candidate-electoral-votes-trump")).toContainText("312");
  await openTab(page, "Inspector");
  expect(await rows.locator("strong").allTextContents()).toEqual(baseline);
  await expect(page.locator(".candidate-ledger-total em")).toHaveText("No change");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  await capture(page, "acceptance-mobile-exact-reset");
});

test("acceptance copied multi-state scenario reconstructs in a separate tab", async ({ page, context }) => {
  test.setTimeout(90_000);
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/app/");
  for (const name of ["Pennsylvania", "Michigan"]) {
    await page.getByRole("button", { name, exact: true }).first().click();
    await ready(page);
    await openTab(page, "Behavior");
    await page.getByRole("button", { name: "Preference", exact: true }).click();
    await page.getByRole("slider", { name: "Two-party preference transfer" }).fill("2.5");
    await ready(page);
    if (name === "Pennsylvania") await page.getByRole("button", { name: "United States", exact: true }).click();
  }
  await openTab(page, "Contributors");
  await page.locator(".contribution-list button").first().click();
  await page.getByRole("button", { name: "Copy scenario link" }).click();
  await expect(page.getByText("Scenario link copied — this URL reconstructs your current assumptions.")).toBeVisible();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  const saved = new URL(copied);
  expect(saved.searchParams.get("scenario")).toBe("4");
  expect(saved.searchParams.getAll("recipe")).toHaveLength(2);
  const originalLedger = await page.locator(".candidate-ledger").innerText();
  const replay = await context.newPage();
  await replay.goto(copied);
  await ready(replay);
  expect(new URL(replay.url()).searchParams.getAll("recipe")).toEqual(saved.searchParams.getAll("recipe"));
  for (const key of ["state", "county", "vtd"]) {
    expect(new URL(replay.url()).searchParams.get(key)).toBe(saved.searchParams.get(key));
  }
  await expect(replay.getByTestId("candidate-electoral-votes-harris")).toContainText("260");
  await expect(replay.getByTestId("candidate-electoral-votes-trump")).toContainText("278");
  await openTab(replay, "Inspector");
  await expect(replay.locator(".candidate-ledger")).toHaveText(originalLedger, { useInnerText: true });
  await capture(replay, "acceptance-copied-portfolio");
});
