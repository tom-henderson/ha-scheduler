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

export interface Bar {
  id: string;
  name: string;
  type: string;
  targets: string[];
  base: number;
  enabled: boolean;
  segments: Segment[];
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
  /** Data keys this param owns; defaults to [key]. Media writes several. */
  keys?: string[];
}

export interface TypeDef {
  label: string;
  icon: string;
  states: TypeState[];
  /** Params editable per segment for this type's active states. */
  param_schema?: TypeParam[];
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
