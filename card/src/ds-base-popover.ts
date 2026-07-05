import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";

import { sharedStyles } from "./styles";
import type { Bar, TypeRegistry } from "./types";

/**
 * Popover to set a bar's default (base) state — the state applied to all time
 * not covered by a segment. Emits `base-pick` (detail: index) and
 * `popover-close`. Mirrors the mockup's BasePopover.
 */
@customElement("ds-base-popover")
export class DsBasePopover extends LitElement {
  static override styles = [sharedStyles];

  @property({ attribute: false }) bar!: Bar;
  @property({ attribute: false }) types!: TypeRegistry;
  @property() accent = "";

  override render() {
    const states = this.types[this.bar.type]?.states ?? [];
    return html`
      <div class="popover" style="width:240px" @click=${(e: Event) => e.stopPropagation()}>
        <div class="popover-head">
          <span>Default state</span>
          <button @click=${() => this.dispatchEvent(new CustomEvent("popover-close"))}>
            <ha-icon icon="mdi:close"></ha-icon>
          </button>
        </div>
        <div class="field-label" style="margin-bottom:10px;line-height:1.5">
          Applied to all time not covered by a segment.
        </div>
        <div class="state-buttons" style=${`--accent:${this.accent}`}>
          ${states.map(
            (st, i) => html`
              <button
                class=${this.bar.base === i ? "sel" : ""}
                @click=${() => this.dispatchEvent(new CustomEvent("base-pick", { detail: i }))}
              >
                ${st.label}
              </button>
            `
          )}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ds-base-popover": DsBasePopover;
  }
}
