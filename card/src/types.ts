import type { HomeAssistant, LovelaceCardConfig } from "custom-card-helpers";

export interface Segment {
  id: string;
  start: number; // hours past midnight
  end: number;
  state: number; // index into the type's state list
  jitter: number; // hours; 0 = none
  /** Per-segment service params for richer types (e.g. climate temperature). */
  data?: Record<string, unknown>;
}

export interface TriggerAction {
  service?: string;
  entity_id?: string;
}

/** A moment on a stateless bar that fires an action (scene/script/automation). */
export interface Trigger {
  id: string;
  at: number; // hours past midnight
  action: TriggerAction;
  jitter: number;
}

export interface Bar {
  id: string;
  name: string;
  type: string;
  targets: string[];
  base: number;
  enabled: boolean;
  segments: Segment[];
  /** Trigger points, for stateless bar types. */
  triggers?: Trigger[];
}

export interface Schedule {
  enabled: boolean;
  bars: Bar[];
  /** bar id -> names of bars it conflicts with (computed server-side). */
  conflicts: Record<string, string[]>;
}

export interface TypeState {
  key: string;
  label: string;
  service: string;
  data?: Record<string, unknown>;
  /** Optional per-state accent (e.g. climate mode colours). */
  color?: string;
}

/** A user-editable parameter for a segment's active state (see `param_schema`). */
export interface TypeParam {
  key: string;
  label: string;
  kind: "number" | "slider" | "select" | "media";
  // number / slider
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  default?: number | string;
  // select
  options?: { value: string; label: string }[];
  /** Read select options from this attribute of the target entity (e.g.
   * "hvac_modes" / "fan_modes") instead of a fixed `options` list. */
  options_attribute?: string;
  /** Option values to drop (e.g. climate's "off", which is the Off state). */
  exclude?: string[];
  /** An optional param may be left unset; the editor hides it when the target
   * exposes no options for it. */
  optional?: boolean;
  /** Data keys this param owns; defaults to [key]. Media writes several. */
  keys?: string[];
}

/** A selectable action for a stateless (trigger) type. */
export interface TypeAction {
  key: string;
  label: string;
  domain: string;
  service: string;
}

export interface TypeDef {
  label: string;
  icon: string;
  states?: TypeState[];
  /** Params editable per segment for this type's active states. */
  param_schema?: TypeParam[];
  /** "stateless" for trigger-point bars; absent/"range" for state bars. */
  kind?: string;
  /** Semantic accent for the type (may override the card's palette). */
  color?: string;
  /** Selectable actions for a stateless type. */
  actions?: TypeAction[];
}

export type TypeRegistry = Record<string, TypeDef>;

export interface DailyScheduleCardConfig extends LovelaceCardConfig {
  entry_id?: string;
  title?: string;
}

export interface EntryInfo {
  entry_id: string;
  title: string;
}

export type { HomeAssistant };
