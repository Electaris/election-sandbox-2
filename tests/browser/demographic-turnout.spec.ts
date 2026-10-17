import { expect, test } from "@playwright/test";

const DATA_VERSION = "us2024-pa-vtd2020-mi-precinct2024-wi-ward2025-v1";
const ENGINE_VERSION = "electaris-behavior-v2";

function demographicTurnoutPath(
  stateCode: "MI" | "PA" | "WI",
  groupPoints = "0,0,0,0,0",
) {
  const params = new URLSearchParams({
    scenario: "3",
    data: DATA_VERSION,
    engine: ENGINE_VERSION,
    activeState: stateCode,
    target: "harris",
    route: "fewest-states",
    view: "scenario",
    editor: "turnout",
    rank: "county",
    state: stateCode,
  });
  params.append(
    "recipe",
    `${stateCode}|2024-president|${DATA_VERSION}|${ENGINE_VERSION}|0|55|stein|0|0,50|${groupPoints}`,
  );
  return `/app/?${params.toString()}`;
}

function demographicPreferencePath(
  stateCode: "MI" | "PA" | "WI",
  groupPoints = "0,0,2.5,0,0",
  preference = "inherit;inherit;10,20,30,15,25;inherit;inherit",
) {
  const params = new URLSearchParams({
    scenario: "4",
    data: DATA_VERSION,
    engine: ENGINE_VERSION,
    activeState: stateCode,
    target: "harris",
    route: "fewest-states",
    view: "scenario",
    editor: "turnout",
    rank: "county",
    state: stateCode,
  });
  params.append(
    "recipe",
    `${stateCode}|2024-president|${DATA_VERSION}|${ENGINE_VERSION}|0|55|stein|0|0,50|${groupPoints}|${preference}`,
  );
  return `/app/?${params.toString()}`;
}

