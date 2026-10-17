import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";
import { majorPartyBands } from "../../src/map/atlasPalette";

const directory = resolve("docs/review/v0.35-art-direction/screenshots");

for (const viewport of [{ width: 1440, height: 900 }, { width: 1024, height: 768 }, { width: 390, height: 844 }]) {
  test(`static editorial composition and complete workspace review at ${viewport.width}`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("/");
    await expect(page.locator(".atlas-map-viewport canvas")).toBeVisible();
    await expect(page.locator(".home-headline-line").first()).toHaveCSS("opacity", "1");
    const colors = await page.locator(".atlas-margin-swatches i").evaluateAll(elements => elements.map(element => (element as HTMLElement).style.backgroundColor));
    const expected = [...[...majorPartyBands].reverse().map(band => band.dem), ...majorPartyBands.map(band => band.gop)];
    expect(colors).toHaveLength(expected.length);
    for (let index = 0; index < expected.length; index++) {
      await expect(page.locator(".atlas-margin-swatches i").nth(index)).toHaveCSS("background-color", `rgb(${expected[index].slice(1).match(/../g)!.map(value => parseInt(value, 16)).join(", ")})`);
    }
    mkdirSync(directory, { recursive: true });
    await page.screenshot({ path: resolve(directory, `opening-${viewport.width}.png`) });
    await page.locator(".workspace-layout").screenshot({ path: resolve(directory, `composition-${viewport.width}.png`) });
    for (const selector of [".home-state-section", ".home-experiences", ".home-method-story"]) {
      await page.locator(selector).screenshot({ path: resolve(directory, `${selector.slice(1)}-${viewport.width}.png`) });
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.getByRole("button", { name: "Explore Pennsylvania", exact: true }).click();
    await expect(page.getByRole("button", { name: "Copy scenario link" })).toBeEnabled({ timeout: 30_000 });
    await page.getByRole("button", { name: "collapsed", exact: true }).click();
    if (viewport.width < 1024) await page.getByRole("button", { name: "Show analysis" }).click();
    await page.screenshot({ path: resolve(directory, `analysis-${viewport.width}.png`) });
    if (viewport.width < 1024) await page.getByRole("button", { name: "Hide analysis" }).click();
    await page.getByRole("button", { name: "working", exact: true }).click();
    await page.getByRole("tab", { name: "Behavior", exact: true }).click();
    await page.screenshot({ path: resolve(directory, `editor-${viewport.width}.png`) });
    for (const tab of ["Contributors", "Inspector", "Assumptions", "Data"]) {
      await page.getByRole("tab", { name: tab, exact: true }).click();
      if (tab === "Inspector") {
        const heading = await page.locator(".drawer-empty strong").boundingBox();
        const description = await page.locator(".drawer-empty span").boundingBox();
        expect(description!.y).toBeGreaterThanOrEqual(heading!.y + heading!.height);
      }
      await page.screenshot({ path: resolve(directory, `${tab.toLowerCase()}-${viewport.width}.png`) });
    }
    expect(await page.locator(".evidence-grid small").first().evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(11);
    const menu = page.getByRole("button", { name: "Menu", exact: true });
    if (await menu.isVisible()) await menu.click();
    await page.getByRole("button", { name: "Election Night", exact: true }).click();
    await expect(page.getByRole("button", { name: "Play", exact: true })).toBeEnabled({ timeout: 80_000 });
    await page.getByLabel("Election night timeline", { exact: true }).fill("420000");
    await expect(page.getByTestId("night-reported-total")).not.toHaveText("0");
    await page.getByRole("button", { name: "working", exact: true }).click();
    await page.screenshot({ path: resolve(directory, `night-${viewport.width}.png`) });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    expect(errors).toEqual([]);
  });
}
