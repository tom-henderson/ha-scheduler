import { expect, test } from "@playwright/test";

// The "now" line and its label must reflect the home's timezone
// (hass.config.time_zone), not the viewer's clock — the schedule is often
// viewed from a different timezone (e.g. on vacation). These tests freeze the
// wall clock to a fixed UTC instant and mount the card with fixed-offset home
// zones, so the asserted line position is unambiguous and independent of the
// timezone the test runner itself happens to be in.

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

const SCHEDULE = {
  entry_id: "e1",
  title: "Daily Schedule",
  enabled: true,
  bars: [
    {
      id: "bar1",
      name: "Porch",
      type: "light",
      enabled: true,
      base: 0,
      targets: ["light.porch"],
      segments: [{ id: "a1", start: 8, end: 18, state: 1, jitter: 0 }],
    },
  ],
};

/** Mount a card wired to the given home timezone and return the now-label's
 *  `left` percentage (hours-past-midnight / 24 * 100). */
async function nowLeftForZone(
  page: import("@playwright/test").Page,
  timeZone: string
): Promise<number> {
  return page.evaluate(
    async ({ types, schedule, timeZone }) => {
      const hass = {
        config: { time_zone: timeZone },
        callWS: async (msg: any) => {
          if (msg.type === "daily_schedule/list_entries")
            return { entries: [{ entry_id: "e1", title: "Daily Schedule" }], types };
          if (msg.type === "daily_schedule/get") return { ...schedule, types };
          return {};
        },
        connection: {
          subscribeMessage: async (cb: any) => {
            cb(schedule);
            return () => {};
          },
        },
      };
      const card: any = document.createElement("daily-schedule-card");
      card.setConfig({ type: "custom:daily-schedule-card", entry_id: "e1" });
      card.hass = hass;
      document.body.appendChild(card);
      // Wait for the subscription to deliver the schedule and the ruler to render.
      for (let i = 0; i < 50; i++) {
        await card.updateComplete;
        const label = card.shadowRoot?.querySelector(".now-label");
        if (label) {
          const m = /left:\s*([\d.]+)%/.exec(label.getAttribute("style") ?? "");
          if (m) return Number(m[1]);
        }
        await new Promise((r) => setTimeout(r, 10));
      }
      throw new Error("now-label never rendered");
    },
    { types: TYPES, schedule: SCHEDULE, timeZone }
  );
}

test("the now line follows the home timezone, not the viewer", async ({ page }) => {
  // 2026-01-15 12:00:00Z — a winter date so both zones sit at their standard
  // (DST-free) offsets.
  await page.clock.setFixedTime(new Date("2026-01-15T12:00:00Z"));
  await page.goto("/card/test/harness.html");

  // Tokyo is UTC+9 → 21:00 → 21/24 * 100 = 87.5%.
  const tokyo = await nowLeftForZone(page, "Asia/Tokyo");
  expect(tokyo).toBeCloseTo(87.5, 3);

  // Los Angeles is UTC-8 in January → 04:00 → 4/24 * 100 = 16.667%.
  const la = await nowLeftForZone(page, "America/Los_Angeles");
  expect(la).toBeCloseTo((4 / 24) * 100, 3);

  // The two positions differ purely because of the home timezone: at one frozen
  // instant, the viewer's clock cannot explain a 17-hour spread.
  expect(Math.abs(tokyo - la)).toBeGreaterThan(1);
});
