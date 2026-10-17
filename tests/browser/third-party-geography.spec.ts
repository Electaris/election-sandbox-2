import { expect, test } from "@playwright/test";

const DATA_VERSION = "us2024-pa-vtd2020-mi-precinct2024-wi-ward2025-v1";
const ENGINE_VERSION = "electaris-behavior-v2";

function geographicThirdPartyPath(
  shift = 30,
  county: string | null = "42101",
  target: "harris" | "trump" | "stein" | "oliver" | "residual_other" = "harris",
) {
  const params = new URLSearchParams({
    scenario: "2",
    data: DATA_VERSION,
    engine: ENGINE_VERSION,
    activeState: "PA",
    target,
    route: "fewest-states",
    view: "scenario",
    editor: "third-party",
    rank: "county",
    state: "PA",
  });
  if (county) params.set("county", county);
  params.append(
    "recipe",
    `PA|2024-president|${DATA_VERSION}|${ENGINE_VERSION}|0|55|stein|0|${shift},50`,
  );
  return `/app/?${params.toString()}`;
}

test("a named third-party plurality is explained locally while Shift stays two-party", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto(geographicThirdPartyPath());
  await expect(page.getByRole("button", { name: "Copy scenario link" })).toBeEnabled({ timeout: 30_000 });

  const readout = page.locator(".selected-readout");
  await expect(readout).toContainText("Philadelphia County");
  await expect(readout).toContainText("Stein +");

  const legend = page.locator(".legend-row");
  await expect(legend).toContainText("Stein");
  await expect(legend).toContainText("Oliver");
  await expect(legend).toContainText("Aggregate other");
  await expect(legend).toContainText("Color: plurality winner");

  await page.getByRole("button", { name: "Shift", exact: true }).click();
  await expect(legend).toContainText("Harris vs Trump margin shift");
  await expect(legend).not.toContainText("Stein");
});

