import { HOURS, JITTERS, SNAP, MIN_SEGMENT } from "./const";
import type { Bar, Segment, TypeRegistry } from "./types";

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
  return types[type]?.states[stateIndex]?.label ?? String(stateIndex);
}

export function jitterLabel(v: number): string {
  return (JITTERS.find((j) => Math.abs(j.v - v) < 0.001) ?? JITTERS[0]).label;
}

export function sortedSegments(bar: Bar): Segment[] {
  return [...bar.segments].sort((a, b) => a.start - b.start);
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
