import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  test(`premium inspector reading and disclosure at ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/app/");
    await expect(page.getByRole("button", { name: "Copy scenario link" })).toBeEnabled({ timeout: 30_000 });
    if (viewport.width < 1024) await page.getByRole("button", { name: /Show analysis/i }).click();
    const disclosure = page.locator(".inspector-disclosure");
    const votes = page.getByLabel("Scenario national popular vote by candidate");
    await expect(votes).toBeHidden();
    await expect(page.getByTestId("candidate-electoral-votes-harris")).toContainText("226");
    await expect(page.getByTestId("candidate-electoral-votes-trump")).toContainText("312");
    const recipe = page.url();
    await disclosure.locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(votes).toBeVisible();
    await expect(votes).toContainText("Stein");
    await page.keyboard.press("Space");
    await expect(votes).toBeHidden();
    expect(page.url()).toBe(recipe);
    expect(await page.getByTestId("candidate-electoral-votes-harris").locator("strong").evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBe(56);
    expect(await page.locator(".target-selector button").first().evaluate(el => el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(viewport.width < 800 ? 44 : 36);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    const folder = resolve("docs/review/v0.31b-inspector/screenshots");
    mkdirSync(folder, { recursive: true });
    await page.screenshot({ path: resolve(folder, `inspector-${viewport.width}.png`) });
  });
}
