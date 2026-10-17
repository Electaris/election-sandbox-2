import { expect, test } from "@playwright/test";
import { states2024 } from "../../src/data/states.ts";

test("returning from a detailed scenario shows national margins, not the active state's", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/app/");
  await page.getByRole("button", { name: "Pennsylvania", exact: true }).first().click();
  await expect(page.getByRole("button", { name: "Copy scenario link" })).toBeEnabled();
  await page.getByRole("button", { name: "Open controls", exact: true }).click();
  await page.getByRole("button", { name: "Preference", exact: true }).click();
  await page.getByRole("slider", { name: "Two-party preference transfer" }).fill("2.5");
  await expect(page.locator(".selected-readout")).toContainText("D +0.8");
  await expect(page.getByRole("button", { name: "Copy scenario link" })).toBeEnabled();
  await page.getByRole("button", { name: "United States", exact: true }).click();

  const national = states2024.reduce((sum, state) => ({
    total: sum.total + state.totalVotes,
    margin: sum.margin + state.harrisVotes - state.trumpVotes,
  }), { total: 0, margin: 0 });
  const actual = (national.margin / national.total) * 100;
  // Audited PA 2.5-point transfer moves 88,234 ballots, or 176,468 margin votes.
  const scenario = ((national.margin + 176_468) / national.total) * 100;
  const readout = page.locator(".selected-readout");
  await expect(readout).toContainText("United States");
  await expect(readout.locator(".readout-margin").nth(0)).toContainText(`R +${Math.abs(actual).toFixed(1)}`);
  await expect(readout.locator(".readout-margin").nth(1)).toContainText(`R +${Math.abs(scenario).toFixed(1)}`);
  await expect(readout.locator(".shift-chip")).toContainText("+0.1 pts D");
  await page.getByRole("button", { name: "Pennsylvania", exact: true }).first().click();
  await expect(readout).toContainText("D +0.8");
});
