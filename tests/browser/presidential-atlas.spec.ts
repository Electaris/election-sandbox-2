import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { states2024 } from "../../src/data/states";

const screenshots = resolve("docs/review/v0.34-presidential-atlas/screenshots");
async function motionSnapshot(page: Page) {
  return page.evaluate(async () => {
    // Development-only inspection of the same GSAP singleton used by the app.
    const path = "/src/components/home/editorialMotion.ts";
    const motion = await import(path);
    return motion.editorialMotionDiagnostics() as { chapterTriggers: number };
  });
}

for (const config of [
  { width: 1440, height: 1000, reduced: false },
  { width: 768, height: 1024, reduced: false },
  { width: 390, height: 844, reduced: false },
  { width: 320, height: 740, reduced: false },
  { width: 1440, height: 1000, reduced: true },
]) {
  test(`Presidential Atlas has exact comparisons and clean motion at ${config.width}, reduced ${config.reduced}`, async ({ page }) => {
    test.setTimeout(90_000);
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.setViewportSize(config);
    await page.emulateMedia({ reducedMotion: config.reduced ? "reduce" : "no-preference" });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "The result is only the beginning." })).toBeVisible();
    await expect(page.locator(".atlas-map-viewport canvas")).toBeVisible();
    await expect(page.locator(".legend-row")).toContainText("height: electoral votes");
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.querySelector(".home-headline-line")!).opacity)).toBe("1");
    const rows = page.locator(".geography-margin-row");
    await expect(rows).toHaveCount(7);
    for (const code of ["WI", "MI", "PA", "GA", "NV", "NC", "AZ"]) {
      const state = states2024.find(item => item.code === code)!;
      await expect(page.locator(`.geography-margin-row[data-state="${code}"] strong`)).toContainText(`+${((state.trumpVotes - state.harrisVotes) / state.totalVotes * 100).toFixed(2)}`);
    }
    const triggers = config.width >= 900 && !config.reduced ? 4 : 0;
    expect((await motionSnapshot(page)).chapterTriggers).toBe(triggers);
    mkdirSync(screenshots, { recursive: true });
    await page.screenshot({ path: resolve(screenshots, `opening-${config.width}-${config.reduced}.png`) });
    await page.locator("#chapter-MI").scrollIntoViewIfNeeded();
    if (triggers) await expect(page.locator(".home-geography-story")).toHaveAttribute("data-focus", "MI");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: resolve(screenshots, `geography-${config.width}-${config.reduced}.png`) });
    await page.locator(".geography-comparison").screenshot({ path: resolve(screenshots, `comparison-${config.width}-${config.reduced}.png`) });
    await page.getByRole("button", { name: "Inspect Michigan", exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: "Copy scenario link" })).toBeEnabled({ timeout: 30_000 });
    await expect(page.getByRole("region", { name: "Workspace context" })).toContainText("Michigan");
    expect((await motionSnapshot(page)).chapterTriggers).toBe(0);
    await expect.poll(() => page.evaluate(() => window.__sandboxDiagnostics?.().activeAnimationHandles)).toBe(0);
    expect(await page.evaluate(() => window.__sandboxDiagnostics?.().mapMountCount)).toBe(1);
    expect(errors).toEqual([]);
  });
}

test("system motion changes rebuild and dispose storytelling without duplicate triggers", async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect.poll(async () => (await motionSnapshot(page)).chapterTriggers).toBe(4);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(async () => (await motionSnapshot(page)).chapterTriggers).toBe(0);
  await expect(page.locator(".home-headline-line").first()).toHaveCSS("opacity", "1");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect.poll(async () => (await motionSnapshot(page)).chapterTriggers).toBe(4);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(async () => (await motionSnapshot(page)).chapterTriggers).toBe(0);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect.poll(async () => (await motionSnapshot(page)).chapterTriggers).toBe(4);
  for (let visit = 0; visit < 2; visit += 1) {
    await page.getByRole("button", { name: "Enter the laboratory", exact: true }).click();
    await expect.poll(async () => (await motionSnapshot(page)).chapterTriggers).toBe(0);
    await page.getByRole("button", { name: "Home", exact: true }).click();
    await expect.poll(async () => (await motionSnapshot(page)).chapterTriggers).toBe(4);
    expect(await page.evaluate(() => window.__sandboxDiagnostics?.().mapMountCount)).toBe(1);
  }
});

test("map camera motion yields to user zoom and reduced motion", async ({ page }) => {
  test.setTimeout(60_000);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/app/");
  await expect(page.getByRole("button", { name: "Copy scenario link" })).toBeEnabled({ timeout: 30_000 });
  await page.getByRole("button", { name: "Fit United States", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__sandboxDiagnostics?.().activeAnimationHandles)).toBeGreaterThan(0);
  const map = page.locator(".atlas-map-viewport canvas");
  await map.hover();
  await page.mouse.wheel(0, 180);
  await expect.poll(() => page.evaluate(() => window.__sandboxDiagnostics?.().activeAnimationHandles)).toBe(0);
  const afterInput = await page.evaluate(() => window.__sandboxDiagnostics?.().activeMapView);
  // Observe beyond the original tween duration to catch a stale camera writer.
  await page.waitForTimeout(850);
  expect(await page.evaluate(() => window.__sandboxDiagnostics?.().activeMapView)).toEqual(afterInput);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Fit United States", exact: true }).click();
  expect(await page.evaluate(() => window.__sandboxDiagnostics?.().activeAnimationHandles)).toBe(0);
});
