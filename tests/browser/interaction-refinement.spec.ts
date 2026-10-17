import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

const captures = resolve("docs/review/v0.38-interaction-refinement/screenshots");
function statePath(local = false) {
  const params = new URLSearchParams({
    scenario: "4",
    data: "us2024-pa-vtd2020-mi-precinct2024-wi-ward2025-v1",
    engine: "electaris-behavior-v2",
    activeState: "PA",
    state: "PA",
  });
  if (local) {
    params.set("county", "42003");
    params.set("vtd", "42003005870");
  }
  return `/app/?${params}`;
}

test("simple turnout editing precedes optional groups and collapsing groups preserves assumptions", async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(statePath());
  await expect(page.getByRole("button", { name: "Copy scenario link" })).toBeEnabled();
  await page.getByRole("button", { name: "Open controls", exact: true }).click();
  const advanced = page.locator(".turnout-groups-disclosure");
  await expect(advanced).not.toHaveAttribute("open");
  await expect(page.getByLabel("Non-Hispanic Black", { exact: true })).toBeHidden();
  const order = await page.locator("#laboratory-panel-behavior").evaluate((panel) => {
    const controls = ["#pa-turnout", "#pa-new-voter-share", ".turnout-effects", ".reset-button", ".turnout-groups-disclosure"];
    return controls.slice(0, -1).every((selector, index) => Boolean(
      panel.querySelector(selector)!.compareDocumentPosition(panel.querySelector(controls[index + 1])!) & Node.DOCUMENT_POSITION_FOLLOWING,
    ));
  });
  expect(order).toBe(true);
  await page.getByLabel("Participation increase", { exact: true }).press("ArrowRight");
  await page.getByLabel("Shared Harris share of added ballots", { exact: true }).press("ArrowRight");
  await expect(page.getByLabel("Participation increase", { exact: true })).toHaveValue("0.1");
  await expect(page.getByLabel("Shared Harris share of added ballots", { exact: true })).toHaveValue("56");
  mkdirSync(captures, { recursive: true });
  await page.screenshot({ path: resolve(captures, "phone-simple-turnout.png") });
  await advanced.locator("summary").press("Enter");
  await page.getByLabel("Non-Hispanic Black", { exact: true }).fill("1.2");
  await expect(page.getByRole("button", { name: "Copy scenario link" })).toBeEnabled();
  const recipe = new URL(page.url()).searchParams.getAll("recipe");
  await advanced.locator("summary").press("Enter");
  await expect(advanced).not.toHaveAttribute("open");
  await expect(advanced.locator("summary")).toContainText("Active group additions");
  expect(new URL(page.url()).searchParams.getAll("recipe")).toEqual(recipe);
  await page.reload();
  await expect(page.getByRole("button", { name: "Copy scenario link" })).toBeEnabled();
  await page.getByRole("button", { name: "Open controls", exact: true }).click();
  await expect(advanced).toHaveAttribute("open");
  await expect(page.getByLabel("Non-Hispanic Black", { exact: true })).toHaveValue("1.2");
  await page.getByRole("button", { name: "Reset PA to exact baseline" }).click();
  await expect(page.getByLabel("Participation increase", { exact: true })).toHaveValue("0");
  await expect(page.getByLabel("Non-Hispanic Black", { exact: true })).toHaveValue("0");
});

test("phone local inspection keeps a complete identity and explicitly statewide editing scope", async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(statePath(true));
  await expect(page.getByRole("button", { name: "Copy scenario link" })).toBeEnabled();
  await page.getByRole("button", { name: "working", exact: true }).click();
  await page.getByRole("tab", { name: "Inspector", exact: true }).click();
  const identity = page.locator(".inspector-heading > div > strong");
  await expect(identity).toHaveText("PITTSBURGH WARD 01 DISTRICT 01");
  const nameFits = await identity.evaluate((element) => element.scrollWidth <= element.clientWidth + 1
    && getComputedStyle(element).whiteSpace === "normal");
  expect(nameFits).toBe(true);
  await expect(page.locator(".drawer-intent > strong")).toHaveText("Inspector");
  mkdirSync(captures, { recursive: true });
  await page.screenshot({ path: resolve(captures, "phone-local-identity.png") });
  await page.getByRole("tab", { name: "Behavior", exact: true }).click();
  await expect(page.locator(".editor-scope-note")).toContainText("These controls apply across Pennsylvania");
  await expect(page.locator(".drawer-intent .overline")).toHaveText("Statewide assumptions · Pennsylvania");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  await page.screenshot({ path: resolve(captures, "phone-local-edit-scope.png") });
  await page.setViewportSize({ width: 320, height: 740 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  const header = await page.getByRole("region", { name: "Workspace context" }).boundingBox();
  expect(header!.height).toBeLessThan(300);
  await page.getByRole("tab", { name: "Inspector", exact: true }).click();
  expect(await identity.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  await page.screenshot({ path: resolve(captures, "narrow-phone-local-identity.png") });
});
