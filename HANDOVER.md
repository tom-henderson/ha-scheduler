# Daily Schedule — Home Assistant Custom Component
## Engineering Handover Spec

**Status:** Design agreed via interactive mockup. Ready for implementation.
**Companion file:** `schedule-mockup.jsx` — an interactive React prototype of the UI. It is the source of truth for layout, interaction, and visual behaviour. This document is the source of truth for functional requirements and the parts the mockup does not cover (HA integration, persistence, scheduling engine).

---

## 1. Purpose

A Home Assistant custom component + custom Lovelace card for building a **repeating 24-hour schedule** that drives one or more entities. Typical uses: holiday light timers, garden watering, blind automation. The user divides a day (midnight → midnight) into segments per device and the component sets entity states as time crosses segment boundaries.

Design goals:
- Fast to set up — visual, drag-driven, no YAML required for the common case.
- Flexible across device types / integrations (lights, covers, switches, fans, valves…).
- Uses standard HA controls and conventions where sensible.

---

## 2. Core concepts & data model

The config is a single **schedule** containing an ordered list of **bars**. Each bar targets one or more entities and defines that day's state timeline via a **base state** plus zero or more **segments** (overrides).

```
Schedule
├─ enabled: bool                      # master on/off for the whole schedule
└─ bars: Bar[]

Bar
├─ id: string
├─ name: string
├─ enabled: bool                      # per-bar on/off, independent of schedule.enabled
├─ type: string                       # entity domain family — drives available states (see §3)
├─ targets: string[]                  # one or more entity_ids (or area/room refs, see §9)
├─ base: int                          # index into the type's state list; fills all uncovered time
└─ segments: Segment[]

Segment
├─ id: string
├─ start: float                       # hours past midnight, 0–24, 15-min (0.25) granularity
├─ end: float                         # hours past midnight, > start
├─ state: int                         # index into the type's state list
└─ jitter: float                      # ± variation in hours applied to boundaries (0 = none)
```

### Key modelling decisions (agreed)

1. **The whole day is always explicitly defined.** There is no "do nothing" time. Any time not covered by a segment resolves to the bar's `base` state. `base` defaults to the entity's natural "off"/rest state (state index 0). Segments are overrides painted on top of the base.
2. **State resolution at time `t`:** the covering segment's state if one exists at `t`, otherwise `base`. Segments within a bar never overlap (enforced in the UI — see §5).
3. **State list is per device type.** Index 0 is always the "off"/rest state. See §3.
4. **Times snap to 15 minutes (0.25h).** Applies to drag and is the expected granularity for typed input too.

---

## 3. Device types & states

Each bar has a `type` that determines the ordered list of selectable states. Index 0 is treated as the "off"/rest state (used as the default `base`, and excluded from conflict/active checks). This list is the starting set — the architecture must allow adding more types and mapping them to HA service calls.

| type    | states (index → label)                          | maps to (indicative)                          |
|---------|--------------------------------------------------|-----------------------------------------------|
| `light` | 0 Off, 1 On                                      | `light.turn_off` / `light.turn_on`            |
| `blind` | 0 Closed, 1 Open                                 | `cover.close_cover` / `cover.open_cover`      |
| `water` | 0 Off, 1 Watering                                | `switch.turn_off` / `switch.turn_on` (or `valve.*`) |
| `fan`   | 0 Off, 1 Low, 2 Med, 3 High                      | `fan.turn_off` / `fan.set_percentage`         |

A state ("on", "high", "watering") is considered **active** when its index ≠ 0. Only active states participate in conflict detection.

> **Extensibility requirement:** the mapping from (type, state index) → HA service call must be data-driven / registry-based, not hard-coded per bar, so new device families can be added without touching the UI. Consider deriving the state list from the target entity's domain and supported features where possible (e.g. a dimmable light could expose brightness levels). Level/percentage states were explicitly **deferred** for v1 — see §10.

---

