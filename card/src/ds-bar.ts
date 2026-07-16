import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { HOURS, SNAP, typeColor } from "./const";
import {
  boundaryLabel,
  boundsFor,
  coveringSegment,
  fmt,
  isActive,
  isStateless,
  jitterLabel,
  largestGap,
  nextTriggerTime,
  paramSummary,
  segmentColor,
  sortedSegments,
  sortedTriggers,
  stateLabel,
  sunEventDef,
} from "./logic";
import "./ds-bar-settings";
import "./ds-trigger-editor";
import { sharedStyles } from "./styles";
import type { Bar, HomeAssistant, Segment, Trigger, TypeRegistry } from "./types";

type DragMode = "move" | "l" | "r";

/** One schedule bar: header controls + interactive day track. */
@customElement("ds-bar")
export class DsBar extends LitElement {
  static override styles = [sharedStyles, barStyles()];

  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ attribute: false }) bar!: Bar;
  @property({ attribute: false }) types!: TypeRegistry;
  @property({ type: Boolean }) scheduleOn = true;
  @property({ attribute: false }) conflicts: string[] = [];
  @property({ type: Number }) now = 0;
  @property({ type: Boolean }) syncing = false;
  @property({ type: Boolean }) reordering = false;

  @state() private _editing: string | null = null; // segment id or "__base__"
  @state() private _drag: { id: string; mode: DragMode } | null = null;
  private _moved = false;

  private get _live(): boolean {
    return this.scheduleOn && this.bar.enabled;
  }

  private _emit(bar: Bar, commit: boolean): void {
    this.dispatchEvent(new CustomEvent("bar-change", { detail: { bar, commit } }));
  }

  private _reorderDown = (e: PointerEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent("bar-reorder-start", {
        detail: { id: this.bar.id, clientY: e.clientY },
        bubbles: true,
        composed: true,
      })
    );
  };

  // -- editing actions --------------------------------------------------

  private _addSegment = (): void => {
    const gap = largestGap(this.bar);
    if (!gap) return;
    const si = this.bar.base === 0 ? 1 : 0;
    const seg: Segment = {
      id: `seg_${Math.random().toString(36).slice(2, 10)}`,
      start: gap.start,
      end: gap.end,
      state: si,
      jitter: 0,
    };
    this._emit({ ...this.bar, segments: [...this.bar.segments, seg] }, true);
    this._editing = seg.id;
  };

  private _saveSegment = (e: CustomEvent<Segment>): void => {
    const ns = e.detail;
    this._emit(
      { ...this.bar, segments: this.bar.segments.map((s) => (s.id === ns.id ? ns : s)) },
      true
    );
    this._editing = null;
  };

  private _deleteSegment = (e: CustomEvent<string>): void => {
    this._emit(
      { ...this.bar, segments: this.bar.segments.filter((s) => s.id !== e.detail) },
      true
    );
    this._editing = null;
  };

  private _pickBase = (e: CustomEvent<number>): void => {
    this._emit({ ...this.bar, base: e.detail }, true);
    this._editing = null;
  };

  private _saveSettings = (e: CustomEvent<{ name: string; targets: string[] }>): void => {
    this._emit({ ...this.bar, name: e.detail.name, targets: e.detail.targets }, true);
    this._editing = null;
  };

  // -- trigger actions (stateless bars) ---------------------------------

  private get _triggers(): Trigger[] {
    return this.bar.triggers ?? [];
  }

  private _addTrigger = (): void => {
    const first = this.types[this.bar.type]?.actions?.[0];
    const trg: Trigger = {
      id: `trg_${Math.random().toString(36).slice(2, 10)}`,
      at: nextTriggerTime(this.bar),
      jitter: 0,
      action: { service: first?.service, entity_id: "" },
    };
    this._emit({ ...this.bar, triggers: [...this._triggers, trg] }, true);
    this._editing = trg.id;
  };

  private _saveTrigger = (e: CustomEvent<Trigger>): void => {
    const nt = e.detail;
    this._emit(
      { ...this.bar, triggers: this._triggers.map((t) => (t.id === nt.id ? nt : t)) },
      true
    );
    this._editing = null;
  };

  private _deleteTrigger = (e: CustomEvent<string>): void => {
    this._emit(
      { ...this.bar, triggers: this._triggers.filter((t) => t.id !== e.detail) },
      true
    );
    this._editing = null;
  };

  private _dragTrigger(trg: Trigger, e: PointerEvent): void {
    e.stopPropagation();
    this._moved = false;
    const startX = e.clientX;
    const origAt = trg.at;
    this._drag = { id: trg.id, mode: "move" };
    const track = this.renderRoot.querySelector(".track") as HTMLElement;

    const move = (ev: PointerEvent): void => {
      const w = track.getBoundingClientRect().width;
      const dh = Math.round((((ev.clientX - startX) / w) * HOURS) / SNAP) * SNAP;
      if (Math.abs(ev.clientX - startX) > 3) this._moved = true;
      const at = Math.max(0, Math.min(HOURS - SNAP, origAt + dh));
      this._emit(
        { ...this.bar, triggers: this._triggers.map((t) => (t.id === trg.id ? { ...t, at } : t)) },
        false
      );
    };
    const up = (): void => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      this._drag = null;
      if (this._moved) this._emit(this.bar, true);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  private _triggerLabel(trg: Trigger): string {
    const id = trg.action?.entity_id;
    if (!id) return "Pick action";
    return this.hass?.states?.[id]?.attributes?.friendly_name ?? id.split(".").pop() ?? id;
  }

  // -- dragging ---------------------------------------------------------

  private _dragSeg(seg: Segment, mode: DragMode, e: PointerEvent): void {
    // A solar boundary moves day to day, so it's edited in the popover, not
    // dragged (issue #3). Skip the drag (and don't stop propagation) so the
    // click still opens the editor; a clock edge on the same segment still drags.
    if (
      (mode === "move" && (seg.start_expr || seg.end_expr)) ||
      (mode === "l" && seg.start_expr) ||
      (mode === "r" && seg.end_expr)
    ) {
      return;
    }
    e.stopPropagation();
    this._moved = false;
    const b = boundsFor(this.bar, seg);
    const startX = e.clientX;
    const orig = { start: seg.start, end: seg.end };
    this._drag = { id: seg.id, mode };
    const track = this.renderRoot.querySelector(".track") as HTMLElement;

    const move = (ev: PointerEvent): void => {
      const w = track.getBoundingClientRect().width;
      const dh = Math.round(((ev.clientX - startX) / w) * HOURS / SNAP) * SNAP;
      if (Math.abs(ev.clientX - startX) > 3) this._moved = true;
      let ns: Segment = { ...seg };
      if (mode === "move") {
        const len = orig.end - orig.start;
        const start = Math.min(b.max - len, Math.max(b.min, orig.start + dh));
        ns = { ...seg, start, end: start + len };
      } else if (mode === "l") {
        ns = { ...seg, start: Math.min(orig.end - SNAP, Math.max(b.min, orig.start + dh)) };
      } else {
        ns = { ...seg, end: Math.max(orig.start + SNAP, Math.min(b.max, orig.end + dh)) };
      }
      this._emit(
        { ...this.bar, segments: this.bar.segments.map((s) => (s.id === seg.id ? ns : s)) },
        false
      );
    };
    const up = (): void => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      this._drag = null;
      if (this._moved) this._emit(this.bar, true); // persist final position
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  // -- render -----------------------------------------------------------

  override render() {
    const accent = typeColor(this.bar.type);
    const t = this.types[this.bar.type];
    const stateless = isStateless(this.types, this.bar.type);
    const segs = sortedSegments(this.bar);
    const editingSeg = segs.find((s) => s.id === this._editing);
    const editingTrg = this._triggers.find((tr) => tr.id === this._editing);

    return html`
      <div
        class=${`bar ${this.reordering ? "reordering" : ""} ${this._live ? "" : "disabled"}`}
        style=${`--accent:${accent}`}
      >
        <div class="head">
          <button
            class="grip"
            title="Drag to reorder"
            @pointerdown=${this._reorderDown}
            @click=${(e: Event) => e.stopPropagation()}
          >
            <ha-icon icon="mdi:drag-horizontal-variant"></ha-icon>
          </button>
          <div class="icon"><ha-icon icon=${t?.icon ?? "mdi:calendar"}></ha-icon></div>
          <div class="meta">
            <div class="name">
              ${this.bar.name}
              ${this.conflicts.length
                ? html`<span
                    class="chip"
                    style="color:var(--ds-warn);background:color-mix(in srgb,var(--ds-warn) 14%,transparent)"
                    title=${`Overlaps ${this.conflicts.join(", ")} on a shared entity`}
                  >
                    <ha-icon icon="mdi:alert" style="--mdc-icon-size:12px"></ha-icon> Conflict
                  </span>`
                : nothing}
            </div>
            <div class="targets">
              ${stateless
                ? `${this._triggers.length} ${this._triggers.length === 1 ? "trigger" : "triggers"}`
                : this.bar.targets.join(" · ") || "No targets"}
            </div>
          </div>
          <div class="controls">
            <button
              class="iconbtn"
              title="Bar settings (name & targets)"
              @click=${() => (this._editing = "__settings__")}
            >
              <ha-icon icon="mdi:cog-outline" style="--mdc-icon-size:17px"></ha-icon>
            </button>
            <button
              class="iconbtn"
              title=${stateless ? "Add trigger" : "Add segment"}
              @click=${stateless ? this._addTrigger : this._addSegment}
            >
              <ha-icon icon="mdi:plus"></ha-icon>
            </button>
            <button
              class="iconbtn"
              title="Duplicate bar"
              @click=${() => this.dispatchEvent(new CustomEvent("bar-duplicate"))}
            >
              <ha-icon icon="mdi:content-copy" style="--mdc-icon-size:18px"></ha-icon>
            </button>
            <button
              class="iconbtn"
              title="Remove bar"
              @click=${() => this.dispatchEvent(new CustomEvent("bar-remove"))}
            >
              <ha-icon icon="mdi:trash-can-outline" style="--mdc-icon-size:18px"></ha-icon>
            </button>
            <div class="divider"></div>
            <ha-switch
              .checked=${this.bar.enabled}
              title="Enable this bar"
              @change=${(e: Event) =>
                this._emit(
                  { ...this.bar, enabled: (e.target as HTMLInputElement).checked },
                  true
                )}
            ></ha-switch>
          </div>
        </div>

        ${stateless ? this._renderTriggerTrack() : this._renderSegmentTrack(segs)}

        ${editingSeg
          ? html`<ds-segment-editor
              .hass=${this.hass}
              .segment=${editingSeg}
              .type=${this.bar.type}
              .types=${this.types}
              .entities=${this.bar.targets}
              .bounds=${boundsFor(this.bar, editingSeg)}
              .accent=${accent}
              @segment-save=${this._saveSegment}
              @segment-delete=${this._deleteSegment}
              @popover-close=${() => (this._editing = null)}
            ></ds-segment-editor>`
          : nothing}
        ${this._editing === "__base__"
          ? html`<ds-base-popover
              .bar=${this.bar}
              .types=${this.types}
              .accent=${accent}
              @base-pick=${this._pickBase}
              @popover-close=${() => (this._editing = null)}
            ></ds-base-popover>`
          : nothing}
        ${this._editing === "__settings__"
          ? html`<ds-bar-settings
              .hass=${this.hass}
              .bar=${this.bar}
              @bar-settings-save=${this._saveSettings}
              @popover-close=${() => (this._editing = null)}
            ></ds-bar-settings>`
          : nothing}
        ${editingTrg
          ? html`<ds-trigger-editor
              .hass=${this.hass}
              .trigger=${editingTrg}
              .actions=${this.types[this.bar.type]?.actions ?? []}
              .accent=${accent}
              @trigger-save=${this._saveTrigger}
              @trigger-delete=${this._deleteTrigger}
              @popover-close=${() => (this._editing = null)}
            ></ds-trigger-editor>`
          : nothing}
      </div>
    `;
  }

  private _renderSegmentTrack(segs: Segment[]) {
    const accent = typeColor(this.bar.type);
    const baseActive = isActive(this.types, this.bar.type, this.bar.base);
    const curSeg = coveringSegment(this.bar, this.now);
    return html`
      <div class="track" @click=${() => (this._editing = "__base__")} style=${`--accent:${accent}`}>
        <div
          class=${`base ${baseActive ? "active" : ""}`}
          title=${`Default: ${stateLabel(this.types, this.bar.type, this.bar.base)} — click to change`}
        >
          ${baseActive
            ? html`<span class="base-label"
                >default: ${stateLabel(this.types, this.bar.type, this.bar.base)}</span
              >`
            : nothing}
        </div>

        ${segs.map((s) => this._renderSegment(s))}

        <div class="now" style=${`left:${(this.now / HOURS) * 100}%`}></div>

        ${this.syncing && this._live && curSeg
          ? html`<div
              class="flash"
              style=${`left:${(curSeg.start / HOURS) * 100}%;width:${
                ((curSeg.end - curSeg.start) / HOURS) * 100
              }%`}
            ></div>`
          : nothing}
        ${this.syncing && this._live && !curSeg
          ? html`<div class="flash base-flash"></div>`
          : nothing}
      </div>
    `;
  }

  private _renderTriggerTrack() {
    const accent = typeColor(this.bar.type);
    return html`
      <div class="track trig" style=${`--accent:${accent}`}>
        ${[6, 12, 18].map(
          (h) => html`<div class="gl" style=${`left:${(h / HOURS) * 100}%`}></div>`
        )}
        ${sortedTriggers(this.bar).map((tr) => this._renderPin(tr))}
        <div class="now" style=${`left:${(this.now / HOURS) * 100}%`}></div>
      </div>
    `;
  }

  private _renderPin(tr: Trigger) {
    const left = (tr.at / HOURS) * 100;
    const dragging = this._drag?.id === tr.id;
    const label = this._triggerLabel(tr);
    const title = `${fmt(tr.at)} · ${label}${tr.jitter ? ` · ${jitterLabel(tr.jitter)}` : ""}`;
    return html`
      <div
        class=${`pin ${dragging ? "dragging" : ""}`}
        style=${`left:${left}%`}
        title=${title}
        @pointerdown=${(e: PointerEvent) => this._dragTrigger(tr, e)}
        @click=${(e: Event) => {
          e.stopPropagation();
          if (!this._moved) this._editing = tr.id;
        }}
      >
        <div class="flag">
          ${tr.jitter
            ? html`<ha-icon icon="mdi:dice-5" style="--mdc-icon-size:11px"></ha-icon>`
            : nothing}
          <span>${label}</span>
        </div>
        <div class="stem"></div>
        <div class="knob"></div>
        ${dragging ? html`<div class="bubble pin-time">${fmt(tr.at)}</div>` : nothing}
      </div>
    `;
  }

  private _renderSegment(s: Segment) {
    const active = isActive(this.types, this.bar.type, s.state);
    const left = (s.start / HOURS) * 100;
    const width = ((s.end - s.start) / HOURS) * 100;
    const summary = active ? paramSummary(this.types, this.bar.type, s) : "";
    // Prefer the parameter summary as the label (e.g. "Heat · 21°"); fall back
    // to the plain state label for simple types ("On", "Low").
    const label = summary || stateLabel(this.types, this.bar.type, s.state);
    const color = active ? segmentColor(this.types, this.bar.type, s) : "";
    const dragging = this._drag?.id === s.id;
    const showStart = dragging && (this._drag!.mode === "move" || this._drag!.mode === "l");
    const showEnd = dragging && (this._drag!.mode === "move" || this._drag!.mode === "r");
    const title = `${boundaryLabel(s, "start")}–${boundaryLabel(s, "end")} · ${label}${
      s.jitter ? ` · ${jitterLabel(s.jitter)}` : ""
    }`;
    return html`
      <div
        class=${`seg ${active ? "active" : "inactive"} ${dragging ? "dragging" : ""} ${
          s.start_expr ? "solar-l" : ""
        } ${s.end_expr ? "solar-r" : ""}`}
        style=${`left:${left}%;width:${width}%${color ? `;--accent:${color}` : ""}`}
        title=${title}
        @pointerdown=${(e: PointerEvent) => this._dragSeg(s, "move", e)}
        @click=${(e: Event) => {
          e.stopPropagation();
          if (!this._moved) this._editing = s.id;
        }}
      >
        <div class="handle l" @pointerdown=${(e: PointerEvent) => this._dragSeg(s, "l", e)}>
          <span></span>
        </div>
        ${s.start_expr ? this._renderSunEdge(s, "start") : nothing}
        ${width > 8
          ? html`<span class="seg-label"
              >${label}${s.jitter
                ? html`<ha-icon icon="mdi:dice-5" style="--mdc-icon-size:12px"></ha-icon>`
                : nothing}</span
            >`
          : nothing}
        ${s.end_expr ? this._renderSunEdge(s, "end") : nothing}
        <div class="handle r" @pointerdown=${(e: PointerEvent) => this._dragSeg(s, "r", e)}>
          <span></span>
        </div>
        ${showStart ? html`<div class="bubble l">${fmt(s.start)}</div>` : nothing}
        ${showEnd ? html`<div class="bubble r">${fmt(s.end)}</div>` : nothing}
      </div>
    `;
  }

  /** A small sun marker on a solar boundary, at the segment's left/right edge. */
  private _renderSunEdge(s: Segment, which: "start" | "end") {
    const expr = which === "start" ? s.start_expr : s.end_expr;
    if (!expr) return nothing;
    const icon = sunEventDef(expr.event)?.icon ?? "mdi:weather-sunny";
    return html`<div class=${`sun-edge ${which === "start" ? "l" : "r"}`} title=${boundaryLabel(s, which)}>
      <ha-icon icon=${icon} style="--mdc-icon-size:11px"></ha-icon>
    </div>`;
  }
}

function barStyles() {
  return css`
    .bar {
      margin-bottom: 14px;
      position: relative;
    }
    /* Disabled bars stay fully legible and editable — only the timeline is
       desaturated to signal "not running" (the per-bar switch carries the
       state). See issue #23. */
    .bar.disabled .track {
      filter: grayscale(1) brightness(0.92);
    }
    .bar.reordering {
      z-index: 5;
    }
    .bar.reordering .head,
    .bar.reordering .track {
      outline: 2px solid color-mix(in srgb, var(--accent) 55%, transparent);
      outline-offset: 3px;
      border-radius: 8px;
    }
    .bar.reordering .track {
      box-shadow: 0 10px 26px rgba(0, 0, 0, 0.5);
    }
    .head {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 7px;
    }
    .grip {
      width: 20px;
      height: 30px;
      flex-shrink: 0;
      border: none;
      background: transparent;
      color: var(--ds-dim);
      cursor: grab;
      display: grid;
      place-items: center;
      padding: 0;
      touch-action: none;
    }
    .grip:hover {
      color: var(--ds-text);
    }
    .grip:active {
      cursor: grabbing;
    }
    .icon {
      width: 30px;
      height: 30px;
      border-radius: 8px;
      background: var(--ds-panel-hi);
      display: grid;
      place-items: center;
      color: var(--accent);
      flex-shrink: 0;
    }
    .meta {
      min-width: 0;
    }
    .name {
      font-size: 13.5px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--ds-text);
    }
    .targets {
      font-size: 11.5px;
      color: var(--ds-dim);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .controls {
      margin-left: auto;
      display: flex;
      gap: 2px;
      align-items: center;
    }
    .iconbtn {
      width: 28px;
      height: 28px;
      border-radius: 7px;
      border: none;
      cursor: pointer;
      background: transparent;
      color: var(--ds-dim);
      display: grid;
      place-items: center;
    }
    .iconbtn:hover {
      background: var(--ds-panel-hi);
      color: var(--ds-text);
    }
    .divider {
      width: 1px;
      height: 20px;
      background: var(--ds-line);
      margin: 0 4px;
    }
    .track {
      position: relative;
      height: 46px;
      background: var(--ds-track-bg);
      border-radius: 8px;
      border: 1px solid var(--ds-line);
      overflow: hidden;
    }
    .base {
      position: absolute;
      inset: 0;
      cursor: pointer;
      background: var(--ds-panel-hi);
    }
    .base.active {
      background: repeating-linear-gradient(
        135deg,
        color-mix(in srgb, var(--accent) 80%, transparent) 0 8px,
        color-mix(in srgb, var(--accent) 60%, transparent) 8px 16px
      );
    }
    .base-label {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 9.5px;
      font-weight: 700;
      color: #1a1200;
      opacity: 0.8;
      pointer-events: none;
    }
    .seg {
      position: absolute;
      top: 3px;
      bottom: 3px;
      border-radius: 5px;
      cursor: grab;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
    }
    .seg.active {
      background: linear-gradient(
        180deg,
        var(--accent),
        color-mix(in srgb, var(--accent) 80%, transparent)
      );
    }
    .seg.inactive {
      background: var(--ds-panel-hi);
      border: 1px solid var(--ds-line);
      outline: 1px solid var(--ds-dim);
    }
    .seg.dragging {
      z-index: 8;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.6);
    }
    /* Solar edges (issue #3): a soft glow hints the boundary drifts by day. */
    .seg.solar-l {
      cursor: pointer;
    }
    .seg.solar-l::before,
    .seg.solar-r::after {
      content: "";
      position: absolute;
      top: 0;
      bottom: 0;
      width: 20px;
      pointer-events: none;
    }
    .seg.solar-l::before {
      left: 0;
      border-top-left-radius: 5px;
      border-bottom-left-radius: 5px;
      background: linear-gradient(90deg, color-mix(in srgb, var(--ds-sun) 70%, transparent), transparent);
    }
    .seg.solar-r::after {
      right: 0;
      border-top-right-radius: 5px;
      border-bottom-right-radius: 5px;
      background: linear-gradient(270deg, color-mix(in srgb, var(--ds-sun) 70%, transparent), transparent);
    }
    .sun-edge {
      position: absolute;
      top: -7px;
      z-index: 6;
      width: 17px;
      height: 17px;
      border-radius: 50%;
      background: var(--ds-sun);
      color: #1a1200;
      display: grid;
      place-items: center;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
      pointer-events: none;
    }
    .sun-edge.l {
      left: -8px;
    }
    .sun-edge.r {
      right: -8px;
    }
    .seg-label {
      font-size: 10.5px;
      font-weight: 600;
      pointer-events: none;
      display: flex;
      align-items: center;
      gap: 3px;
      white-space: nowrap;
      color: #1a1200;
    }
    .seg.inactive .seg-label {
      color: var(--ds-dim);
    }
    .seg-sub {
      font-weight: 600;
      opacity: 0.72;
      font-variant-numeric: tabular-nums;
    }
    .handle {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 10px;
      cursor: ew-resize;
      display: flex;
      align-items: center;
      z-index: 5;
    }
    .handle.l {
      left: 0;
      justify-content: flex-start;
      padding-left: 2px;
    }
    .handle.r {
      right: 0;
      justify-content: flex-end;
      padding-right: 2px;
    }
    .handle span {
      width: 2.5px;
      height: 45%;
      background: rgba(255, 255, 255, 0.67);
      border-radius: 2px;
    }
    .bubble {
      position: absolute;
      top: 2px;
      background: #fff;
      color: #12161c;
      font-size: 10px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 4px;
      white-space: nowrap;
      pointer-events: none;
      font-variant-numeric: tabular-nums;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
      z-index: 12;
    }
    .bubble.l {
      left: 2px;
    }
    .bubble.r {
      right: 2px;
    }
    .now {
      position: absolute;
      top: -2px;
      bottom: -2px;
      width: 2px;
      background: var(--ds-now);
      z-index: 6;
      pointer-events: none;
    }
    .track.trig {
      height: 58px;
    }
    .gl {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 1px;
      background: var(--ds-line);
      opacity: 0.5;
    }
    .pin {
      position: absolute;
      top: 8px;
      bottom: 8px;
      width: 0;
      z-index: 4;
      cursor: grab;
    }
    .pin.dragging {
      z-index: 9;
      cursor: grabbing;
    }
    .pin .stem {
      position: absolute;
      left: -1px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: color-mix(in srgb, var(--accent) 85%, #000);
      pointer-events: none;
    }
    .pin .knob {
      position: absolute;
      bottom: -3px;
      left: -1px;
      transform: translateX(-50%);
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: var(--accent);
      border: 2px solid var(--ds-track-bg);
      pointer-events: none;
    }
    .pin .flag {
      position: absolute;
      top: -4px;
      left: -1px;
      transform: translateX(-50%);
      background: var(--accent);
      color: #1a2400;
      font-size: 10.5px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 4px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.45);
    }
    .pin.dragging .flag {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
    }
    .pin .bubble.pin-time {
      top: 50%;
      left: 0;
      transform: translate(-50%, -50%);
    }
    .flash {
      position: absolute;
      top: 1px;
      bottom: 1px;
      border-radius: 6px;
      border: 2px solid #fff;
      z-index: 7;
      pointer-events: none;
      animation: ds-pulse 0.6s ease-in-out 2;
    }
    .flash.base-flash {
      inset: 1px;
      width: auto;
    }
    @keyframes ds-pulse {
      0%,
      100% {
        opacity: 1;
      }
      50% {
        opacity: 0.25;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "ds-bar": DsBar;
  }
}
