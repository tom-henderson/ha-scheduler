import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { JITTERS } from "./const";
import {
  fmt,
  isActive,
  paramKeys,
  paramOptions,
  paramSchema,
  paramValue,
  parse,
} from "./logic";
import { sharedStyles } from "./styles";
import type { HomeAssistant, Segment, TypeParam, TypeRegistry } from "./types";

/** Value shape emitted by HA's media selector. */
interface MediaValue {
  media_content_id?: string;
  media_content_type?: string;
  metadata?: { title?: string };
}

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
      .stepper {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .stepper button {
        width: 34px;
        height: 34px;
        border-radius: 8px;
        border: 1px solid var(--ds-line);
        background: var(--ds-track-bg);
        color: var(--ds-text);
        cursor: pointer;
        display: grid;
        place-items: center;
        font-family: inherit;
      }
      .stepper button:hover:not([disabled]) {
        border-color: var(--accent, var(--ds-accent));
      }
      .stepper button[disabled] {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .stepper .val {
        flex: 1;
        text-align: center;
        font-size: 16px;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
        color: var(--ds-text);
      }
      input.range {
        width: 100%;
        margin: 4px 0 2px;
        accent-color: var(--accent, var(--ds-accent));
        cursor: pointer;
      }
    `,
  ];

  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ attribute: false }) segment!: Segment;
  @property() type!: string;
  @property({ attribute: false }) types!: TypeRegistry;
  @property({ attribute: false }) bounds!: { min: number; max: number };
  @property({ attribute: false }) accent = "";
  /** Target entity ids of the bar — used to read dynamic select options. */
  @property({ attribute: false }) entities: string[] = [];

  @state() private _si = 0;
  @state() private _start = "";
  @state() private _end = "";
  @state() private _jit = 0;
  @state() private _err = "";
  @state() private _data: Record<string, unknown> = {};

  override willUpdate(changed: Map<string, unknown>): void {
    if (changed.has("segment")) {
      this._si = this.segment.state;
      this._start = fmt(this.segment.start);
      this._end = fmt(this.segment.end);
      this._jit = this.segment.jitter ?? 0;
      this._data = { ...(this.segment.data ?? {}) };
      this._err = "";
    }
    this._seedRequiredSelects();
  }

  /** Default a required select (e.g. climate mode) to the first option the
   * target entity offers, so a new active segment carries a valid value. */
  private _seedRequiredSelects(): void {
    for (const p of this._params) {
      if (p.kind !== "select" || p.optional) continue;
      const cur = this._data[p.key];
      if (cur !== undefined && cur !== "") continue;
      const opts = paramOptions(this.hass, this.entities, p);
      if (opts.length) this._data = { ...this._data, [p.key]: opts[0].value };
    }
  }

  private get _params(): TypeParam[] {
    // Params only apply to active states (the off/rest state takes none).
    return isActive(this.types, this.type, this._si)
      ? paramSchema(this.types, this.type)
      : [];
  }

  private _setParam(key: string, value: unknown): void {
    this._data = { ...this._data, [key]: value };
  }

  private _paramNumber(p: TypeParam): number {
    const v = paramValue(this.types, this.type, this._si, { data: this._data }, p);
    return typeof v === "number" ? v : Number(v ?? p.default ?? 0);
  }

  private _step(p: TypeParam, dir: 1 | -1): void {
    const step = p.step ?? 1;
    let v = this._paramNumber(p) + dir * step;
    if (p.min !== undefined) v = Math.max(p.min, v);
    if (p.max !== undefined) v = Math.min(p.max, v);
    v = Math.round(v / step) * step;
    this._setParam(p.key, Math.round(v * 1e4) / 1e4);
  }

  private _save(): void {
    const ps = parse(this._start);
    const pe = parse(this._end);
    if (ps == null || pe == null) return this._fail("Use HH:MM");
    if (pe <= ps) return this._fail("End must be after start");
    if (ps < this.bounds.min || pe > this.bounds.max)
      return this._fail(`Stay within ${fmt(this.bounds.min)}–${fmt(this.bounds.max)}`);
    // Persist only the params that apply to the chosen state; an off segment
    // carries none. A media param owns several data keys.
    const keep = new Set<string>();
    for (const p of this._params) for (const k of paramKeys(p)) keep.add(k);
    const data: Record<string, unknown> = {};
    for (const k of keep) if (this._data[k] !== undefined) data[k] = this._data[k];
    this.dispatchEvent(
      new CustomEvent("segment-save", {
        detail: { ...this.segment, state: this._si, start: ps, end: pe, jitter: this._jit, data },
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
              <button
                class=${i === this._si ? "sel" : ""}
                style=${st.color && i === this._si ? `--accent:${st.color}` : ""}
                @click=${() => (this._si = i)}
              >
                ${st.label}
              </button>
            `
          )}
        </div>

        ${this._params.map((p) => this._renderParam(p))}

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

  private _renderParam(p: TypeParam) {
    if (p.kind === "select") return this._renderSelect(p);
    if (p.kind === "slider") return this._renderSlider(p);
    if (p.kind === "media") return this._renderMedia(p);
    return this._renderStepper(p);
  }

  private _renderSelect(p: TypeParam) {
    const opts = paramOptions(this.hass, this.entities, p);
    if (!opts.length) {
      // Optional params (e.g. fan mode on a unit without one) just disappear;
      // required ones prompt for a target so we can read its options.
      if (p.optional) return nothing;
      return html`
        <div class="field-label" style="margin-top:12px">${p.label}</div>
        <div class="hint" style="color:var(--ds-dim)">
          Pick a target entity to choose ${p.label.toLowerCase()} options.
        </div>
      `;
    }
    const cur = String(paramValue(this.types, this.type, this._si, { data: this._data }, p) ?? "");
    return html`
      <div class="field-label" style="margin-top:12px">${p.label}</div>
      <div class="state-buttons" style=${`--accent:${this.accent}`}>
        ${opts.map(
          (o) => html`
            <button
              class=${o.value === cur ? "sel" : ""}
              @click=${() => this._setParam(p.key, o.value)}
            >
              ${o.label}
            </button>
          `
        )}
      </div>
    `;
  }

  private _renderStepper(p: TypeParam) {
    const val = this._paramNumber(p);
    const step = p.step ?? 1;
    const dp = step < 1 ? 1 : 0;
    return html`
      <div class="field-label" style="margin-top:12px">${p.label}</div>
      <div class="stepper" style=${`--accent:${this.accent}`}>
        <button
          @click=${() => this._step(p, -1)}
          ?disabled=${p.min !== undefined && val <= p.min}
          aria-label=${`Decrease ${p.label}`}
        >
          <ha-icon icon="mdi:minus" style="--mdc-icon-size:16px"></ha-icon>
        </button>
        <span class="val">${val.toFixed(dp)}${p.unit ?? ""}</span>
        <button
          @click=${() => this._step(p, 1)}
          ?disabled=${p.max !== undefined && val >= p.max}
          aria-label=${`Increase ${p.label}`}
        >
          <ha-icon icon="mdi:plus" style="--mdc-icon-size:16px"></ha-icon>
        </button>
      </div>
    `;
  }

  private _renderSlider(p: TypeParam) {
    const val = this._paramNumber(p);
    return html`
      <div class="field-label" style="margin-top:12px;display:flex;align-items:center">
        ${p.label}
        <span style="margin-left:auto;color:var(--ds-text);font-weight:700"
          >${Math.round(val * 100)}%</span
        >
      </div>
      <input
        class="range"
        style=${`--accent:${this.accent}`}
        type="range"
        min=${p.min ?? 0}
        max=${p.max ?? 1}
        step=${p.step ?? 0.05}
        .value=${String(val)}
        @input=${(e: Event) =>
          this._setParam(p.key, Number((e.target as HTMLInputElement).value))}
      />
    `;
  }

  private _renderMedia(p: TypeParam) {
    // The media source is a property of the bar, not the segment. Bind HA's
    // media selector to the bar's first target: passing it as the selector
    // `context.filter_entity` hides the selector's own entity picker (issue
    // #19) and lets "Pick media" browse that player, so its library actually
    // shows up. Also seed `entity_id` in the value for older HA builds that
    // don't yet honour `context`, so browsing still targets the bar's player.
    // (`media_content_id` is portable across a bar's targets, so browsing one
    // is enough — the engine plays the pick to every target.)
    const entity = this.entities[0];
    if (!entity) {
      return html`
        <div class="field-label" style="margin-top:12px">${p.label}</div>
        <div class="hint" style="color:var(--ds-dim)">
          Pick a target entity on the bar to choose media.
        </div>
      `;
    }
    const value = {
      entity_id: entity,
      media_content_id: this._data.media_content_id,
      media_content_type: this._data.media_content_type,
    };
    return html`
      <div class="field-label" style="margin-top:12px">${p.label}</div>
      <ha-selector
        .hass=${this.hass}
        .selector=${{ media: {} }}
        .context=${{ filter_entity: entity }}
        .value=${value}
        @value-changed=${(e: CustomEvent<{ value: MediaValue }>) =>
          this._onMedia(e.detail.value)}
      ></ha-selector>
    `;
  }

  private _onMedia(value: MediaValue | undefined): void {
    this._data = {
      ...this._data,
      media_content_id: value?.media_content_id,
      media_content_type: value?.media_content_type ?? "music",
      media_title: value?.metadata?.title,
    };
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
