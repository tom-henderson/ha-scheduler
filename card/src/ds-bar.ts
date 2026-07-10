import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { HOURS, SNAP, typeColor } from "./const";
import {
  boundsFor,
  coveringSegment,
  fmt,
  isActive,
  jitterLabel,
  largestGap,
  paramSummary,
  sortedSegments,
  stateColor,
  stateLabel,
} from "./logic";
import "./ds-bar-settings";
import { sharedStyles } from "./styles";
import type { Bar, HomeAssistant, Segment, TypeRegistry } from "./types";

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

  @state() private _editing: string | null = null; // segment id or "__base__"
  @state() private _drag: { id: string; mode: DragMode } | null = null;
  private _moved = false;

  private get _live(): boolean {
    return this.scheduleOn && this.bar.enabled;
  }

  private _emit(bar: Bar, commit: boolean): void {
    this.dispatchEvent(new CustomEvent("bar-change", { detail: { bar, commit } }));
  }

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

  // -- dragging ---------------------------------------------------------

  private _dragSeg(seg: Segment, mode: DragMode, e: PointerEvent): void {
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
    const segs = sortedSegments(this.bar);
    const baseActive = isActive(this.types, this.bar.type, this.bar.base);
    const editingSeg = segs.find((s) => s.id === this._editing);
    const curSeg = coveringSegment(this.bar, this.now);

    return html`
      <div class="bar" style=${`opacity:${this._live ? 1 : 0.4};--accent:${accent}`}>
        <div class="head">
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
            <div class="targets">${this.bar.targets.join(" · ") || "No targets"}</div>
          </div>
          <div class="controls">
            <button
              class="iconbtn"
              title="Bar settings (name & targets)"
              @click=${() => (this._editing = "__settings__")}
            >
              <ha-icon icon="mdi:cog-outline" style="--mdc-icon-size:17px"></ha-icon>
            </button>
            <button class="iconbtn" title="Add segment" @click=${this._addSegment}>
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

        <div class="track" @click=${() => (this._editing = "__base__")}>
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

        ${editingSeg
          ? html`<ds-segment-editor
              .hass=${this.hass}
              .segment=${editingSeg}
              .type=${this.bar.type}
              .types=${this.types}
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
      </div>
    `;
  }

  private _renderSegment(s: Segment) {
    const active = isActive(this.types, this.bar.type, s.state);
    const left = (s.start / HOURS) * 100;
    const width = ((s.end - s.start) / HOURS) * 100;
    const label = stateLabel(this.types, this.bar.type, s.state);
    const summary = active ? paramSummary(this.types, this.bar.type, s) : "";
    const color = active ? stateColor(this.types, this.bar.type, s.state) : "";
    const dragging = this._drag?.id === s.id;
    const showStart = dragging && (this._drag!.mode === "move" || this._drag!.mode === "l");
    const showEnd = dragging && (this._drag!.mode === "move" || this._drag!.mode === "r");
    const title = `${fmt(s.start)}–${fmt(s.end)} · ${label}${
      summary ? ` ${summary}` : ""
    }${s.jitter ? ` · ${jitterLabel(s.jitter)}` : ""}`;
    return html`
      <div
        class=${`seg ${active ? "active" : "inactive"} ${dragging ? "dragging" : ""}`}
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
        ${width > 8
          ? html`<span class="seg-label"
              >${label}${summary
                ? html`<span class="seg-sub">${summary}</span>`
                : nothing}${s.jitter
                ? html`<ha-icon icon="mdi:dice-5" style="--mdc-icon-size:12px"></ha-icon>`
                : nothing}</span
            >`
          : nothing}
        <div class="handle r" @pointerdown=${(e: PointerEvent) => this._dragSeg(s, "r", e)}>
          <span></span>
        </div>
        ${showStart ? html`<div class="bubble l">${fmt(s.start)}</div>` : nothing}
        ${showEnd ? html`<div class="bubble r">${fmt(s.end)}</div>` : nothing}
      </div>
    `;
  }
}

function barStyles() {
  return css`
    .bar {
      margin-bottom: 14px;
      position: relative;
      transition: opacity 0.2s;
    }
    .head {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 7px;
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
