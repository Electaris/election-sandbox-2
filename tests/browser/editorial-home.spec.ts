import { expect, test } from "@playwright/test";

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  test(`editorial home opens detailed geography at ${viewport.width}`, async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "The result is only the beginning." })).toBeVisible();
    await expect(page.getByLabel("Certified 2024 Electoral College baseline")).toContainText("226");
    await expect(page.getByLabel("Certified 2024 Electoral College baseline")).toContainText("312");
    await expect(page.locator(".atlas-map-scene canvas").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Enter the laboratory", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Explore Michigan", exact: true }).click();
    await expect(page).toHaveURL(/\/app\/\?/);
    await expect(page.getByRole("button", { name: "Copy scenario link" })).toBeEnabled({ timeout: 30_000 });
    await expect(page.getByRole("region", { name: "Workspace context" })).toContainText("Michigan");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  });
}
