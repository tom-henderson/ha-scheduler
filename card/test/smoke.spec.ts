import { expect, test } from "@playwright/test";

test("card mounts and renders bars without runtime errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    // Ignore favicon / static 404s from the bare test server — we only care
    // about JS runtime errors from the card itself.
    if (m.type() === "error" && !/favicon|Failed to load resource/.test(m.text())) {
      errors.push(m.text());
    }
  });

  await page.goto("/card/test/harness.html");

  // The card and one bar per schedule entry should upgrade and render.
  await expect(page.locator("daily-schedule-card")).toBeVisible();
  await expect(page.locator("ds-bar")).toHaveCount(3);

  // Title and subtitle from the header.
  await expect(page.locator(".title")).toHaveText("Daily Schedule");
  await expect(page.locator(".subtitle")).toContainText("3 bars");

  // Conflict chip should render for the two conflicting bars.
  await expect(page.locator(".chip")).toHaveCount(2);

  // Segments: 2 + 1 + 1 = 4 override blocks across the three bars.
  await expect(page.locator("ds-bar .seg")).toHaveCount(4);

  expect(errors, `page errors:\n${errors.join("\n")}`).toEqual([]);
});

test("add-bar menu opens and lists device types", async ({ page }) => {
  await page.goto("/card/test/harness.html");
  await page.locator(".add").click();
  await expect(page.locator(".menu button")).toHaveCount(2); // light, water
  await expect(page.locator(".menu")).toContainText("light");
});

test("clicking a segment opens the segment editor", async ({ page }) => {
  await page.goto("/card/test/harness.html");
  await page.locator("ds-bar").first().locator(".seg").first().click();
  await expect(page.locator("ds-segment-editor")).toHaveCount(1);
  await expect(page.locator("ds-segment-editor")).toContainText("Edit segment");
});
