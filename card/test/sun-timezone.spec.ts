import { expect, test } from "@playwright/test";

// Sun-relative boundaries must resolve to the *home's* wall clock, not the
// viewer's. The `sun.sun` attributes are absolute instants; reading their
// hour-of-day with the viewer's clock makes e.g. a New Zealand sunset (19:00)
// show as 07:00 when the schedule is edited from the UK. These tests pin
// `next_setting` to a fixed UTC instant and mount the editor with two
// fixed-offset home zones, so the asserted resolution is unambiguous and
// independent of the timezone the test runner itself is in.

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

// 2026-07-15 07:00:00Z. In July: Auckland is NZST (UTC+12) → 19:00;
// Los Angeles is PDT (UTC-7) → 00:00. Both zones are at a fixed offset on this
// date, so there is no DST ambiguity.
const SUNSET_ISO = "2026-07-15T07:00:00Z";

/** Toggle Start → Sun (defaults to sunset, offset 0) and return the resolved
 *  clock time the editor displays, for a card wired to the given home zone. */
async function resolvedSunsetForZone(
  page: import("@playwright/test").Page,
  timeZone: string
): Promise<string> {
  return page.evaluate(
    async ({ types, timeZone, sunsetIso }) => {
      const el: any = document.createElement("ds-segment-editor");
      el.hass = {
        config: { time_zone: timeZone },
        states: { "sun.sun": { attributes: { next_setting: sunsetIso } } },
      };
      el.type = "light";
      el.types = types;
      el.bounds = { min: 0, max: 24 };
      el.accent = "#f5b301";
      el.entities = ["light.porch"];
      el.segment = { id: "s1", start: 8, end: 23, state: 1, jitter: 0 };
      document.body.appendChild(el);
      await el.updateComplete;
      const root = el.shadowRoot as ShadowRoot;
      // First .bnd block is Start; its second toggle button is "Sun".
      (root.querySelectorAll(".bnd")[0].querySelectorAll(".toggle button")[1] as HTMLElement).click();
      await el.updateComplete;
      const resolved = root.querySelectorAll(".bnd")[0].querySelector(".resolved")?.textContent ?? "";
      el.remove();
      return resolved.trim();
    },
    { types: TYPES, timeZone, sunsetIso: SUNSET_ISO }
  );
}

test("a solar boundary resolves in the home timezone, not the viewer's", async ({ page }) => {
  await page.goto("/card/test/harness.html");

  const auckland = await resolvedSunsetForZone(page, "Pacific/Auckland");
  expect(auckland).toContain("19:00"); // NZ sunset stays 19:00, even from afar

  const la = await resolvedSunsetForZone(page, "America/Los_Angeles");
  expect(la).toContain("00:00");

  // Same instant, different home zones → different resolutions. That spread can
  // only come from the home timezone, proving the viewer's clock isn't used.
  expect(auckland).not.toEqual(la);
});
