import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { JITTERS } from "./const";
import { fmt, parse } from "./logic";
import { sharedStyles } from "./styles";
import type { HomeAssistant, Trigger, TypeAction } from "./types";

/**
 * Popover to edit a stateless bar's trigger point: which action to run
 * (scene/script/automation + entity), the time to fire, and jitter. Emits
 * `trigger-save` (detail: Trigger), `trigger-delete` (detail: id) and
 * `popover-close`.
 */
@customElement("ds-trigger-editor")
export class DsTriggerEditor extends LitElement {
  static override styles = [
    sharedStyles,
    css`
      .block {
        margin: 12px 0 0;
      }
      .time-row {
        display: flex;
        gap: 10px;
        align-items: flex-end;
      }
      .time-row > div {
        flex: 1;
      }
      .jitter {
        display: flex;
        gap: 5px;
        margin-top: 6px;
      }
      .jitter button {
        flex: 1;
        padding: 6px 0;
        border-radius: 7px;
        cursor: pointer;
        font-size: 11px;
        font-weight: 600;
        border: 1px solid var(--ds-line);
        background: transparent;
        color: var(--ds-dim);
        font-family: inherit;
      }
      .jitter button.sel {
        border-color: var(--accent, var(--ds-accent));
        background: color-mix(in srgb, var(--accent, var(--ds-accent)) 18%, transparent);
        color: var(--ds-text);
      }
      .actions {
        display: flex;
        gap: 8px;
        margin-top: 16px;
      }
      .hint {
        font-size: 10.5px;
        margin-top: 6px;
      }
    `,
  ];

  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ attribute: false }) trigger!: Trigger;
  @property({ attribute: false }) actions: TypeAction[] = [];
  @property() accent = "";

  @state() private _actionKey = "";
  @state() private _entity = "";
  @state() private _at = "";
  @state() private _jit = 0;
  @state() private _err = "";

  // The trigger id these fields were seeded from. A live schedule broadcast
  // reassigns `trigger` (a fresh object per push), so re-seeding on any change
  // would discard in-progress edits; seed only when a different trigger opens.
  private _seededFor: string | null = null;

  override willUpdate(changed: Map<string, unknown>): void {
    if (changed.has("trigger") && this.trigger.id !== this._seededFor) {
      this._seededFor = this.trigger.id;
      const service = this.trigger.action?.service;
      const match = this.actions.find((a) => a.service === service);
      this._actionKey = match?.key ?? this.actions[0]?.key ?? "";
      this._entity = this.trigger.action?.entity_id ?? "";
      this._at = fmt(this.trigger.at);
      this._jit = this.trigger.jitter ?? 0;
      this._err = "";
    }
  }

  private get _action(): TypeAction | undefined {
    return this.actions.find((a) => a.key === this._actionKey);
  }

  private _pickAction(key: string): void {
    if (key === this._actionKey) return;
    this._actionKey = key;
    this._entity = ""; // domain changed — clear the entity
  }

  private _save(): void {
    const at = parse(this._at);
    if (at == null) return this._fail("Use HH:MM");
    if (!this._action) return this._fail("Pick an action");
    if (!this._entity) return this._fail(`Pick a ${this._action.label.toLowerCase()}`);
    this.dispatchEvent(
      new CustomEvent("trigger-save", {
        detail: {
          ...this.trigger,
          at,
          jitter: this._jit,
          action: { service: this._action.service, entity_id: this._entity },
        },
      })
    );
  }

  private _fail(msg: string): void {
    this._err = msg;
  }

  override render() {
    const domain = this._action?.domain ?? "scene";
    const selector = { entity: { filter: { domain } } };
    return html`
      <div class="popover" style="width:288px" @click=${(e: Event) => e.stopPropagation()}>
        <div class="popover-head">
          <span>Edit trigger</span>
          <button @click=${this._close}><ha-icon icon="mdi:close"></ha-icon></button>
        </div>

        <div class="field-label">Run</div>
        <div class="state-buttons" style=${`--accent:${this.accent}`}>
          ${this.actions.map(
            (a) => html`
              <button
                class=${a.key === this._actionKey ? "sel" : ""}
                @click=${() => this._pickAction(a.key)}
              >
                ${a.label}
              </button>
            `
          )}
        </div>

        <div class="block">
          <div class="field-label">${this._action?.label ?? "Entity"}</div>
          <ha-selector
            .hass=${this.hass}
            .selector=${selector}
            .value=${this._entity}
            @value-changed=${(e: CustomEvent<{ value: string }>) => {
              this._entity = e.detail.value;
              this._err = "";
            }}
          ></ha-selector>
        </div>

        <div class="block time-row">
          <div>
            <div class="field-label">Fire at</div>
            <input
              class="time"
              .value=${this._at}
              @input=${(e: Event) => {
                this._at = (e.target as HTMLInputElement).value;
                this._err = "";
              }}
            />
          </div>
        </div>
        ${this._err
          ? html`<div class="hint" style="color:var(--ds-warn)">${this._err}</div>`
          : nothing}

        <div class="block">
          <div class="field-label">
            <ha-icon icon="mdi:dice-5" style="--mdc-icon-size:13px"></ha-icon> Daily jitter
          </div>
          <div class="jitter" style=${`--accent:${this.accent}`}>
            ${JITTERS.map(
              (j) => html`
                <button
                  class=${Math.abs(this._jit - j.v) < 0.001 ? "sel" : ""}
                  @click=${() => (this._jit = j.v)}
                >
                  ${j.label}
                </button>
              `
            )}
          </div>
        </div>

        <div class="actions">
          <button class="btn ghost" @click=${this._delete}>
            <ha-icon icon="mdi:trash-can-outline" style="--mdc-icon-size:15px"></ha-icon> Delete
          </button>
          <button class="btn primary" @click=${this._save}>
            <ha-icon icon="mdi:check" style="--mdc-icon-size:16px"></ha-icon> Save
          </button>
        </div>
      </div>
    `;
  }

  private _close = () => this.dispatchEvent(new CustomEvent("popover-close"));
  private _delete = () =>
    this.dispatchEvent(new CustomEvent("trigger-delete", { detail: this.trigger.id }));
}

declare global {
  interface HTMLElementTagNameMap {
    "ds-trigger-editor": DsTriggerEditor;
  }
}
