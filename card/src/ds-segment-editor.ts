import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { JITTERS, MAX_SOLAR_OFFSET, SNAP, SUN_EVENTS } from "./const";
import {
  fmt,
  isActive,
  offsetLabel,
  paramKeys,
  paramOptions,
  paramSchema,
  paramValue,
  parse,
  resolveBoundaryHour,
  snap,
  sunEventDef,
} from "./logic";
import { sharedStyles } from "./styles";
import type { HomeAssistant, Segment, SunExpr, TypeParam, TypeRegistry } from "./types";

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
      /* -- sun-relative boundary editor (issue #3) -- */
      .bnd {
        border: 1px solid var(--ds-line);
        border-radius: 10px;
        padding: 10px;
        margin: 12px 0 0;
      }
      .bnd-head {
        display: flex;
        align-items: center;
        margin-bottom: 9px;
      }
      .bnd-head .lbl {
        font-size: 12px;
        font-weight: 700;
      }
      .toggle {
        margin-left: auto;
        display: inline-flex;
        border: 1px solid var(--ds-line);
        border-radius: 8px;
        overflow: hidden;
      }
      .toggle button {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 9px;
        font-size: 11px;
        font-weight: 600;
        background: transparent;
        color: var(--ds-dim);
        border: none;
        cursor: pointer;
        font-family: inherit;
      }
      .toggle button.sel {
        background: color-mix(in srgb, var(--ds-accent) 20%, transparent);
        color: var(--ds-text);
      }
      .toggle button.sel.sun {
        background: color-mix(in srgb, var(--ds-sun) 26%, transparent);
        color: #ffe9b0;
      }
      .evrow {
        display: flex;
        gap: 6px;
        margin-bottom: 9px;
      }
      .evrow .sbtn {
        flex: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        padding: 6px 4px;
        border-radius: 8px;
        font-size: 11px;
        font-weight: 600;
        border: 1px solid var(--ds-line);
        background: transparent;
        color: var(--ds-dim);
        cursor: pointer;
        font-family: inherit;
      }
      .evrow .sbtn.sel {
        border-color: var(--ds-sun);
        background: color-mix(in srgb, var(--ds-sun) 18%, transparent);
        color: var(--ds-text);
      }
      .offrow {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .offrow .k {
        font-size: 11px;
        color: var(--ds-dim);
        width: 44px;
      }
      .offrow .stepper {
        flex: 1;
      }
      .resolved {
        margin-top: 9px;
        font-size: 11px;
        color: #ffe0a3;
        display: flex;
        align-items: center;
        gap: 6px;
        background: color-mix(in srgb, var(--ds-sun) 12%, transparent);
        border-radius: 7px;
        padding: 5px 8px;
      }
      .resolved ha-icon {
        color: var(--ds-sun);
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
  // Each boundary is a clock string OR a solar expression (issue #3). The
  // clock string is kept even in Sun mode so toggling back restores it.
  @state() private _startClock = "";
  @state() private _endClock = "";
  @state() private _startExpr: SunExpr | null = null;
  @state() private _endExpr: SunExpr | null = null;
  @state() private _jit = 0;
  @state() private _err = "";
  @state() private _data: Record<string, unknown> = {};

  // The segment id these fields were seeded from. A live schedule broadcast
  // reassigns `segment` (a fresh object per push), so re-seeding on any change
  // would discard in-progress edits; seed only when a different segment opens.
  private _seededFor: string | null = null;

  override willUpdate(changed: Map<string, unknown>): void {
    if (changed.has("segment") && this.segment.id !== this._seededFor) {
      this._seededFor = this.segment.id;
      this._si = this.segment.state;
      this._startClock = fmt(this.segment.start);
      this._endClock = fmt(this.segment.end);
      this._startExpr = this.segment.start_expr ?? null;
      this._endExpr = this.segment.end_expr ?? null;
      this._jit = this.segment.jitter ?? 0;
      this._data = { ...(this.segment.data ?? {}) };
      this._err = "";
    }
    this._seedSelects();
  }

  // -- boundary helpers (clock <-> sun) ---------------------------------

  private _expr(which: "start" | "end"): SunExpr | null {
    return which === "start" ? this._startExpr : this._endExpr;
  }

  private _setExpr(which: "start" | "end", expr: SunExpr | null): void {
    if (which === "start") this._startExpr = expr;
    else this._endExpr = expr;
    this._err = "";
  }

  private _setMode(which: "start" | "end", mode: "clock" | "sun"): void {
    if (mode === "sun") {
      if (!this._expr(which)) this._setExpr(which, { event: "sunset", offset: 0 });
    } else {
      // Back to clock: seed the field from today's resolved solar time so the
      // value doesn't jump.
      const nominal = which === "start" ? this.segment.start : this.segment.end;
      const resolved = resolveBoundaryHour(this.hass, nominal, this._expr(which));
      if (which === "start") this._startClock = fmt(resolved);
      else this._endClock = fmt(resolved);
      this._setExpr(which, null);
    }
  }

  private _stepOffset(which: "start" | "end", dir: 1 | -1): void {
    const expr = this._expr(which);
    if (!expr) return;
    // Grid to 15-min (offsets are signed, so no [0,24] clamp like `snap`).
    const gridded = Math.round((expr.offset + dir * SNAP) / SNAP) * SNAP;
    const offset = Math.max(-MAX_SOLAR_OFFSET, Math.min(MAX_SOLAR_OFFSET, gridded));
    this._setExpr(which, { ...expr, offset: Math.round(offset * 1e4) / 1e4 });
  }

  /** Today's resolved "≈ HH:MM" for a solar boundary, or null if unresolvable. */
  private _resolvedHint(which: "start" | "end"): string | null {
    const expr = this._expr(which);
    if (!expr) return null;
    if (this.hass?.states?.["sun.sun"] === undefined) return null;
    const nominal = which === "start" ? this.segment.start : this.segment.end;
    return fmt(resolveBoundaryHour(this.hass, nominal, expr));
  }

  /** Default every select the target entity offers options for to its first
   * option, so a new active segment carries a value for each supported setting.
   * IR climate (e.g. SmartIR) re-sends the whole config on each call, so leaving
   * fan/swing unset would bake a stale value into the signal — seeding avoids
   * that. Selects the entity can't fill (no options) stay empty and are skipped. */
  private _seedSelects(): void {
    for (const p of this._params) {
      if (p.kind !== "select") continue;
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
    // Resolve each boundary to a concrete "nominal" hour: from the solar event
    // (today) when in Sun mode, else from the clock field.
    let start: number;
    let end: number;
    if (this._startExpr) start = snap(resolveBoundaryHour(this.hass, this.segment.start, this._startExpr));
    else {
      const p = parse(this._startClock);
      if (p == null) return this._fail("Use HH:MM");
      start = p;
    }
    if (this._endExpr) end = snap(resolveBoundaryHour(this.hass, this.segment.end, this._endExpr));
    else {
      const p = parse(this._endClock);
      if (p == null) return this._fail("Use HH:MM");
      end = p;
    }
    // Order/bounds only bind when BOTH edges are clock. With a solar edge the
    // resolved order varies by day; an inverted day is handled by the engine
    // (the segment simply doesn't run that day).
    if (!this._startExpr && !this._endExpr) {
      if (end <= start) return this._fail("End must be after start");
      if (start < this.bounds.min || end > this.bounds.max)
        return this._fail(`Stay within ${fmt(this.bounds.min)}–${fmt(this.bounds.max)}`);
    }
    // Persist only the params that apply to the chosen state; an off segment
    // carries none. A media param owns several data keys.
    const keep = new Set<string>();
    for (const p of this._params) for (const k of paramKeys(p)) keep.add(k);
    const data: Record<string, unknown> = {};
    for (const k of keep) if (this._data[k] !== undefined) data[k] = this._data[k];
    this.dispatchEvent(
      new CustomEvent("segment-save", {
        detail: {
          ...this.segment,
          state: this._si,
          start,
          end,
          jitter: this._jit,
          data,
          start_expr: this._startExpr,
          end_expr: this._endExpr,
        },
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

        ${this._renderBoundary("start")} ${this._renderBoundary("end")}
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

  private _renderBoundary(which: "start" | "end") {
    const expr = this._expr(which);
    const label = which === "start" ? "Start" : "End";
    const clock = which === "start" ? this._startClock : this._endClock;
    const hint = this._resolvedHint(which);
    return html`
      <div class="bnd">
        <div class="bnd-head">
          <span class="lbl">${label}</span>
          <span class="toggle">
            <button
              class=${expr ? "" : "sel"}
              @click=${() => this._setMode(which, "clock")}
            >
              <ha-icon icon="mdi:clock-outline" style="--mdc-icon-size:13px"></ha-icon>Clock
            </button>
            <button
              class=${expr ? "sel sun" : ""}
              @click=${() => this._setMode(which, "sun")}
            >
              <ha-icon icon="mdi:weather-sunny" style="--mdc-icon-size:13px"></ha-icon>Sun
            </button>
          </span>
        </div>
        ${expr
          ? html`
              <div class="evrow">
                ${SUN_EVENTS.map(
                  (ev) => html`
                    <button
                      class=${`sbtn ${expr.event === ev.key ? "sel" : ""}`}
                      title=${ev.label}
                      @click=${() => this._setExpr(which, { ...expr, event: ev.key })}
                    >
                      <ha-icon icon=${ev.icon} style="--mdc-icon-size:14px"></ha-icon>
                      ${ev.label}
                    </button>
                  `
                )}
              </div>
              <div class="offrow">
                <span class="k">Offset</span>
                <div class="stepper">
                  <button
                    @click=${() => this._stepOffset(which, -1)}
                    ?disabled=${expr.offset <= -MAX_SOLAR_OFFSET}
                    aria-label="Earlier"
                  >
                    <ha-icon icon="mdi:minus" style="--mdc-icon-size:15px"></ha-icon>
                  </button>
                  <span class="val">${offsetLabel(expr.offset)}</span>
                  <button
                    @click=${() => this._stepOffset(which, 1)}
                    ?disabled=${expr.offset >= MAX_SOLAR_OFFSET}
                    aria-label="Later"
                  >
                    <ha-icon icon="mdi:plus" style="--mdc-icon-size:15px"></ha-icon>
                  </button>
                </div>
              </div>
              ${hint
                ? html`<div class="resolved">
                    <ha-icon icon="mdi:weather-sunset" style="--mdc-icon-size:13px"></ha-icon>
                    ≈ ${hint} today
                  </div>`
                : html`<div class="hint" style="margin:8px 0 0">
                    Resolves per day from your location’s ${sunEventDef(expr.event)?.label ?? ""}.
                  </div>`}
            `
          : html`
              <input
                class="time"
                .value=${clock}
                @input=${(e: Event) => {
                  const v = (e.target as HTMLInputElement).value;
                  if (which === "start") this._startClock = v;
                  else this._endClock = v;
                  this._err = "";
                }}
              />
            `}
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
