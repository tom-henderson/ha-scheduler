import { expect, test } from "@playwright/test";

// Regression for issue #19: the media source belongs to the bar, not the
// segment. The segment editor must bind HA's media selector to the bar's
// target entity (via selector `context.filter_entity` + a seeded `entity_id`)
// so no per-segment entity picker appears and "Pick media" actually browses.
const MEDIA_TYPES = {
  media: {
    label: "Media player",
    icon: "mdi:speaker",
    param_schema: [
      {
        key: "media",
        label: "Media",
        kind: "media",
        keys: ["media_content_id", "media_content_type", "media_title"],
      },
      { key: "volume_level", label: "Volume", kind: "slider", min: 0, max: 1, step: 0.05, default: 0.4 },
    ],
    states: [
      { key: "off", label: "Stopped" },
      { key: "play", label: "Play", color: "#e879c9" },
    ],
  },
};

async function mountMediaEditor(page: import("@playwright/test").Page, entities: string[]) {
  return page.evaluate(
    async ({ types, entities }) => {
      const editor: any = document.createElement("ds-segment-editor");
      editor.hass = (window as any).__hass;
      editor.type = "media";
      editor.types = types;
      editor.bounds = { min: 0, max: 24 };
      editor.accent = "#e879c9";
      editor.entities = entities;
      // state 1 = "Play" (active) so the media param renders.
      editor.segment = { id: "m1", start: 8, end: 10, state: 1, jitter: 0, data: {} };
      document.body.appendChild(editor);
      await editor.updateComplete;
      const root = editor.shadowRoot as ShadowRoot;
      const sel: any = root.querySelector("ha-selector");
      return {
        selectorCount: root.querySelectorAll("ha-selector").length,
        entityPickers: root.querySelectorAll("ha-entity-picker").length,
        context: sel?.context,
        value: sel?.value,
        hint: root.querySelector(".hint")?.textContent?.trim() ?? "",
      };
    },
    { types: MEDIA_TYPES, entities }
  );
}

test("media editor binds the selector to the bar entity (no per-segment picker)", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("/card/test/harness.html");

  const r = await mountMediaEditor(page, ["media_player.sonos_living"]);
  expect(errors).toEqual([]);
  expect(r.selectorCount).toBe(1);
  expect(r.entityPickers).toBe(0);
  expect(r.context).toEqual({ filter_entity: "media_player.sonos_living" });
  expect(r.value.entity_id).toBe("media_player.sonos_living");
});

test("media editor prompts for a bar target when none is set", async ({ page }) => {
  await page.goto("/card/test/harness.html");
  const r = await mountMediaEditor(page, []);
  expect(r.selectorCount).toBe(0);
  expect(r.hint).toContain("target entity on the bar");
});
