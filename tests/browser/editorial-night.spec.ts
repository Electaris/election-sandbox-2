import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  test(`editorial returns desk reconciles reported votes and preserves replay at ${viewport.width}`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize(viewport);
    await page.goto("/app/");
    await expect(page.getByRole("button", { name: "Copy scenario link" })).toBeEnabled({ timeout: 30_000 });
    const menu = page.getByRole("button", { name: "Menu", exact: true });
    if (await menu.isVisible()) await menu.click();
    await page.getByRole("button", { name: "Election Night", exact: true }).click();
    await expect(page.getByRole("button", { name: "Play", exact: true })).toBeEnabled({ timeout: 100_000 });
    if (viewport.width < 1024) await page.getByRole("button", { name: "Show analysis" }).click();
    const desk = page.getByRole("region", { name: "Three-state election night desk" });
    await expect(desk.getByRole("heading", { name: "Follow a state" })).toBeVisible();
    await expect(page.getByTestId("night-reported-total")).toHaveText("0");
    await page.getByLabel("Election night timeline", { exact: true }).fill("420000");
    await expect(page.getByTestId("night-reported-total")).not.toHaveText("0", { timeout: 30_000 });
    const asNumber = (value: string) => Number(value.replaceAll(",", ""));
    const total = asNumber(await page.getByTestId("night-reported-total").innerText());
    const votes = await desk.locator(".night-reported-candidates strong").allInnerTexts();
    expect(votes.map(asNumber).reduce((sum, value) => sum + value, 0)).toBe(total);
    const progress = await page.getByLabel("Election night timeline", { exact: true }).inputValue();
    const clock = await page.locator(".night-dock-clock strong").innerText();
    await desk.getByRole("button", { name: "View Wisconsin reported results" }).click();
    await expect(page.getByRole("region", { name: "Workspace context" })).toContainText("Wisconsin");
    await expect(desk.getByRole("button", { name: "View Wisconsin reported results" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByLabel("Election night timeline", { exact: true })).toHaveValue(progress);
    await expect(page.locator(".night-dock-clock strong")).toHaveText(clock);
    expect(asNumber(await page.getByTestId("night-reported-total").innerText())).toBe(total);
    const overflow = await desk.evaluate(root => [...root.querySelectorAll<HTMLElement>(".night-reported-total, .night-reported-candidates li, .night-state-row, .night-state-row > span")].filter(el => el.scrollWidth > el.clientWidth + 1).map(el => el.className));
    expect(overflow).toEqual([]);
    expect(await page.locator(".night-dock-clock strong").evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    expect(await page.getByRole("button", { name: "Copy scenario link" }).evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    const folder = resolve("docs/review/v0.33-editorial-election-night/screenshots");
    mkdirSync(folder, { recursive: true });
    await desk.locator(".night-reported-candidates").screenshot({ path: resolve(folder, `reported-votes-${viewport.width}.png`) });
    await desk.locator(".night-state-row").last().screenshot({ path: resolve(folder, `state-return-${viewport.width}.png`) });
    await page.locator("#analysis-inspector").evaluate(el => { el.scrollTop = 0; });
    await page.screenshot({ path: resolve(folder, `returns-analysis-${viewport.width}.png`) });
    if (viewport.width < 1024) await page.getByRole("button", { name: "Hide analysis" }).click();
    await expect.poll(() => page.evaluate(() => window.__sandboxDiagnostics?.().activeMapView?.[3] ?? -10)).toBeGreaterThan(-4);
    const dock = page.getByRole("region", { name: "Election night controls" });
    const dockBounds = await dock.boundingBox();
    for (const locator of [page.getByRole("button", { name: "Play", exact: true }), page.getByLabel("Election night timeline", { exact: true }), dock.getByRole("button", { name: "collapsed", exact: true })]) {
      const bounds = await locator.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(dockBounds!.y + dockBounds!.height + 1);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: resolve(folder, `returns-desk-${viewport.width}.png`) });
  });
}
