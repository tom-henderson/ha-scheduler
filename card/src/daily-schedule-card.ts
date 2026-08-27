import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import "./ds-bar";
import "./ds-segment-editor";
import "./ds-base-popover";
import "./ds-editor";
import { DOMAIN, HOURS, typeColor } from "./const";
import { fmt } from "./logic";
import { sharedStyles } from "./styles";
import type {
  Bar,
  DailyScheduleCardConfig,
  EntryInfo,
  HomeAssistant,
  Schedule,
  TypeRegistry,
} from "./types";

// Current wall-clock time as hours-past-midnight. When a timeZone (the home's
// IANA zone, e.g. "Europe/Paris") is given the value reflects that zone rather
// than the viewer's, so the "now" line is correct while away from home.
const nowHours = (timeZone?: string): number => {
  const d = new Date();
  if (timeZone) {
    try {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone,
        hourCycle: "h23",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).formatToParts(d);
      const get = (t: string): number =>
        Number(parts.find((p) => p.type === t)?.value ?? "0");
      return get("hour") + get("minute") / 60 + get("second") / 3600;
    } catch {
      // Unknown/invalid zone: fall back to the viewer's local time below.
    }
  }
  return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
};

@customElement("daily-schedule-card")
export class DailyScheduleCard extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @state() private _config!: DailyScheduleCardConfig;

  @state() private _schedule?: Schedule;
  @state() private _types: TypeRegistry = {};
  @state() private _entryId?: string;
  @state() private _error?: string;
  @state() private _now = nowHours();
  @state() private _syncing = false;
  @state() private _menuOpen = false;
  @state() private _reorderId?: string;

  private _unsub?: Promise<() => void>;
  private _nowTimer?: number;
  private _lastTz?: string;
  private _connectedEntry?: string;
  private _connecting = false;

  static getConfigElement() {
    return document.createElement("ds-editor");
  }

  static getStubConfig() {
    return { entry_id: "" };
  }

  setConfig(config: DailyScheduleCardConfig): void {
    this._config = config;
    this._entryId = config.entry_id || undefined;
    // Re-subscribe if the configured entry changed.
    if (this._connectedEntry && this._connectedEntry !== this._entryId) {
      this._teardown();
    }
  }

  private _homeTz(): string | undefined {
    return this.hass?.config?.time_zone;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this._now = nowHours(this._homeTz());
    this._nowTimer = window.setInterval(
      () => (this._now = nowHours(this._homeTz())),
      30000
    );
    this._maybeConnect();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._nowTimer) window.clearInterval(this._nowTimer);
    this._teardown();
  }

  override updated(): void {
    // Reflect the home timezone as soon as hass arrives (or if it changes)
    // without waiting for the next timer tick.
    const tz = this._homeTz();
    if (tz !== this._lastTz) {
      this._lastTz = tz;
      this._now = nowHours(tz);
    }
    this._maybeConnect();
  }

  private async _maybeConnect(): Promise<void> {
    if (!this.hass || this._connectedEntry || this._connecting) return;
    this._connecting = true;
    try {
      await this._connect();
    } finally {
      this._connecting = false;
    }
  }

  private async _connect(): Promise<void> {
    if (!this._entryId) {
      // Auto-select the only entry if none configured.
      try {
        const res = await this.hass.callWS<{ entries: EntryInfo[]; types: TypeRegistry }>({
          type: `${DOMAIN}/list_entries`,
        });
        this._types = res.types;
        if (res.entries.length === 1) this._entryId = res.entries[0].entry_id;
        else if (res.entries.length === 0) {
          this._error = "No Daily Schedule is set up. Add the integration first.";
          return;
        } else {
          this._error = "Multiple schedules found — set entry_id in the card config.";
          return;
        }
      } catch (err) {
        this._error = `Could not reach Daily Schedule: ${err}`;
        return;
      }
    }

    this._connectedEntry = this._entryId;
    this._error = undefined;
    try {
      this._unsub = this.hass.connection.subscribeMessage<Schedule & { types?: TypeRegistry }>(
        (msg) => {
          this._schedule = msg;
        },
        { type: `${DOMAIN}/subscribe`, entry_id: this._entryId }
      );
      // Fetch once to grab the type registry alongside the schedule.
      const full = await this.hass.callWS<Schedule & { types: TypeRegistry }>({
        type: `${DOMAIN}/get`,
        entry_id: this._entryId,
      });
      this._types = full.types;
      this._schedule = full;
    } catch (err) {
      this._error = `Could not load schedule: ${err}`;
      this._connectedEntry = undefined;
    }
  }

  private _teardown(): void {
    this._unsub?.then((u) => u()).catch(() => undefined);
    this._unsub = undefined;
    this._connectedEntry = undefined;
    this._schedule = undefined;
  }

  // -- commands ---------------------------------------------------------

  private async _ws(type: string, extra: Record<string, unknown> = {}): Promise<void> {
    try {
      await this.hass.callWS({ type: `${DOMAIN}/${type}`, entry_id: this._entryId, ...extra });
    } catch (err) {
      this._error = `${type} failed: ${err}`;
    }
  }

  private _onBarChange = (bar: Bar, commit: boolean): void => {
    if (!this._schedule) return;
    // Optimistic local update so drags stay smooth.
    this._schedule = {
      ...this._schedule,
      bars: this._schedule.bars.map((b) => (b.id === bar.id ? bar : b)),
    };
    if (commit) this._ws("update_bar", { bar_id: bar.id, bar });
  };

  private _setEnabled(enabled: boolean): void {
    if (this._schedule) this._schedule = { ...this._schedule, enabled };
    this._ws("set_enabled", { enabled });
  }

  private async _syncNow(): Promise<void> {
    if (!this._schedule?.enabled) return;
    this._syncing = true;
    await this._ws("sync_now");
    window.setTimeout(() => (this._syncing = false), 1400);
  }

  // -- bar reordering (drag the grip up/down) ---------------------------

  private _onReorderStart = (e: Event): void => {
    if (!this._schedule) return;
    this._reorderId = (e as CustomEvent<{ id: string }>).detail.id;
    const move = (ev: PointerEvent): void => this._onReorderMove(ev);
    const up = (): void => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      const order = this._schedule?.bars.map((b) => b.id) ?? [];
      this._reorderId = undefined;
      this._ws("reorder_bars", { order });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  private _onReorderMove(ev: PointerEvent): void {
    if (!this._reorderId || !this._schedule) return;
    const bars = this._schedule.bars;
    const dragged = bars.find((b) => b.id === this._reorderId);
    if (!dragged) return;
    const els = [...this.renderRoot.querySelectorAll("ds-bar")] as HTMLElement[];
    const rectById = new Map<string, DOMRect>();
    bars.forEach((b, i) => {
      const r = els[i]?.getBoundingClientRect();
      if (r) rectById.set(b.id, r);
    });
    // Insert the dragged bar before the first *other* bar whose midpoint is
    // below the pointer; measuring only the non-dragged bars keeps it stable.
    const rest = bars.filter((b) => b.id !== this._reorderId);
    let insert = rest.length;
    for (let i = 0; i < rest.length; i++) {
      const r = rectById.get(rest[i].id);
      if (r && ev.clientY < r.top + r.height / 2) {
        insert = i;
        break;
      }
    }
    const next = [...rest.slice(0, insert), dragged, ...rest.slice(insert)];
    if (next.some((b, i) => b.id !== bars[i].id)) {
      this._schedule = { ...this._schedule, bars: next };
    }
  }

  private _addBar(type: string): void {
    this._menuOpen = false;
    const def = this._types[type];
    if (def?.kind === "stateless") {
      const action = def.actions?.[0];
      this._ws("add_bar", {
        bar: {
          name: "New triggers",
          type,
          targets: [],
          enabled: true,
          triggers: [{ at: 12, jitter: 0, action: { service: action?.service, entity_id: "" } }],
        },
      });
      return;
    }
    this._ws("add_bar", {
      bar: {
        name: "New schedule",
        type,
        targets: [],
        base: 0,
        enabled: true,
        segments: [{ start: 8, end: 18, state: 1, jitter: 0 }],
      },
    });
  }

  // -- render -----------------------------------------------------------

  override render() {
    if (this._error) return this._card(html`<div class="error">${this._error}</div>`);
    if (!this._schedule) return this._card(html`<div class="loading">Loading…</div>`);

    const sched = this._schedule;
    const barCount = sched.bars.length;
    const title = this._config?.title ?? "Daily Schedule";

    return this._card(html`
      <div class="header">
        <div>
          <div class="title">${title}</div>
          <div class="subtitle">
            Repeats every day · ${barCount} ${barCount === 1 ? "bar" : "bars"}
          </div>
        </div>
        <div class="header-right">
          <button
            class="sync ${this._syncing ? "on" : ""}"
            ?disabled=${!sched.enabled}
            title="Set every entity to its state for the current time"
            @click=${this._syncNow}
          >
            <ha-icon
              icon="mdi:refresh"
              class=${this._syncing ? "spin" : ""}
              style="--mdc-icon-size:16px"
            ></ha-icon>
            ${this._syncing ? "Syncing…" : "Sync now"}
          </button>
          <div class="vdiv"></div>
          <span class="enabled-label" style=${sched.enabled ? "color:var(--ds-accent)" : ""}>
            ${sched.enabled ? "Enabled" : "Disabled"}
          </span>
          <ha-switch
            .checked=${sched.enabled}
            @change=${(e: Event) => this._setEnabled((e.target as HTMLInputElement).checked)}
          ></ha-switch>
        </div>
      </div>

      <div class="body">
        <div class="ruler">
          ${[0, 6, 12, 18, 24].map(
            (h) => html`<span
              class="tick"
              style=${`left:${(h / HOURS) * 100}%;transform:${
                h === 0 ? "none" : h === 24 ? "translateX(-100%)" : "translateX(-50%)"
              }`}
              >${fmt(h)}</span
            >`
          )}
          <span class="now-label" style=${`left:${(this._now / HOURS) * 100}%`}>${fmt(this._now)}</span>
        </div>

        <div class="bars" @bar-reorder-start=${this._onReorderStart}>
          <div class="gridlines">
            ${[6, 12, 18].map(
              (h) => html`<div class="gl" style=${`left:${(h / HOURS) * 100}%`}></div>`
            )}
          </div>
          ${sched.bars.map(
            (bar) => html`
              <ds-bar
                .hass=${this.hass}
                .bar=${bar}
                .types=${this._types}
                .scheduleOn=${sched.enabled}
                .conflicts=${sched.conflicts?.[bar.id] ?? []}
                .now=${this._now}
                .syncing=${this._syncing}
                .reordering=${bar.id === this._reorderId}
                @bar-change=${(e: CustomEvent<{ bar: Bar; commit: boolean }>) =>
                  this._onBarChange(e.detail.bar, e.detail.commit)}
                @bar-remove=${() => this._ws("delete_bar", { bar_id: bar.id })}
                @bar-duplicate=${() => this._ws("duplicate_bar", { bar_id: bar.id })}
              ></ds-bar>
            `
          )}
        </div>

        <div class="add-wrap">
          <button class="add" @click=${() => (this._menuOpen = !this._menuOpen)}>
            <ha-icon icon="mdi:plus" style="--mdc-icon-size:18px"></ha-icon> Add schedule bar
          </button>
          ${this._menuOpen
            ? html`<div class="menu">
                ${Object.entries(this._types).map(
                  ([k, v]) => html`
                    <button @click=${() => this._addBar(k)}>
                      <ha-icon icon=${v.icon} style=${`color:${typeColor(k)}`}></ha-icon>
                      <span class="cap">${k}</span>
                      <span class="states"
                        >${v.kind === "stateless"
                          ? (v.actions ?? []).map((a) => a.label).join(" / ")
                          : (v.states ?? []).map((s) => s.label).join(" / ")}</span
                      >
                    </button>
                  `
                )}
              </div>`
            : nothing}
        </div>
      </div>

      <div class="footer">
        Striped/plain fill = default state (click to change) · tap a segment to edit state, times
        &amp; jitter · drag to move or resize · drag the ⠿ grip to reorder bars · per-bar toggle on
        the right
      </div>
    `);
  }

  private _card(inner: unknown) {
    return html`<ha-card>${inner}</ha-card>`;
  }

  getCardSize(): number {
    return 3 + (this._schedule?.bars.length ?? 1);
  }

  static override styles = [sharedStyles, cardStyles()];
}

