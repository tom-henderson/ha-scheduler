import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { TYPE_DOMAINS } from "./const";
import { sharedStyles } from "./styles";
import type { Bar, HomeAssistant } from "./types";

/**
 * Popover to edit a bar's name and target entities using the standard HA
 * entities picker (§8). Emits `bar-settings-save` (detail: {name, targets})
 * and `popover-close`.
 */
@customElement("ds-bar-settings")
export class DsBarSettings extends LitElement {
  static override styles = [
    sharedStyles,
    css`
      .popover {
        width: 300px;
      }
      .block {
        margin-bottom: 12px;
      }
      ha-textfield {
        width: 100%;
      }
    `,
  ];

  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ attribute: false }) bar!: Bar;

  @state() private _name = "";
  @state() private _targets: string[] = [];

  override willUpdate(changed: Map<string, unknown>): void {
    if (changed.has("bar")) {
      this._name = this.bar.name;
      this._targets = [...this.bar.targets];
    }
  }

  override render() {
    const domains = TYPE_DOMAINS[this.bar.type] ?? [];
    return html`
      <div class="popover" @click=${(e: Event) => e.stopPropagation()}>
        <div class="popover-head">
          <span>Bar settings</span>
          <button @click=${() => this.dispatchEvent(new CustomEvent("popover-close"))}>
            <ha-icon icon="mdi:close"></ha-icon>
          </button>
        </div>

        <div class="block">
          <div class="field-label">Name</div>
          <ha-textfield
            .value=${this._name}
            @input=${(e: Event) => (this._name = (e.target as HTMLInputElement).value)}
          ></ha-textfield>
        </div>

        <div class="block">
          <div class="field-label">Target entities</div>
          <ha-entities-picker
            .hass=${this.hass}
            .value=${this._targets}
            .includeDomains=${domains}
            @value-changed=${(e: CustomEvent<{ value: string[] }>) =>
              (this._targets = e.detail.value)}
          ></ha-entities-picker>
        </div>

        <div style="display:flex;gap:8px">
          <button class="btn primary" @click=${this._save}>
            <ha-icon icon="mdi:check" style="--mdc-icon-size:16px"></ha-icon> Save
          </button>
        </div>
      </div>
    `;
  }

  private _save = (): void => {
    this.dispatchEvent(
      new CustomEvent("bar-settings-save", {
        detail: { name: this._name.trim() || this.bar.name, targets: this._targets },
      })
    );
  };
}

declare global {
  interface HTMLElementTagNameMap {
    "ds-bar-settings": DsBarSettings;
  }
}
