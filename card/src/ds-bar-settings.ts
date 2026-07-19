import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { ALL_DAYS, TYPE_DOMAINS, WEEKDAYS, WEEKDAY_DAYS, WEEKEND_DAYS } from "./const";
import { barDays } from "./logic";
import { sharedStyles } from "./styles";
import type { Bar, HomeAssistant } from "./types";

/**
 * Popover to edit a bar's name, target entities and active days.
 *
 * Targets use the standard HA entities picker (§8). Active days is a per-bar
 * weekday mask (issue #5): the bar only acts on the selected days, so a
 * weekday/weekend split is two bars targeting the same entity with
 * complementary masks. Emits `bar-settings-save`
 * (detail: {name, targets, days}) and `popover-close`.
 *
 * Uses `<ha-selector>` (HA's modern selector API) rather than
 * `<ha-entities-picker>`. The picker component is lazily loaded by HA and is
 * not registered on plain dashboard views, so it silently renders blank; the
 * selector element is always available.
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
      .days {
        display: flex;
        gap: 4px;
      }
      .day {
        flex: 1;
        height: 30px;
        border-radius: 7px;
        border: 1px solid var(--ds-line);
        background: transparent;
        color: var(--ds-dim);
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        font-family: inherit;
      }
      .day.on {
        background: color-mix(in srgb, var(--ds-accent) 22%, transparent);
        border-color: var(--ds-accent);
        color: var(--ds-text);
      }
      .presets {
        display: flex;
        gap: 6px;
        margin-top: 6px;
      }
      .preset {
        border: none;
        background: transparent;
        color: var(--ds-accent);
        font-size: 11.5px;
        font-weight: 600;
        cursor: pointer;
        padding: 2px 4px;
        font-family: inherit;
      }
      .preset:hover {
        text-decoration: underline;
      }
    `,
  ];

  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ attribute: false }) bar!: Bar;

  @state() private _name = "";
  @state() private _targets: string[] = [];
  @state() private _days: number[] = [...ALL_DAYS];

  override willUpdate(changed: Map<string, unknown>): void {
    if (changed.has("bar")) {
      this._name = this.bar.name;
      this._targets = [...this.bar.targets];
      this._days = barDays(this.bar);
    }
  }

  private _toggleDay(i: number): void {
    const on = this._days.includes(i);
    // Keep at least one day selected — an empty mask would silently disable the
    // bar, which is what the enable toggle is for.
    if (on && this._days.length === 1) return;
    const next = on ? this._days.filter((d) => d !== i) : [...this._days, i];
    this._days = next.sort((a, b) => a - b);
  }

  override render() {
    const domains = TYPE_DOMAINS[this.bar.type] ?? [];
    const selector = { entity: { multiple: true, filter: { domain: domains } } };
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

        ${domains.length
          ? html`<div class="block">
              <div class="field-label">Target entities</div>
              <ha-selector
                .hass=${this.hass}
                .selector=${selector}
                .value=${this._targets}
                @value-changed=${(e: CustomEvent<{ value: string[] }>) =>
                  (this._targets = e.detail.value)}
              ></ha-selector>
            </div>`
          : nothing}

        <div class="block">
          <div class="field-label">Active days</div>
          <div class="days">
            ${WEEKDAYS.map(
              (d) => html`<button
                class=${`day ${this._days.includes(d.i) ? "on" : ""}`}
                title=${d.short}
                @click=${() => this._toggleDay(d.i)}
              >
                ${d.letter}
              </button>`
            )}
          </div>
          <div class="presets">
            <button class="preset" @click=${() => (this._days = [...ALL_DAYS])}>
              Every day
            </button>
            <button class="preset" @click=${() => (this._days = [...WEEKDAY_DAYS])}>
              Weekdays
            </button>
            <button class="preset" @click=${() => (this._days = [...WEEKEND_DAYS])}>
              Weekend
            </button>
          </div>
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
        detail: {
          name: this._name.trim() || this.bar.name,
          targets: this._targets,
          days: this._days,
        },
      })
    );
  };
}

declare global {
  interface HTMLElementTagNameMap {
    "ds-bar-settings": DsBarSettings;
  }
}
