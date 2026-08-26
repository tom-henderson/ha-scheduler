import { expect, test } from "@playwright/test";

// Regressions for the bar-rename bugs.

// Bug 1: the Name field must be a *native* input, not a lazily-loaded HA
// element. On a plain dashboard view HA does not register `ha-textfield`, so it
// rendered as an inert element with no typing surface — "no editable field".
test("the name field is a native, always-available input", async ({ page }) => {
  await page.goto("/card/test/harness.html");
  const info = await page.evaluate(async () => {
    const el: any = document.createElement("ds-bar-settings");
    el.hass = (window as any).__hass;
    el.bar = {
      id: "bar1", name: "Old Name", type: "light",
      targets: ["light.porch"], base: 0, enabled: true, segments: [],
    };
    document.body.appendChild(el);
    await el.updateComplete;
    const root = el.shadowRoot as ShadowRoot;
    const input = root.querySelector("input.name-input") as HTMLInputElement | null;
    return { hasNativeInput: !!input, value: input?.value ?? null };
  });
  expect(info.hasNativeInput).toBe(true);
  expect(info.value).toBe("Old Name");
});

// Bug 2: a live schedule broadcast reassigns the `bar` property (a fresh object
// every push) while the popover is open. The popover must keep the half-typed
// name rather than re-seeding from the incoming bar, otherwise Save persists the
// stale name and the rename silently reverts.
test("a live bar refresh mid-edit does not clobber the typed name", async ({ page }) => {
  await page.goto("/card/test/harness.html");
  const detail = await page.evaluate(async () => {
    const makeBar = () => ({
      id: "bar1", name: "Old Name", type: "light",
      targets: ["light.porch"], base: 0, enabled: true, segments: [],
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
    const input = root.querySelector("input.name-input") as HTMLInputElement;
    input.value = "New Name";
    input.dispatchEvent(new Event("input"));
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
