import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

for (const viewport of [{ width: 1440, height: 900 }, { width: 1100, height: 800 }, { width: 390, height: 844 }]) {
  test(`sidebar routes and large vote counts remain readable at ${viewport.width}`, async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize(viewport);
    const data = "us2024-pa-vtd2020-mi-precinct2024-wi-ward2025-v1";
    const engine = "electaris-behavior-v2";
    const query = new URLSearchParams({ scenario: "2", data, engine, activeState: "PA", state: "PA", target: "harris", view: "scenario", editor: "preference", rank: "county" });
    query.append("recipe", `PA|2024-president|${data}|${engine}|0|55|stein|-16.1|0,50`);
    await page.goto(`/app/?${query}`);
    await expect(page.getByRole("button", { name: "Copy scenario link" })).toBeEnabled({ timeout: 30_000 });
    if (viewport.width < 1024) await page.getByRole("button", { name: "Show analysis" }).click();
    const sidebar = page.locator("#analysis-inspector");
    await expect(sidebar).toBeVisible();
    await expect(page.getByTestId("portfolio-state-PA")).toContainText("Actual · Trump");
    await expect(page.getByTestId("portfolio-state-PA")).toContainText("Scenario · Trump");
    const count = sidebar.locator(".flip-requirement-number");
    expect(Number((await count.innerText()).replaceAll(",", ""))).toBeGreaterThan(1_000_000);
    await expect(count).toHaveCSS("white-space", "nowrap");
    await page.getByRole("button", { name: "Compare alternative routes" }).click();
    await expect(page.getByTestId("path-route-1")).toBeVisible();
    const errors = await sidebar.evaluate(root => {
      const issues: string[] = [];
      for (const el of root.querySelectorAll<HTMLElement>(".route-states > div, .route-states > button, .route-states span, .route-states strong, .route-states small, .state-flip-metrics > span, .state-flip-metrics strong, .consequence-row > span")) {
        const box = el.getBoundingClientRect();
        if (box.width === 0) continue;
        if (el.scrollWidth > el.clientWidth + 1) issues.push(`Overflow: ${el.className || el.tagName} ${el.textContent?.trim()}`);
        if (el.matches(".route-states strong, .route-states small, .state-flip-metrics strong") && parseFloat(getComputedStyle(el).fontSize) < 11) issues.push(`Tiny text: ${el.textContent}`);
      }
      return issues;
    });
    expect(errors).toEqual([]);
    const first = page.getByTestId("path-route-1");
    const folder = resolve("docs/review/v0.32-editorial-swingometer/sidebar-fix");
    mkdirSync(folder, { recursive: true });
    await sidebar.locator(".state-flip-card").screenshot({ path: resolve(folder, `state-flip-${viewport.width}.png`) });
    await first.locator(".route-states > div, .route-states > button").first().screenshot({ path: resolve(folder, `route-state-${viewport.width}.png`) });
    await sidebar.locator(".scenario-card").screenshot({ path: resolve(folder, `score-${viewport.width}.png`) });
    await first.locator(".route-heading").click();
    await expect(sidebar.locator(".route-construction")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  });
}
