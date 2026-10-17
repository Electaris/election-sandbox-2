import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";

const screenshots = resolve(process.env.SANDBOX_PREMIUM_SCREENSHOT_DIR ?? "docs/review/v0.31a-hybrid-premium/screenshots");
const viewports = [
  { width: 1920, height: 1080 }, { width: 1440, height: 900 }, { width: 1366, height: 768 },
  { width: 1024, height: 768 }, { width: 768, height: 1024 }, { width: 390, height: 844 },
];

async function ready(page: Page) {
  await expect(page.getByRole("button", { name: "Copy scenario link" })).toBeEnabled({ timeout: 30_000 });
  await expect.poll(() => page.evaluate(() => window.__sandboxDiagnostics?.().activeAnimationHandles)).toBe(0);
}

async function layoutFits(page: Page) {
  const layout = await page.evaluate(() => {
    const map = document.querySelector<HTMLElement>(".map-stage")!.getBoundingClientRect();
    const dock = document.querySelector<HTMLElement>(".workspace-dock")!.getBoundingClientRect();
    const viewport = document.querySelector<HTMLElement>(".atlas-map-viewport")!.getBoundingClientRect();
    const canvas = document.querySelector<HTMLCanvasElement>(".atlas-map-viewport canvas")!;
    return { mapBottom: map.bottom, dockTop: dock.top, dockBottom: dock.bottom, width: document.documentElement.scrollWidth,
      pageHeight: document.documentElement.scrollHeight, viewportWidth: innerWidth, viewportHeight: innerHeight,
      mapHeight: viewport.height, rendererHeight: canvas.height / devicePixelRatio, dockPosition: getComputedStyle(document.querySelector(".workspace-dock")!).position };
  });
  expect(layout.dockPosition).toBe("fixed");
  expect(layout.dockBottom).toBeLessThanOrEqual(layout.viewportHeight + 1);
  expect(layout.width).toBeLessThanOrEqual(layout.viewportWidth + 1);
  expect(layout.pageHeight).toBeLessThanOrEqual(layout.viewportHeight + 1);
  expect(layout.mapHeight).toBeGreaterThan(40);
  await expect.poll(() => page.evaluate(() => {
    const viewport = document.querySelector<HTMLElement>(".atlas-map-viewport")!.getBoundingClientRect();
    const canvas = document.querySelector<HTMLCanvasElement>(".atlas-map-viewport canvas")!;
    return Math.abs(canvas.height / devicePixelRatio - viewport.height);
  })).toBeLessThanOrEqual(2);
}

async function night(page: Page) {
  const menu = page.getByRole("button", { name: "Menu", exact: true });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole("button", { name: "Election Night", exact: true }).click();
  await expect(page.getByRole("button", { name: "Play", exact: true })).toBeEnabled({ timeout: 100_000 });
}

