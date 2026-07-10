export const HOURS = 24;
export const SNAP = 0.25; // 15 minutes
export const MIN_SEGMENT = SNAP;

export const DOMAIN = "daily_schedule";

/** Jitter presets, in hours, matching the mockup. */
export const JITTERS: { v: number; label: string }[] = [
  { v: 0, label: "None" },
  { v: 5 / 60, label: "±5m" },
  { v: 10 / 60, label: "±10m" },
  { v: 15 / 60, label: "±15m" },
  { v: 30 / 60, label: "±30m" },
];

/**
 * Semantic accent colour per device type. Chrome (backgrounds, text, borders)
 * is themed via HA CSS variables; these hues carry the device-type identity
 * from the mockup and can be overridden by a theme if desired.
 */
export const TYPE_COLORS: Record<string, string> = {
  light: "#f5b301",
  blind: "#7e9cff",
  water: "#2bc4d4",
  fan: "#5ad19a",
  switch: "#a78bfa",
  climate: "#ff7a66",
  media: "#e879c9",
  trigger: "#cfe84a",
};

/** Entity domains offered in the target picker for each device type. */
export const TYPE_DOMAINS: Record<string, string[]> = {
  light: ["light"],
  blind: ["cover"],
  water: ["switch", "valve"],
  fan: ["fan"],
  switch: ["switch", "input_boolean"],
  climate: ["climate"],
  media: ["media_player"],
};

export const DEFAULT_TYPE_COLOR = "var(--primary-color)";

export function typeColor(type: string): string {
  return TYPE_COLORS[type] ?? DEFAULT_TYPE_COLOR;
}
