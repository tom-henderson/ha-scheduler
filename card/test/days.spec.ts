import { expect, test } from "@playwright/test";

// Issue #5: a per-bar weekday mask. The settings popover offers day chips +
// presets and saves a `days` array; the bar header shows a summary badge when
// a bar is not active every day.

const TYPES = {
  light: {
    label: "Light",
    icon: "mdi:lightbulb",
    states: [
      { key: "off", label: "Off", service: "light.turn_off" },
      { key: "on", label: "On", service: "light.turn_on" },
    ],
  },
};

async function mountSettings(page: import("@playwright/test").Page, days?: number[]) {
  return page.evaluate(
    async ({ days }) => {
      const el: any = document.createElement("ds-bar-settings");
      el.hass = (window as any).__hass;
      el.bar = {
        id: "bar1",
        name: "Lights",
        type: "light",
        targets: ["light.porch"],
        base: 0,
        enabled: true,
        days,
        segments: [],
      };
      const saved: any[] = [];
      el.addEventListener("bar-settings-save", (e: any) => saved.push(e.detail));
      (window as any).__saved = saved;
      document.body.appendChild(el);
      await el.updateComplete;
      const root = el.shadowRoot as ShadowRoot;
      return {
        dayCount: root.querySelectorAll(".day").length,
        onCount: root.querySelectorAll(".day.on").length,
        presetCount: root.querySelectorAll(".preset").length,
      };
    },
    { days }
  );
}

test("settings popover renders seven day chips with the bar's mask selected", async ({
  page,
}) => {
  await page.goto("/card/test/harness.html");
  const r = await mountSettings(page, [0, 1, 2, 3, 4]);
  expect(r.dayCount).toBe(7);
  expect(r.onCount).toBe(5); // weekday bar -> Mon-Fri lit
  expect(r.presetCount).toBe(3); // Every day / Weekdays / Weekend
});

test("the Weekend preset then Save emits days [5,6]", async ({ page }) => {
  await page.goto("/card/test/harness.html");
  await mountSettings(page); // every-day bar
  const saved = await page.evaluate(async () => {
    const el: any = document.querySelector("ds-bar-settings");
    const root = el.shadowRoot as ShadowRoot;
    const presets = [...root.querySelectorAll(".preset")] as HTMLElement[];
    presets.find((b) => b.textContent?.trim() === "Weekend")!.click();
    await el.updateComplete;
    (root.querySelector(".btn.primary") as HTMLElement).click();
    return (window as any).__saved;
  });
  expect(saved).toHaveLength(1);
  expect(saved[0].days).toEqual([5, 6]);
});

test("the last selected day cannot be removed (mask never empties)", async ({ page }) => {
  await page.goto("/card/test/harness.html");
  await mountSettings(page, [2]); // only Wednesday
  const onCount = await page.evaluate(async () => {
    const el: any = document.querySelector("ds-bar-settings");
    const root = el.shadowRoot as ShadowRoot;
    const days = [...root.querySelectorAll(".day.on")] as HTMLElement[];
    days[0].click(); // try to turn the sole day off
    await el.updateComplete;
    return root.querySelectorAll(".day.on").length;
  });
  expect(onCount).toBe(1);
});

async function mountBar(page: import("@playwright/test").Page, days?: number[]) {
  return page.evaluate(
    async ({ types, days }) => {
      const el: any = document.createElement("ds-bar");
      el.hass = (window as any).__hass;
      el.types = types;
      el.scheduleOn = true;
      el.conflicts = [];
      el.now = 12;
      el.bar = {
        id: "bar1",
        name: "Lights",
        type: "light",
        targets: ["light.porch"],
        base: 0,
        enabled: true,
        days,
        segments: [],
      };
      document.body.appendChild(el);
      await el.updateComplete;
      const root = el.shadowRoot as ShadowRoot;
      const chip = root.querySelector(".days-chip");
      return { hasChip: !!chip, text: chip?.textContent?.trim() ?? "" };
    },
    { types: TYPES, days }
  );
}

test("bar header shows a day badge only when not active every day", async ({ page }) => {
  await page.goto("/card/test/harness.html");
  expect((await mountBar(page)).hasChip).toBe(false); // every day -> no badge
  const weekday = await mountBar(page, [0, 1, 2, 3, 4]);
  expect(weekday.hasChip).toBe(true);
  expect(weekday.text).toContain("Weekdays");
});