for (const viewport of viewports) {
  test(`premium shell preserves the slide-up drawer and map at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize(viewport);
    await page.goto("/app/");
    await ready(page);
    await page.getByRole("button", { name: "Pennsylvania", exact: true }).first().click();
    await ready(page);
    const recipe = new URL(page.url()).search;
    const camera = await page.evaluate(() => window.__sandboxDiagnostics?.().activeMapView);
    const mapBounds = await page.locator(".map-stage").boundingBox();
    for (const snap of ["collapsed", "working", "expanded"] as const) {
      await page.getByRole("button", { name: snap, exact: true }).click();
      await expect(page.getByRole("region", { name: "Laboratory desk" })).toHaveAttribute("data-snap", snap);
      await layoutFits(page);
      expect(new URL(page.url()).search).toBe(recipe);
      expect(await page.evaluate(() => window.__sandboxDiagnostics?.().activeMapView)).toEqual(camera);
      expect(await page.locator(".map-stage").boundingBox()).toEqual(mapBounds);
    }
    await page.getByRole("button", { name: "working", exact: true }).click();
    mkdirSync(screenshots, { recursive: true });
    await page.screenshot({ path: resolve(screenshots, `swingometer-${viewport.width}x${viewport.height}.png`) });
    const toggle = page.locator(".inspector-toggle");
    await toggle.click();
    await expect(page.locator("#analysis-inspector")).toHaveJSProperty("hidden", viewport.width > 1023);
    await toggle.click();
    await layoutFits(page);
    await night(page);
    for (const snap of ["collapsed", "working", "expanded"] as const) {
      await page.getByRole("button", { name: snap, exact: true }).click();
      await layoutFits(page);
      await expect(page.getByRole("button", { name: "Play", exact: true })).toBeVisible();
      await expect(page.getByLabel("Election night timeline")).toBeVisible();
    }
    await page.screenshot({ path: resolve(screenshots, `election-night-${viewport.width}x${viewport.height}.png`) });
  });
}

test("premium navigation preserves the authored scenario, paused replay, camera, and per-workspace dock states", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/app/");
  await ready(page);
  await page.getByRole("button", { name: "Pennsylvania", exact: true }).first().click();
  await ready(page);
  await page.getByRole("button", { name: "Open controls", exact: true }).click();
  await page.getByRole("tab", { name: "Behavior", exact: true }).click();
  await page.getByRole("button", { name: "Preference", exact: true }).click();
  await page.getByRole("slider", { name: "Two-party preference transfer" }).fill("2.5");
  await ready(page);
  const recipes = new URL(page.url()).searchParams.getAll("recipe");
  await page.getByRole("button", { name: "expanded", exact: true }).click();
  await night(page);
  await page.getByLabel("Election night timeline").fill("420000");
  await expect.poll(() => page.getByLabel("Election night timeline").inputValue()).toBe("420000");
  await expect(page.locator(".night-dock-clock small")).not.toContainText("0 ballots");
  const clock = await page.locator(".night-dock-clock").innerText();
  const camera = await page.evaluate(() => window.__sandboxDiagnostics?.().activeMapView);
  await page.getByRole("button", { name: "collapsed", exact: true }).click();
  await page.getByRole("button", { name: "Swingometer", exact: true }).click();
  await expect(page.getByRole("region", { name: "Laboratory desk" })).toHaveAttribute("data-snap", "expanded");
  await night(page);
  await expect(page.getByRole("region", { name: "Election night controls" })).toHaveAttribute("data-snap", "collapsed");
  await expect(page.locator(".night-dock-clock")).toHaveText(clock, { useInnerText: true });
  expect(new URL(page.url()).searchParams.getAll("recipe")).toEqual(recipes);
  expect(await page.evaluate(() => window.__sandboxDiagnostics?.().activeMapView)).toEqual(camera);
  expect(await page.evaluate(() => window.__sandboxDiagnostics?.().mapMountCount)).toBe(1);
  await page.getByRole("button", { name: "Resize Election Night dock" }).focus();
  await page.keyboard.press("End");
  await expect(page.getByRole("region", { name: "Election night controls" })).toHaveAttribute("data-snap", "expanded");
  await page.getByRole("tab", { name: "Live", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Timeline", exact: true })).toBeFocused();
  const handle = page.getByRole("button", { name: "Resize Election Night dock" });
  const handleBox = await handle.boundingBox();
  expect(handleBox).not.toBeNull();
  await page.mouse.move(handleBox!.x + handleBox!.width / 2, handleBox!.y + handleBox!.height / 2);
  await page.mouse.down();
  await page.mouse.move(handleBox!.x + handleBox!.width / 2, handleBox!.y + 60, { steps: 6 });
  await page.mouse.up();
  await expect(page.locator(".application-shell")).toHaveAttribute("data-dock-resizing", "false");
  await layoutFits(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Edit Swingometer", exact: true }).click();
  await layoutFits(page);
});