async function openTurnoutEditor(page: import("@playwright/test").Page) {
  await expect(page.getByRole("button", { name: "Copy scenario link" })).toBeEnabled({
    timeout: 30_000,
  });
  await page.getByRole("button", { name: "expanded", exact: true }).click();
  await page.getByRole("tab", { name: "Behavior", exact: true }).click();
  await expect(page.getByRole("button", { name: "Turnout", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
}

test("Pennsylvania group turnout is visible, deterministic, and URL-replayable", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto(demographicTurnoutPath("PA", "0,0,2.5,0,0"));
  await openTurnoutEditor(page);

  const blackTurnout = page.getByLabel("Non-Hispanic Black", { exact: true });
  await expect(blackTurnout).toHaveValue("2.5");
  await expect(page.locator(".demographic-turnout-editor")).toContainText(
    "aggregate 2020 VAP geography",
  );
  await expect(page.locator(".turnout-effects")).toContainText("Group-added ballots");
  await expect.poll(async () => {
    const row = page.locator(".turnout-effects > div").filter({ hasText: "Group-added ballots" });
    return (await row.locator("strong").textContent())?.trim();
  }).not.toBe("0");

  await blackTurnout.fill("3.1");
  await expect(blackTurnout).toHaveValue("3.1");
  await expect.poll(() => new URL(page.url()).searchParams.getAll("recipe")[0] ?? "").toContain(
    "|0,0,3.1,0,0",
  );

  await page.reload();
  await openTurnoutEditor(page);
  await expect(page.getByLabel("Non-Hispanic Black", { exact: true })).toHaveValue("3.1");
});

test("Michigan supports group turnout while Wisconsin remains explicitly unavailable", async ({ page }) => {
  test.setTimeout(150_000);
  await page.goto(demographicTurnoutPath("MI", "0,0,0,1.4,0"));
  await openTurnoutEditor(page);
  await expect(page.getByLabel("Non-Hispanic Asian", { exact: true })).toHaveValue("1.4");
  await expect(page.locator(".demographic-turnout-editor")).toContainText("Group turnout assumptions");

  await page.goto(demographicTurnoutPath("WI"));
  await openTurnoutEditor(page);
  const unavailable = page.locator(".demographic-turnout-unavailable");
  await expect(unavailable).toContainText("Group controls unavailable for Wisconsin");
  await expect(unavailable).toContainText("No statewide substitute is invented");
  await expect(page.locator(".demographic-turnout-list")).toHaveCount(0);
});

test("candidate-complete group preference is exact, explainable, and URL-replayable", async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto(demographicPreferencePath("PA"));
  await openTurnoutEditor(page);

  const preferenceEditor = page.locator(".demographic-preference-editor");
  await expect(preferenceEditor.getByRole("button", { name: "Non-Hispanic Black", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(preferenceEditor).toContainText("Custom five-candidate vector");

  const candidateInputs = preferenceEditor.locator('.demographic-candidate-share-list input[type="range"]');
  await expect(candidateInputs).toHaveCount(5);
  await expect(page.locator("#demographic-preference-non_hispanic_black-harris")).toHaveValue("10");
  await expect(page.locator("#demographic-preference-non_hispanic_black-trump")).toHaveValue("20");
  await expect(page.locator("#demographic-preference-non_hispanic_black-stein")).toHaveValue("30");
  await expect(page.locator("#demographic-preference-non_hispanic_black-oliver")).toHaveValue("15");
  await expect(page.locator("#demographic-preference-non_hispanic_black-residualOther")).toHaveValue("25");
  expect(await candidateInputs.evaluateAll((inputs) => inputs.reduce(
    (sum, input) => sum + Number((input as HTMLInputElement).value),
    0,
  ))).toBe(100);

  const impact = page.getByRole("region", { name: "Demographic contribution and sensitivity" });
  await expect(impact).toContainText("Exact contribution");
  await expect(impact).toContainText("Stein");
  await expect.poll(async () => (
    await impact.locator(".demographic-impact-candidate-ledger span")
      .filter({ hasText: "Stein" })
      .locator("strong")
      .textContent()
  )?.trim()).not.toBe("0");
  await expect(impact).toContainText("per 1,000 added ballots");
  await expect(impact.locator(".demographic-impact-list li").first()).toBeVisible();
  await expect(impact).toContainText("turnout operation at insertion time");

  await page.locator("#demographic-preference-non_hispanic_black-stein").fill("44");
  await expect(page.locator("#demographic-preference-non_hispanic_black-stein")).toHaveValue("44");
  expect(await candidateInputs.evaluateAll((inputs) => inputs.reduce(
    (sum, input) => sum + Number((input as HTMLInputElement).value),
    0,
  ))).toBe(100);
  await expect.poll(() => new URL(page.url()).searchParams.get("scenario")).toBe("4");
  await expect.poll(() => new URL(page.url()).searchParams.getAll("recipe")[0] ?? "").toContain(
    "inherit;inherit;8,16,44,12,20;inherit;inherit",
  );

  const savedRecipe = new URL(page.url()).searchParams.getAll("recipe")[0];
  await page.reload();
  await openTurnoutEditor(page);
  expect(new URL(page.url()).searchParams.getAll("recipe")[0]).toBe(savedRecipe);
  await expect(page.locator("#demographic-preference-non_hispanic_black-stein")).toHaveValue("44");

  await page.getByRole("button", { name: "Election Night", exact: true }).click();
  await expect(page.getByRole("button", { name: "Play", exact: true })).toBeEnabled({ timeout: 100_000 });
  expect(new URL(page.url()).searchParams.getAll("recipe")[0]).toBe(savedRecipe);
});

test("Wisconsin rejects authored group preference because compatible group cells are unavailable", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto(demographicPreferencePath("WI", "0,0,0,0,0"));
  const notice = page.getByRole("status");
  await expect(notice).toContainText("Shared scenario ignored");
  await expect(notice).toContainText("WI demographic turnout is unavailable");
});

test("group turnout editor remains single-column without mobile page overflow", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(demographicTurnoutPath("PA", "0.5,0.5,1,0.5,0.5"));
  await expect(page.getByRole("button", { name: "Copy scenario link" })).toBeEnabled({
    timeout: 30_000,
  });
  await page.getByRole("button", { name: "Open controls", exact: true }).click();
  await page.getByRole("tab", { name: "Behavior", exact: true }).click();

  const editor = page.locator(".demographic-turnout-editor");
  await expect(editor).toBeVisible();
  const columns = await page.locator(".demographic-turnout-list").evaluate(
    (element) => getComputedStyle(element).gridTemplateColumns,
  );
  expect(columns.trim().split(/\s+/)).toHaveLength(1);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});
