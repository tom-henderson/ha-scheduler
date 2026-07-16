import { expect, test } from "@playwright/test";

// Issue #23: a disabled bar must stay fully legible and editable. Instead of
// dimming the whole bar (opacity 0.4, which hit the header controls too), only
// the timeline is desaturated; the per-bar switch carries the disabled state.

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

async function mountBar(page: import("@playwright/test").Page, enabled: boolean) {
  return page.evaluate(
    async ({ types, enabled }) => {
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
        enabled,
        segments: [{ id: "s1", start: 6, end: 9, state: 1, jitter: 0 }],
      };
      document.body.appendChild(el);
      await el.updateComplete;
      const root = el.shadowRoot as ShadowRoot;
      const bar = root.querySelector(".bar") as HTMLElement;
      const track = root.querySelector(".track") as HTMLElement;
      return {
        hasDisabledClass: bar.classList.contains("disabled"),
        barOpacity: getComputedStyle(bar).opacity,
        trackFilter: getComputedStyle(track).filter,
      };
    },
    { types: TYPES, enabled }
  );
}

test("an enabled bar is full-colour with no filter", async ({ page }) => {
  await page.goto("/card/test/harness.html");
  const r = await mountBar(page, true);
  expect(r.hasDisabledClass).toBe(false);
  expect(r.barOpacity).toBe("1");
  expect(r.trackFilter).toBe("none");
});

test("a disabled bar keeps full opacity but desaturates the track", async ({ page }) => {
  await page.goto("/card/test/harness.html");
  const r = await mountBar(page, false);
  expect(r.hasDisabledClass).toBe(true);
  // Chrome (header + controls) is not dimmed — the bar itself stays opaque.
  expect(r.barOpacity).toBe("1");
  // Only the timeline is greyed out.
  expect(r.trackFilter).toContain("grayscale");
});