function cardStyles() {
  return css`
    ha-card {
      overflow: visible;
    }
    .error,
    .loading {
      padding: 24px 20px;
      color: var(--ds-dim);
    }
    .error {
      color: var(--ds-warn);
    }
    .header {
      padding: 16px 18px;
      display: flex;
      align-items: center;
      gap: 14px;
      border-bottom: 1px solid var(--ds-line);
    }
    .title {
      font-size: 16px;
      font-weight: 700;
      color: var(--ds-text);
    }
    .subtitle {
      font-size: 12.5px;
      color: var(--ds-dim);
      margin-top: 2px;
    }
    .header-right {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .sync {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 7px 12px;
      border-radius: 9px;
      border: 1px solid var(--ds-line);
      background: transparent;
      color: var(--ds-text);
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
    }
    .sync.on {
      background: color-mix(in srgb, var(--ds-accent) 14%, transparent);
      color: var(--ds-accent);
    }
    .sync[disabled] {
      color: var(--ds-dim);
      cursor: not-allowed;
      opacity: 0.6;
    }
    .spin {
      animation: ds-spin 0.8s linear infinite;
    }
    @keyframes ds-spin {
      to {
        transform: rotate(360deg);
      }
    }
    .vdiv {
      width: 1px;
      height: 22px;
      background: var(--ds-line);
    }
    .enabled-label {
      font-size: 12.5px;
      font-weight: 600;
      color: var(--ds-dim);
    }
    .body {
      padding: 14px 18px 6px;
    }
    .ruler {
      position: relative;
      height: 16px;
      margin-bottom: 4px;
    }
    .tick {
      position: absolute;
      top: 0;
      font-size: 10.5px;
      color: var(--ds-dim);
      font-variant-numeric: tabular-nums;
    }
    .now-label {
      position: absolute;
      top: -1px;
      transform: translateX(-50%);
      font-size: 10px;
      font-weight: 700;
      color: var(--ds-now);
      font-variant-numeric: tabular-nums;
      background: var(--ds-panel);
      padding: 0 3px;
      border-radius: 3px;
    }
    .bars {
      position: relative;
    }
    .gridlines {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 0;
    }
    .gl {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 1px;
      background: var(--ds-line);
      opacity: 0.5;
    }
    .add-wrap {
      position: relative;
      padding: 6px 0 14px;
    }
    .add {
      width: 100%;
      padding: 11px;
      border-radius: 10px;
      cursor: pointer;
      background: transparent;
      border: 1.5px dashed var(--ds-line);
      color: var(--ds-dim);
      font-size: 13px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      font-family: inherit;
    }
    .menu {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 56px;
      background: var(--ds-panel-hi);
      border-radius: 12px;
      border: 1px solid var(--ds-line);
      padding: 6px;
      z-index: 30;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
    }
    .menu button {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 10px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      background: transparent;
      color: var(--ds-text);
      font-size: 13px;
      text-align: left;
      font-family: inherit;
    }
    .menu button:hover {
      background: var(--ds-panel);
    }
    .menu .cap {
      text-transform: capitalize;
    }
    .menu .states {
      margin-left: auto;
      font-size: 11px;
      color: var(--ds-dim);
    }
    .footer {
      padding: 6px 18px 16px;
      font-size: 11.5px;
      color: var(--ds-dim);
      line-height: 1.7;
      text-align: center;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "daily-schedule-card": DailyScheduleCard;
  }
  interface Window {
    customCards?: { type: string; name: string; description: string; preview?: boolean }[];
  }
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: "daily-schedule-card",
  name: "Daily Schedule",
  description: "Build a repeating 24-hour schedule that drives your entities.",
  preview: false,
});
