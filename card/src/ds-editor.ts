import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { DOMAIN } from "./const";
import type { DailyScheduleCardConfig, EntryInfo, HomeAssistant } from "./types";

/** Config editor for the Daily Schedule card (getConfigElement). */
@customElement("ds-editor")
export class DsEditor extends LitElement {
  static override styles = css`
    .form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 8px 0;
    }
    ha-textfield,
    ha-select {
      width: 100%;
    }
    .hint {
      font-size: 12px;
      color: var(--secondary-text-color);
    }
  `;

  @property({ attribute: false }) hass!: HomeAssistant;
  @state() private _config: DailyScheduleCardConfig = { type: "custom:daily-schedule-card" };
  @state() private _entries: EntryInfo[] = [];

  setConfig(config: DailyScheduleCardConfig): void {
    this._config = config;
  }

  override async firstUpdated(): Promise<void> {
    try {
      const res = await this.hass.callWS<{ entries: EntryInfo[] }>({
        type: `${DOMAIN}/list_entries`,
      });
      this._entries = res.entries;
    } catch {
      this._entries = [];
    }
  }

  private _emit(patch: Partial<DailyScheduleCardConfig>): void {
    const config = { ...this._config, ...patch };
    this._config = config;
    this.dispatchEvent(
      new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true })
    );
  }

  override render() {
    return html`
      <div class="form">
        <ha-select
          label="Schedule"
          .value=${this._config.entry_id ?? ""}
          @selected=${(e: CustomEvent) =>
            this._emit({ entry_id: (e.target as HTMLSelectElement).value || undefined })}
          @closed=${(e: Event) => e.stopPropagation()}
          naturalMenuWidth
          fixedMenuPosition
        >
          <mwc-list-item value="">Auto (single schedule)</mwc-list-item>
          ${this._entries.map(
            (en) => html`<mwc-list-item value=${en.entry_id}>${en.title}</mwc-list-item>`
          )}
        </ha-select>
        <ha-textfield
          label="Title (optional)"
          .value=${this._config.title ?? ""}
          @input=${(e: Event) =>
            this._emit({ title: (e.target as HTMLInputElement).value || undefined })}
        ></ha-textfield>
        <div class="hint">
          Leave the schedule on “Auto” when you only have one Daily Schedule set up.
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ds-editor": DsEditor;
  }
}
