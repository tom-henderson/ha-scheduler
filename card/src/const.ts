export const HOURS = 24;
export const SNAP = 0.25; // 15 minutes
export const MIN_SEGMENT = SNAP;

export const DOMAIN = "daily_schedule";

/**
 * Solar events selectable as boundary anchors (issue #3). `attr` is the
 * `sun.sun` attribute holding the next occurrence, used to resolve an
 * approximate "today" time for the card's layout and the editor hint. `icon`
 * marks a solar edge on the timeline.
 */
export const SUN_EVENTS: {
  key: "sunrise" | "sunset" | "dawn" | "dusk";
  label: string;
  attr: string;
  icon: string;
}[] = [
  { key: "sunrise", label: "Sunrise", attr: "next_rising", icon: "mdi:weather-sunset-up" },
  { key: "sunset", label: "Sunset", attr: "next_setting", icon: "mdi:weather-sunset-down" },
  { key: "dawn", label: "Dawn", attr: "next_dawn", icon: "mdi:weather-sunny-alert" },
  { key: "dusk", label: "Dusk", attr: "next_dusk", icon: "mdi:weather-night" },
];

/** Max magnitude of a solar offset, in hours (matches the backend clamp). */
export const MAX_SOLAR_OFFSET = 2;

/** Semantic colour for solar markers/edges. */
export const SUN_COLOR = "#f5b301";

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

/** Per-HVAC-mode segment colours for climate bars (keyed by the mode value). */
export const HVAC_MODE_COLORS: Record<string, string> = {
  heat: "#ff6b5a",
  cool: "#4aa8ff",
  heat_cool: "#5ad19a",
  auto: "#5ad19a",
  dry: "#f5b301",
  fan_only: "#7e9cff",
};

export const DEFAULT_TYPE_COLOR = "var(--primary-color)";

export function typeColor(type: string): string {
  return TYPE_COLORS[type] ?? DEFAULT_TYPE_COLOR;
}
