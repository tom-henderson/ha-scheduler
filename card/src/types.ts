import type { HomeAssistant, LovelaceCardConfig } from "custom-card-helpers";

export interface Segment {
  id: string;
  start: number; // hours past midnight
  end: number;
  state: number; // index into the type's state list
  jitter: number; // hours; 0 = none
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
}

export interface TypeDef {
  label: string;
  icon: string;
  states: TypeState[];
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
