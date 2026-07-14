import { expect, test } from "@playwright/test";

// Issue #3: sun-relative boundaries. Each Start/End toggles Clock <-> Sun; a
// solar boundary saves a { event, offset } expression and shows a marker on the
// timeline.

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

/** A hass stub whose sun.sun sets today's sunset to 18:00 local. */
function hassWithSunset() {
  const d = new Date();
  d.setHours(18, 0, 0, 0);
  return { states: { "sun.sun": { attributes: { next_setting: d.toISOString() } } } };
}

async function mountEditor(
  page: import("@playwright/test").Page,
  segment: Record<string, unknown>
) {
  return page.evaluate(
    async ({ types, segment }) => {
      const el: any = document.createElement("ds-segment-editor");
      const d = new Date();
      d.setHours(18, 0, 0, 0);
      el.hass = { states: { "sun.sun": { attributes: { next_setting: d.toISOString() } } } };
      el.type = "light";
      el.types = types;
      el.bounds = { min: 0, max: 24 };
      el.accent = "#f5b301";
      el.entities = ["light.porch"];
      el.segment = segment;
      const saved: any[] = [];
      el.addEventListener("segment-save", (e: any) => saved.push(e.detail));
      (window as any).__saved = saved;
      document.body.appendChild(el);
      await el.updateComplete;
      return null;
    },
    { types: TYPES, segment }
  );
}

test("toggling Start to Sun reveals the event picker + offset", async ({ page }) => {
  await page.goto("/card/test/harness.html");
  await mountEditor(page, { id: "s1", start: 8, end: 18, state: 1, jitter: 0 });
  const r = await page.evaluate(async () => {
    const el: any = document.querySelector("ds-segment-editor");
    const root = el.shadowRoot as ShadowRoot;
    // First .bnd block is Start; its second toggle button is "Sun".
    const sunBtn = root.querySelectorAll(".bnd")[0].querySelectorAll(".toggle button")[1] as HTMLElement;
    sunBtn.click();
    await el.updateComplete;
    const bnd = root.querySelectorAll(".bnd")[0];
    return {
      events: bnd.querySelectorAll(".evrow .sbtn").length,
      hasOffset: !!bnd.querySelector(".offrow"),
      resolved: bnd.querySelector(".resolved")?.textContent?.trim() ?? "",
    };
  });
  expect(r.events).toBe(4); // sunrise, sunset, dawn, dusk
  expect(r.hasOffset).toBe(true);
  expect(r.resolved).toContain("18:00"); // sunset today, offset 0
});

test("a solar start saves { event, offset } and today's resolved nominal", async ({ page }) => {
  await page.goto("/card/test/harness.html");
  await mountEditor(page, { id: "s1", start: 8, end: 23, state: 1, jitter: 0 });
  const saved = await page.evaluate(async () => {
    const el: any = document.querySelector("ds-segment-editor");
    const root = el.shadowRoot as ShadowRoot;
    const startBnd = root.querySelectorAll(".bnd")[0];
    (startBnd.querySelectorAll(".toggle button")[1] as HTMLElement).click(); // Sun
    await el.updateComplete;
    // Step the offset down twice → −30m (sunset default event).
    const minus = root.querySelectorAll(".bnd")[0].querySelector(".stepper button") as HTMLElement;
    minus.click();
    await el.updateComplete;
    (root.querySelectorAll(".bnd")[0].querySelector(".stepper button") as HTMLElement).click();
    await el.updateComplete;
    (root.querySelector(".btn.primary") as HTMLElement).click();
    return (window as any).__saved;
  });
  expect(saved).toHaveLength(1);
  expect(saved[0].start_expr).toEqual({ event: "sunset", offset: -0.5 });
  expect(saved[0].end_expr).toBeNull();
  expect(saved[0].start).toBeCloseTo(17.5, 5); // 18:00 − 30m, resolved for today
});

test("timeline shows a sun marker on a solar edge", async ({ page }) => {
  await page.goto("/card/test/harness.html");
  const r = await page.evaluate(
    async ({ types }) => {
      const el: any = document.createElement("ds-bar");
      el.hass = (window as any).__hass;
      el.types = types;
      el.scheduleOn = true;
      el.conflicts = [];
      el.now = 12;
      el.bar = {
        id: "bar1",
        name: "Porch",
        type: "light",
        targets: ["light.porch"],
        base: 0,
        enabled: true,
        segments: [
          { id: "s1", start: 18, end: 23, state: 1, jitter: 0, start_expr: { event: "sunset", offset: 0 } },
        ],
      };
      document.body.appendChild(el);
      await el.updateComplete;
      const root = el.shadowRoot as ShadowRoot;
      return {
        seg: !!root.querySelector(".seg.solar-l"),
        marker: root.querySelectorAll(".sun-edge").length,
      };
    },
    { types: TYPES }
  );
  expect(r.seg).toBe(true);
  expect(r.marker).toBe(1);
});
