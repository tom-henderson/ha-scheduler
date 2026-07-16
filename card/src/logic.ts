import {
  HOURS,
  HVAC_MODE_COLORS,
  JITTERS,
  MIN_SEGMENT,
  SNAP,
  SUN_EVENTS,
  typeColor,
} from "./const";
import type {
  Bar,
  HomeAssistant,
  Segment,
  SunExpr,
  Trigger,
  TypeParam,
  TypeRegistry,
} from "./types";

/** Format hours (0-24) as HH:MM. */
export function fmt(h: number): string {
  const t = Math.round(h * 60);
  const hh = String(Math.floor(t / 60) % 24).padStart(2, "0");
  const mm = String(t % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

/** Parse HH:MM -> hours, or null if invalid. */
export function parse(str: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(str.trim());
  if (!m) return null;
  const h = +m[1];
  const mm = +m[2];
  if (h > 24 || mm > 59) return null;
  return Math.min(24, h + mm / 60);
}

/** Snap hours to the 15-minute grid, clamped to [0, 24]. */
export function snap(value: number): number {
  const v = Math.round(value / SNAP) * SNAP;
  return Math.max(0, Math.min(HOURS, Math.round(v * 1e4) / 1e4));
}

/** A state is "active" when it is not the off/rest state (index 0). */
export function isActive(types: TypeRegistry, type: string, stateIndex: number): boolean {
  const states = types[type]?.states;
  if (!states) return stateIndex !== 0;
  const key = states[stateIndex]?.key;
  return key !== undefined && key !== "off";
}

export function stateLabel(types: TypeRegistry, type: string, stateIndex: number): string {
  return types[type]?.states?.[stateIndex]?.label ?? String(stateIndex);
}

/** Accent for a state: its own `color` if set (e.g. climate modes), else the type's. */
export function stateColor(types: TypeRegistry, type: string, stateIndex: number): string {
  return types[type]?.states?.[stateIndex]?.color ?? typeColor(type);
}

/** Prettify a mode value for display, e.g. "heat_cool" -> "Auto". */
const MODE_LABELS: Record<string, string> = {
  heat_cool: "Auto",
  fan_only: "Fan only",
};
export function prettyMode(v: string): string {
  return (
    MODE_LABELS[v] ??
    v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

/**
 * Options for a select param. Static `options` win; otherwise they are read
 * from the target entities' `options_attribute` (e.g. `hvac_modes`), using the
 * intersection across all targets so a multi-target bar only offers modes every
 * device supports. `exclude` drops values (e.g. "off").
 */
export function paramOptions(
  hass: HomeAssistant | undefined,
  entities: string[],
  param: TypeParam
): { value: string; label: string }[] {
  if (param.options) return param.options;
  const attr = param.options_attribute;
  if (!attr || !hass) return [];
  const lists = entities
    .map((e) => hass.states?.[e]?.attributes?.[attr])
    .filter((l): l is string[] => Array.isArray(l));
  if (!lists.length) return [];
  let common = lists[0];
  for (const l of lists.slice(1)) common = common.filter((v) => l.includes(v));
  const excl = new Set(param.exclude ?? []);
  return common
    .filter((v) => !excl.has(v))
    .map((v) => ({ value: v, label: prettyMode(v) }));
}

/**
 * Segment accent: for a mode-bearing type (climate) colour by the chosen
 * `hvac_mode`, else fall back to the state colour.
 */
export function segmentColor(types: TypeRegistry, type: string, seg: Segment): string {
  const mode = seg.data?.hvac_mode;
  if (typeof mode === "string" && HVAC_MODE_COLORS[mode]) return HVAC_MODE_COLORS[mode];
  return stateColor(types, type, seg.state);
}

/** The param schema for a type, or an empty list. */
export function paramSchema(types: TypeRegistry, type: string): TypeParam[] {
  return types[type]?.param_schema ?? [];
}

/** The segment-data keys a param owns (media writes several; others just one). */
export function paramKeys(p: TypeParam): string[] {
  return p.keys ?? [p.key];
}

/**
 * Effective value of a param for a segment: the segment's own `data`, else the
 * selected state's registry default, else the schema default.
 */
export function paramValue(
  types: TypeRegistry,
  type: string,
  stateIndex: number,
  seg: Pick<Segment, "data">,
  param: TypeParam
): unknown {
  const fromSeg = seg.data?.[param.key];
  if (fromSeg !== undefined) return fromSeg;
  const fromState = types[type]?.states?.[stateIndex]?.data?.[param.key];
  if (fromState !== undefined) return fromState;
  return param.default;
}

/** A compact summary of a segment's params for the timeline label, e.g. "21°". */
export function paramSummary(
  types: TypeRegistry,
  type: string,
  seg: Segment
): string {
  return paramSchema(types, type)
    .map((p) => {
      if (p.kind === "media") {
        const title = seg.data?.media_title ?? seg.data?.media_content_id;
        return title ? String(title) : "";
      }
      const v = paramValue(types, type, seg.state, seg, p);
      if (v === undefined || v === null || v === "") return "";
      if (p.kind === "slider") return `${Math.round(Number(v) * 100)}%`;
      if (p.kind === "number") return `${v}${p.unit ?? ""}`;
      if (p.kind === "select") return prettyMode(String(v));
      return String(v);
    })
    .filter(Boolean)
    .join(" · ");
}

export function jitterLabel(v: number): string {
  return (JITTERS.find((j) => Math.abs(j.v - v) < 0.001) ?? JITTERS[0]).label;
}

// -- sun-relative boundaries (issue #3) -------------------------------------

export function sunEventDef(event: string) {
  return SUN_EVENTS.find((e) => e.key === event);
}

/** Format a solar offset in hours as "±0" / "−30m" / "+1h 15m". */
export function offsetLabel(offset: number): string {
  const mins = Math.round(offset * 60);
  if (mins === 0) return "±0";
  const a = Math.abs(mins);
  const h = Math.floor(a / 60);
  const m = a % 60;
  const hm = h ? `${h}h${m ? ` ${m}m` : ""}` : `${m}m`;
  return `${mins < 0 ? "−" : "+"}${hm}`;
}

/** Today's hour-of-day for a solar event, from the `sun.sun` entity, or null. */
export function sunEventHour(hass: HomeAssistant | undefined, event: string): number | null {
  const def = sunEventDef(event);
  const iso = def && hass?.states?.["sun.sun"]?.attributes?.[def.attr];
  if (typeof iso !== "string") return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
}

/**
 * Resolve a boundary to an absolute hour: the solar event (+offset) if `expr`
 * is set and resolvable, otherwise the stored clock `nominal`.
 */
export function resolveBoundaryHour(
  hass: HomeAssistant | undefined,
  nominal: number,
  expr: SunExpr | null | undefined
): number {
  if (!expr) return nominal;
  const base = sunEventHour(hass, expr.event);
  if (base == null) return nominal;
  return Math.max(0, Math.min(HOURS, base + expr.offset));
}

/** Human label for a boundary: "07:00" (clock) or "Sunset −30m" (solar). */
export function boundaryLabel(seg: Segment, which: "start" | "end"): string {
  const expr = which === "start" ? seg.start_expr : seg.end_expr;
  if (!expr) return fmt(which === "start" ? seg.start : seg.end);
  const def = sunEventDef(expr.event);
  return `${def?.label ?? expr.event}${expr.offset ? ` ${offsetLabel(expr.offset)}` : ""}`;
}

export function sortedSegments(bar: Bar): Segment[] {
  return [...bar.segments].sort((a, b) => a.start - b.start);
}

/** True for trigger-point bar types (no base/state ranges). */
export function isStateless(types: TypeRegistry, type: string): boolean {
  return types[type]?.kind === "stateless";
}

export function sortedTriggers(bar: Bar): Trigger[] {
  return [...(bar.triggers ?? [])].sort((a, b) => a.at - b.at);
}

/** A sensible time for a new trigger: the middle of the day's largest gap. */
export function nextTriggerTime(bar: Bar): number {
  const pts = [0, ...sortedTriggers(bar).map((t) => t.at), HOURS];
  let best = 0;
  let mid = HOURS / 2;
  for (let i = 0; i < pts.length - 1; i++) {
    const gap = pts[i + 1] - pts[i];
    if (gap > best) {
      best = gap;
      mid = (pts[i] + pts[i + 1]) / 2;
    }
  }
  return snap(mid);
}

/**
 * The free range a segment may occupy, bounded by its neighbours. Used by both
 * drag clamping and the segment editor's time-field validation. (Ported from
 * the mockup's boundsFor.)
 */
export function boundsFor(bar: Bar, seg: Segment): { min: number; max: number } {
  const others = bar.segments.filter((s) => s.id !== seg.id);
  const min = others
    .filter((s) => s.end <= seg.start)
    .reduce((m, s) => Math.max(m, s.end), 0);
  const max = others
    .filter((s) => s.start >= seg.end)
    .reduce((m, s) => Math.min(m, s.start), HOURS);
  return { min, max };
}

/** Effective state index at a time: covering segment else base. */
export function resolveState(bar: Bar, hour: number): number {
  for (const s of sortedSegments(bar)) {
    if (hour >= s.start && hour < s.end) return s.state;
  }
  return bar.base;
}

export function coveringSegment(bar: Bar, hour: number): Segment | undefined {
  return sortedSegments(bar).find((s) => hour >= s.start && hour < s.end);
}

/**
 * Find the largest free gap in the day and return a start/end for a new
 * segment placed in it, or null if there's no room. (Ported from the mockup.)
 */
export function largestGap(bar: Bar): { start: number; end: number } | null {
  const occ = bar.segments
    .map((s) => [s.start, s.end] as [number, number])
    .sort((a, b) => a[0] - b[0]);
  let best: [number, number] | null = null;
  let cursor = 0;
  const span = (p: [number, number] | null) => (p ? p[1] - p[0] : 0);
  for (const [s, e] of occ) {
    if (s - cursor > span(best)) best = [cursor, s];
    cursor = Math.max(cursor, e);
  }
  if (HOURS - cursor > span(best)) best = [cursor, HOURS];
  if (!best || span(best) < 2 * MIN_SEGMENT) return null;
  const start = best[0];
  const end = Math.min(best[1], start + Math.max(1, span(best) / 2));
  return { start, end };
}