## 4. Scheduling engine (component side — not in mockup)

This is the runtime behaviour the mockup only hints at.

1. **Boundary-driven execution.** The component fires the appropriate HA service call **when the clock crosses a segment/base boundary** — i.e. on transition, not continuously. On crossing into a region, set the target entities to that region's resolved state.
2. **Sync on startup.** If `schedule.enabled` (and the bar is enabled), the component performs a **state sync** at HA startup: read the current time, resolve each bar's effective state for "now", and push it to the entities. This also applies after config changes. **No UI is required for this** — it is automatic. (Rationale: a pure boundary model misses transitions that occur while HA is down; sync corrects drift.)
3. **Manual "Sync now".** A button in the card header triggers the same state-sync on demand (see §5). Disabled when the schedule is disabled.
4. **Enabled gating.**
   - `schedule.enabled == false` → the component does nothing (no boundary actions, no startup sync, sync button disabled).
   - A bar with `enabled == false` is skipped entirely (no actions, excluded from sync and conflict detection) while other bars continue.
5. **Jitter.** For each segment with `jitter > 0`, boundaries are randomised by up to ±jitter. **Open decision (§10):** re-roll once per daily rebuild (predictable for the day) vs. per boundary. Recommend **once per day at rebuild**. Jitter must never reorder or overlap adjacent segments — clamp so a jittered boundary stays within its neighbours.
6. **Conflicts are passive.** If two enabled bars share a target entity and their active segments overlap in time, surface a warning only (see §5). The component does **not** resolve conflicts (no priority system in v1) — last write effectively wins at runtime. This is acceptable for v1 by explicit decision.

---

## 5. UI specification (see `schedule-mockup.jsx`)

Single card. Dark theme in the mockup; final card should inherit HA theme variables (see §8).

### Header
- Title ("Daily Schedule") + subtitle (repeat cadence, bar count).
- **Sync now** button — triggers manual state sync (§4.3); shows spinner + "Syncing…" while running; disabled when schedule disabled.
- **Master enable toggle** with "Enabled/Disabled" label.

### Timeline area
- A shared **time ruler** across the top: labels at 00:00 / 06:00 / 12:00 / 18:00 / 24:00.
- Faint vertical **gridlines** at 06:00 / 12:00 / 18:00 behind all bars.
- A live **"now" marker**: a coloured vertical line at the current time, with an `HH:MM` label on the ruler. Updates over time.
- **Bars stack vertically**, all sharing the same midnight→midnight horizontal scale, giving a day-at-a-glance overview.

### Per bar
- **Header row:** device-type icon, name, targets line ("Front Porch · Living Room lamp"), and right-aligned controls: **+ (add segment)**, **duplicate**, **remove**, a divider, then a compact **per-bar enable toggle**.
- A **conflict chip** (⚠ "Conflict") appears next to the name when this bar conflicts with another; tooltip names the other bar(s).
- A disabled bar (or disabled schedule) renders **dimmed**.
- **The track:**
  - **Base layer** fills the entire width = the default state. Rendered plain when the default is the off state, or with a diagonal **stripe pattern + "default: X" label** when the default is an active state. **Clicking the base layer** opens a small popover to change the default state.
  - **Segments** are override blocks on top of the base, positioned by start/end, labelled with their state; a small dice icon indicates jitter is set.