test("a statewide third-party plurality changes the result, state EV, and causal ledger", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto(geographicThirdPartyPath(50, null, "stein"));
  await expect(page.getByRole("button", { name: "Copy scenario link" })).toBeEnabled({ timeout: 30_000 });

  const readout = page.locator(".selected-readout");
  await expect(readout).toContainText("Pennsylvania");
  await expect(readout).toContainText("Stein +");
  await expect(readout).toContainText("Harris-Trump unchanged");
  await expect(page.getByLabel("Electoral College target candidate").getByRole("button", { name: "Stein" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("candidate-electoral-votes-stein")).toContainText("19");
  await expect(page.locator(".consequence-summary")).toContainText("Stein gains 19 electoral votes");
  await expect(page.locator(".threshold-lockup")).toContainText("251 EV NEEDED FOR STEIN");
  await expect(page.getByLabel("Scenario national popular vote by candidate")).toContainText("Stein");
  await expect(page.getByRole("region", { name: "Path to 270" })).toContainText("251 EV needed");

  await page.getByRole("button", { name: "All states Esc" }).click();
  await expect(page.getByText("Harris 226 · Trump 293 · Stein 19", { exact: true }).first()).toBeVisible();
});

test("Stein-leading Swingometer and Election Night docks keep plurality distinct from H-T diagnostics", async ({ page }) => {
  test.setTimeout(240_000);
  await page.goto(geographicThirdPartyPath(50, null));
  await expect(page.getByRole("button", { name: "Copy scenario link" })).toBeEnabled({ timeout: 30_000 });

  await page.getByRole("button", { name: "expanded", exact: true }).click();
  await page.getByRole("tab", { name: "Contributors", exact: true }).click();
  const explanation = page.getByRole("region", { name: "Scenario change summary" });
  await expect(explanation.locator(".analytics-summary-copy > strong")).toContainText("changes from Trump to Stein");
  await expect(explanation.getByRole("group", { name: "Actual scenario and delta" })).toContainText("Stein vote change");
  await expect(explanation.locator(".analytics-causal-chain article").nth(1)).toContainText("Stein");
  await expect(page.locator(".contribution-definition")).toContainText("Stein vote change");
  await expect(page.locator(".contribution-total")).toContainText("Stein");

  await page.getByRole("tab", { name: "Inspector", exact: true }).click();
  await expect(page.getByText(/No local geography selected/)).toBeVisible();
  await page.getByRole("tab", { name: "Behavior", exact: true }).click();
  await expect(page.locator(".effect-grid")).toContainText("Stein +");
  await page.getByRole("tab", { name: "Assumptions", exact: true }).click();
  await expect(page.getByText("Named third-party exchange", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Election Night", exact: true }).click();
  const play = page.getByRole("button", { name: "Play", exact: true });
  await expect(play).toBeEnabled({ timeout: 100_000 });
  await page.getByLabel("Election night timeline").fill("1000000");
  await expect(page.locator(".night-state-ledger .night-state-row").first()).toContainText("Stein +", { timeout: 30_000 });
  await page.getByRole("button", { name: "expanded", exact: true }).click();

  await page.getByRole("tab", { name: "Live", exact: true }).click();
  await expect(page.locator(".night-live-states button").first()).toContainText("Stein +");
  await expect(page.locator(".night-live-lead")).toContainText("Three-state reported plurality");
  await expect(page.locator(".night-window-headlines")).toContainText("30 minute H-T movement");
  await expect(page.locator(".night-return-tape li strong").first()).toContainText("in this return");

  await page.getByRole("tab", { name: "Timeline", exact: true }).click();
  await expect(page.getByRole("tab", { name: "Vote share", exact: true })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("img", { name: "Reported candidate share timeline. Click to seek the count." })).toBeVisible();
  await expect(page.locator(".night-timeline-readout")).toContainText("Stein +");
  await expect(page.locator(".night-timeline-panel")).not.toContainText("Republican lead");

  await page.getByRole("tab", { name: "Returns", exact: true }).click();
  await expect(page.locator(".night-return-metrics")).toContainText("Reported plurality");
  await expect(page.locator(".night-return-metrics")).toContainText("Stein +");
  await expect(page.getByRole("region", { name: "Logical return windows" })).toContainText("Window plurality");
  await expect(page.getByRole("region", { name: "Recent geographic movers" })).toContainText("County H-T movers");

  await page.getByRole("tab", { name: "Method", exact: true }).click();
  await expect(page.locator(".night-method-grid")).toContainText("Plurality first");
  await expect(page.locator(".night-method-grid")).toContainText("Secondary and explicit");
});

test("certified and Stein-leading contribution structures remain candidate-complete and inspectable", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto(geographicThirdPartyPath(50, null, "stein"));
  await expect(page.getByRole("button", { name: "Copy scenario link" })).toBeEnabled({ timeout: 30_000 });

  await page.getByRole("button", { name: "expanded", exact: true }).click();
  await page.getByRole("tab", { name: "Contributors", exact: true }).click();
  await page.getByRole("button", { name: "Result structure", exact: true }).click();

  const comparison = page.locator(".contribution-structure-comparison");
  await expect(comparison.locator("article").nth(0)).toContainText("Certified structure");
  await expect(comparison.locator("article").nth(0)).toContainText("Trump");
  await expect(comparison.locator("article").nth(1)).toContainText("Scenario structure");
  await expect(comparison.locator("article").nth(1)).toContainText("Stein");
  await expect(page.locator(".contribution-footnote")).toContainText("compared against their own runner-up");

  const firstScenarioAnchor = comparison.locator("article").nth(1).locator("ol button").first();
  await firstScenarioAnchor.press("ArrowDown");
  await expect(comparison.locator("article").nth(1).locator("ol button").nth(1)).toBeFocused();
  await firstScenarioAnchor.click();
  await expect(page.getByRole("tab", { name: "Inspector", exact: true })).toHaveAttribute("aria-selected", "true");
  await expect(page.locator(".inspector-card")).toContainText("Certified plurality");
  await expect(page.locator(".inspector-card")).toContainText("Scenario plurality");
  await expect(page.locator(".inspector-card")).toContainText("H-T movement diagnostic");
  await expect(page.getByRole("button", { name: "Contributors", exact: true }).last()).toBeVisible();
});

test("contribution structure becomes one column without mobile overflow", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(geographicThirdPartyPath(50, null, "stein"));
  await expect(page.getByRole("button", { name: "Copy scenario link" })).toBeEnabled({ timeout: 30_000 });

  await page.getByRole("button", { name: "Open controls", exact: true }).click();
  await page.getByRole("tab", { name: "Contributors", exact: true }).click();
  await page.getByRole("button", { name: "Result structure", exact: true }).click();
  const comparison = page.locator(".contribution-structure-comparison");
  await expect(comparison).toBeVisible();
  const columns = await comparison.evaluate((element) => getComputedStyle(element).gridTemplateColumns);
  expect(columns.trim().split(/\s+/)).toHaveLength(1);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
