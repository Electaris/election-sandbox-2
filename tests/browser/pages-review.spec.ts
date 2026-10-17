import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

test("Pages subpath loads methodology, local workers, saved scenarios and replay", async ({ page, baseURL }) => {
  test.setTimeout(180_000);
  const entry = new URL("/election-sandbox-2/", baseURL).href;
  const broken: string[] = [];
  page.on("response", (response) => {
    if (response.url().startsWith(new URL(entry).origin) && response.status() >= 400) broken.push(`${response.status()} ${response.url()}`);
  });
  await page.goto(entry);
  await page.getByRole("link", { name: "Calculations & methodology", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Calculations & methodology", exact: true })).toBeVisible();
  if (process.env.SANDBOX_REVIEW_SCREENSHOT_DIR) {
    mkdirSync(process.env.SANDBOX_REVIEW_SCREENSHOT_DIR, { recursive: true });
    await page.screenshot({ path: resolve(process.env.SANDBOX_REVIEW_SCREENSHOT_DIR, "methodology.png") });
  }
  await page.getByRole("link", { name: "Open the laboratory", exact: true }).click();
  await expect(page).toHaveURL(/\/election-sandbox-2\/app\/$/);
  await page.getByRole("button", { name: "Pennsylvania", exact: true }).first().click();
  await expect(page.getByRole("button", { name: "Copy scenario link" })).toBeEnabled();
  await page.getByRole("button", { name: "Open controls", exact: true }).click();
  await page.getByRole("button", { name: "Preference", exact: true }).click();
  await page.getByRole("slider", { name: "Two-party preference transfer" }).fill("2.5");
  await expect(page.locator(".selected-readout")).toContainText("D +0.8");
  await page.reload();
  await expect(page.locator(".selected-readout")).toContainText("D +0.8");
  expect(new URL(page.url()).pathname).toBe("/election-sandbox-2/app/");
  await page.getByRole("button", { name: "Election Night", exact: true }).click();
  await expect(page.getByRole("button", { name: "Play", exact: true })).toBeEnabled({ timeout: 100_000 });
  await page.getByRole("button", { name: "Next return", exact: true }).click();
  await expect(page.locator(".night-dock-clock small")).not.toContainText("0 ballots");
  await page.getByRole("button", { name: "Edit Swingometer", exact: true }).click();
  await expect(page.locator(".selected-readout")).toContainText("D +0.8");
  expect(broken).toEqual([]);
  if (process.env.SANDBOX_REVIEW_SCREENSHOT_DIR) await page.screenshot({ path: resolve(process.env.SANDBOX_REVIEW_SCREENSHOT_DIR, "pages-laboratory.png") });
});