### Interactions (agreed)
- **Tap a segment** → popover with: state selector (buttons for the type's states), editable **Start** / **End** time fields (HH:MM, validated, constrained to the gap between neighbours), and a **jitter** selector (None / ±5m / ±10m / ±15m / ±30m). Save / Delete / Close.
- **Tap the base/empty area** → popover to set the default state.
- **`+` on the bar** → inserts a new segment into the **largest free gap** and immediately opens its editor.
- **Drag a segment body** → moves it (clamped so it can't overlap neighbours).
- **Drag a segment edge** → resizes that boundary (clamped; min 15-min width).
- **While dragging**, show a **live time bubble**: the boundary being dragged shows its time; dragging the whole segment shows **both** start and end. Values follow the 15-min snap and clear on release.
- All time math snaps to 15 minutes.
- **Add bar** → dashed "Add schedule bar" button opens a device-type picker; creates a bar with a sensible default segment.

### "Sync now" visual feedback
- Spinner on the button; the now-marker pulses; on each **live** bar (schedule on AND bar on), the currently-effective region is briefly outlined — a segment if one covers "now", otherwise the whole base layer.

---

## 6. Deliverables

1. **Custom integration** (`custom_components/daily_schedule/` or chosen name):
   - Config storage & CRUD for the schedule/bars/segments model (§2). Config-entry based; editable via the card (needs websocket/API commands) — YAML import optional.
   - The scheduling engine (§4): boundary execution, startup sync, manual sync service, jitter, enable gating.
   - A `switch`/`number`-style entity or service exposing `enabled` and a `sync_now` **service** so the button and automations can call it.
   - Conflict computation exposed to the frontend (or computed frontend-side; see §7).
2. **Custom Lovelace card** implementing §5, themed via HA CSS variables.
3. **Tests** for state resolution, boundary crossing, jitter clamping, enable gating, and conflict detection.
4. **Docs:** README with install (HACS-compatible layout preferred), configuration, and screenshots.

---

## 7. Porting the mockup → production

The mockup is plain React with inline styles and `lucide-react` icons. For the HA card:
- HA frontend cards are typically **Lit/LitElement + TypeScript**. Port the component structure and interaction logic; reimplement styling with HA theme variables.
- **Logic worth lifting directly** from `schedule-mockup.jsx`:
  - State resolution (covering segment else base).
  - `boundsFor(segment)` — neighbour-clamping used by drag and by the time-field validation.
  - Drag handlers (`move` / `l` / `r`) with 15-min snapping and the live time-bubble.
  - Largest-gap search for `+ add segment`.
  - Conflict detection: bars sharing a target whose active segments overlap in time (both bars must be enabled).
- **Not in the mockup, build fresh:** all persistence, websocket/API wiring, the scheduling engine, startup sync, service registration, entity/area pickers.

---

## 8. HA conventions to honour
- Use standard HA entity/area pickers for `targets` (mockup stubs these as static text).
- Theme with HA CSS custom properties (`--primary-color`, `--card-background-color`, `--primary-text-color`, `--secondary-text-color`, `--divider-color`, etc.) rather than the mockup's hard-coded palette.
- Follow HA custom-card registration (`customElements.define`, `getConfigElement`, `getStubConfig`) and integration best practices (config entries, `async_setup_entry`, unique IDs).
- Prefer HACS-installable repo structure.

---

## 9. Open questions to confirm with product owner
These were explicitly **deferred**, not rejected — revisit for v1.1+:
1. **Level / percentage states** (dimmable lights, partial covers, fan %): deferred for v1. Model already leaves room (state index → could become richer). Confirm when to add.
2. **Sun-relative boundaries** ("sunset − 30m"): deferred. Would require boundaries to be expressions, not just clock times.
3. **Conflict resolution / priority:** v1 is passive-warning only. Confirm whether a priority order ("higher bar wins") is wanted later.
4. **Jitter re-roll timing:** once per daily rebuild (recommended) vs. per boundary — confirm.
5. **Targets granularity:** entity_ids only, or also areas/rooms/labels? Affects picker + conflict detection.
6. **Gaps between adjacent segments' jitter:** decide whether jitter may cause two segments to touch/cross, and how to clamp.

## 10. Explicitly out of scope for v1
- Level/percentage per-segment values.
- Sun-relative or expression-based boundaries.
- Priority-based conflict resolution.
- Multiple distinct day-types (e.g. weekday vs weekend) — v1 is a single repeating 24h schedule.
- Inline editing of bar name/targets was not built in the mockup; implement with standard HA pickers in production.
