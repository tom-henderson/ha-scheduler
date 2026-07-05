import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { JITTERS } from "./const";
import { fmt, parse } from "./logic";
import { sharedStyles } from "./styles";
import type { Segment, TypeRegistry } from "./types";

/**
 * Popover to edit a segment's state, start/end times and jitter. Emits
 * `segment-save` (detail: Segment), `segment-delete` (detail: id) and
 * `popover-close`. Mirrors the mockup's SegmentEditor.
 */
@customElement("ds-segment-editor")
export class DsSegmentEditor extends LitElement {
  static override styles = [
    sharedStyles,
    css`
      .row {
        display: flex;
        gap: 10px;
        margin: 14px 0 6px;
      }
      .row > div {
        flex: 1;
      }
      .hint {
        font-size: 10.5px;
        margin-bottom: 12px;
      }
      .jitter-head {
        font-size: 11px;
        color: var(--ds-dim);
        margin-bottom: 6px;
        display: flex;
        align-items: center;
        gap: 5px;
      }
      .jitter-head .sub {
        margin-left: auto;
        color: var(--ds-dim);
        opacity: 0.7;
        font-size: 10px;
      }
      .jitter {
        display: flex;
        gap: 5px;
        margin-bottom: 14px;
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
        border-color: var(--ds-accent);
        background: color-mix(in srgb, var(--ds-accent) 18%, transparent);
        color: var(--ds-text);
      }
      .actions {
        display: flex;
        gap: 8px;
      }
    `,
  ];

  @property({ attribute: false }) segment!: Segment;
  @property() type!: string;
  @property({ attribute: false }) types!: TypeRegistry;
  @property({ attribute: false }) bounds!: { min: number; max: number };
  @property({ attribute: false }) accent = "";

  @state() private _si = 0;
  @state() private _start = "";
  @state() private _end = "";
  @state() private _jit = 0;
  @state() private _err = "";

  override willUpdate(changed: Map<string, unknown>): void {
    if (changed.has("segment")) {
      this._si = this.segment.state;
      this._start = fmt(this.segment.start);
      this._end = fmt(this.segment.end);
      this._jit = this.segment.jitter ?? 0;
      this._err = "";
    }
  }

  private _save(): void {
    const ps = parse(this._start);
    const pe = parse(this._end);
    if (ps == null || pe == null) return this._fail("Use HH:MM");
    if (pe <= ps) return this._fail("End must be after start");
    if (ps < this.bounds.min || pe > this.bounds.max)
      return this._fail(`Stay within ${fmt(this.bounds.min)}–${fmt(this.bounds.max)}`);
    this.dispatchEvent(
      new CustomEvent("segment-save", {
        detail: { ...this.segment, state: this._si, start: ps, end: pe, jitter: this._jit },
      })
    );
  }

  private _fail(msg: string): void {
    this._err = msg;
  }

  override render() {
    const states = this.types[this.type]?.states ?? [];
    return html`
      <div class="popover" style="width:268px" @click=${(e: Event) => e.stopPropagation()}>
        <div class="popover-head">
          <span>Edit segment</span>
          <button @click=${this._close}><ha-icon icon="mdi:close"></ha-icon></button>
        </div>

        <div class="field-label">State</div>
        <div class="state-buttons" style=${`--accent:${this.accent}`}>
          ${states.map(
            (st, i) => html`
              <button class=${i === this._si ? "sel" : ""} @click=${() => (this._si = i)}>
                ${st.label}
              </button>
            `
          )}
        </div>

        <div class="row">
          <div>
            <div class="field-label">Start</div>
            <input
              class="time"
              .value=${this._start}
              @input=${(e: Event) => {
                this._start = (e.target as HTMLInputElement).value;
                this._err = "";
              }}
            />
          </div>
          <div>
            <div class="field-label">End</div>
            <input
              class="time"
              .value=${this._end}
              @input=${(e: Event) => {
                this._end = (e.target as HTMLInputElement).value;
                this._err = "";
              }}
            />
          </div>
        </div>
        <div class="hint" style=${`color:${this._err ? "var(--ds-warn)" : "var(--ds-dim)"}`}>
          ${this._err || `Available ${fmt(this.bounds.min)}–${fmt(this.bounds.max)}`}
        </div>

        <div class="jitter-head">
          <ha-icon icon="mdi:dice-5" style="--mdc-icon-size:14px"></ha-icon> Daily jitter
          <span class="sub">randomises boundaries ±</span>
        </div>
        <div class="jitter">
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
    this.dispatchEvent(new CustomEvent("segment-delete", { detail: this.segment.id }));
}

declare global {
  interface HTMLElementTagNameMap {
    "ds-segment-editor": DsSegmentEditor;
  }
}
