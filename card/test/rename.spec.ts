import { expect, test } from "@playwright/test";

// Regression for the bar-rename bug: a live schedule broadcast reassigns the
// `bar` property (a fresh object every push) while the settings popover is
// open. The popover must keep the half-typed name rather than re-seeding its
// fields from the incoming bar, otherwise Save persists the stale name and the
// rename silently reverts.

test("a live bar refresh mid-edit does not clobber the typed name", async ({ page }) => {
  await page.goto("/card/test/harness.html");
  const detail = await page.evaluate(async () => {
    const makeBar = () => ({
      id: "bar1",
      name: "Old Name",
      type: "light",
      targets: ["light.porch"],
      base: 0,
      enabled: true,
      segments: [],
    });
    const el: any = document.createElement("ds-bar-settings");
    el.hass = (window as any).__hass;
    el.bar = makeBar();
    let saved: any = null;
    el.addEventListener("bar-settings-save", (e: any) => (saved = e.detail));
    document.body.appendChild(el);
    await el.updateComplete;
    const root = el.shadowRoot as ShadowRoot;

    // User types a new name.
    const tf = root.querySelector("ha-textfield") as any;
    tf.value = "New Name";
    tf.dispatchEvent(new Event("input"));
    await el.updateComplete;

    // A backend broadcast lands mid-edit: same bar, brand-new object.
    el.bar = makeBar();
    await el.updateComplete;

    (root.querySelector(".btn.primary") as HTMLElement).click();
    return saved;
  });
  expect(detail).not.toBeNull();
  expect(detail.name).toBe("New Name");
});
