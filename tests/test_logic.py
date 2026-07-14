"""Tests for the pure scheduling logic: resolution, boundaries, jitter, conflicts."""

import random

import pytest

from custom_components.daily_schedule.logic import (
    cell_at,
    daily_changepoints,
    detect_conflicts,
    jittered_segments,
    jittered_trigger_at,
    resolve_from_plan,
)
from custom_components.daily_schedule.models import Bar, Schedule, Trigger


def _bar(**kw):
    base = {"name": "b", "type": "light", "base": 0, "segments": []}
    base.update(kw)
    return Bar.from_dict(base)


# -- state resolution / boundaries ------------------------------------------


def test_changepoints_start_at_midnight_and_merge_equal_states():
    bar = _bar(
        segments=[
            {"start": 6, "end": 9, "state": 1},
            {"start": 18, "end": 22, "state": 1},
        ]
    )
    plan = daily_changepoints(bar, jittered_segments(bar, random.Random(0)))
    assert plan[0].hour == 0.0
    assert plan[0].state == 0  # base at midnight
    hours = [p.hour for p in plan]
    assert hours == sorted(hours)
    # Transitions at 6->on, 9->off, 18->on, 22->off
    assert [(p.hour, p.state) for p in plan] == [
        (0.0, 0),
        (6.0, 1),
        (9.0, 0),
        (18.0, 1),
        (22.0, 0),
    ]


def test_changepoints_collapse_when_base_matches_segment():
    # base On, segment also On -> no visible transition, single change-point
    bar = _bar(type="blind", base=1, segments=[{"start": 6, "end": 9, "state": 1}])
    plan = daily_changepoints(bar, jittered_segments(bar, random.Random(0)))
    assert [(p.hour, p.state) for p in plan] == [(0.0, 1)]


def test_resolve_from_plan_matches_bar_resolve_without_jitter():
    bar = _bar(
        base=0,
        segments=[
            {"start": 6, "end": 9, "state": 1},
            {"start": 18, "end": 22, "state": 1},
        ],
    )
    plan = daily_changepoints(bar, jittered_segments(bar, random.Random(0)))
    for t in [0, 5.99, 6, 8.9, 9, 12, 18, 21.9, 22, 23.75]:
        assert resolve_from_plan(plan, t) == bar.resolve(t), t


def test_resolve_from_plan_before_first_point_is_none():
    # Plan always starts at 0, so any hour >= 0 resolves; guard the empty case.
    assert resolve_from_plan([], 5) is None


# -- per-segment data (climate etc.) ----------------------------------------


def test_changepoints_carry_segment_data():
    bar = _bar(
        type="climate",
        segments=[{"start": 6, "end": 9, "state": 1, "data": {"temperature": 21}}],
    )
    plan = daily_changepoints(bar, jittered_segments(bar, random.Random(0)))
    assert [(p.hour, p.state, p.data) for p in plan] == [
        (0.0, 0, {}),
        (6.0, 1, {"temperature": 21}),
        (9.0, 0, {}),
    ]


def test_adjacent_same_state_different_data_still_transitions():
    # Two touching Heat segments at different temperatures must not be merged —
    # the engine has to re-fire set_temperature at the boundary.
    bar = _bar(
        type="climate",
        segments=[
            {"start": 6, "end": 9, "state": 1, "data": {"temperature": 20}},
            {"start": 9, "end": 12, "state": 1, "data": {"temperature": 22}},
        ],
    )
    plan = daily_changepoints(bar, jittered_segments(bar, random.Random(0)))
    assert [(p.hour, p.data.get("temperature")) for p in plan] == [
        (0.0, None),
        (6.0, 20),
        (9.0, 22),
        (12.0, None),
    ]


def test_cell_at_returns_state_and_data():
    bar = _bar(
        type="climate",
        segments=[{"start": 6, "end": 9, "state": 1, "data": {"temperature": 21}}],
    )
    plan = daily_changepoints(bar, jittered_segments(bar, random.Random(0)))
    assert cell_at(plan, 7).data == {"temperature": 21}
    assert cell_at(plan, 0).state == 0
    assert cell_at([], 5) is None


# -- jitter ------------------------------------------------------------------


def test_jitter_zero_is_identity():
    bar = _bar(segments=[{"start": 6, "end": 9, "state": 1, "jitter": 0}])
    js = jittered_segments(bar, random.Random(123))
    assert js == [(6.0, 9.0, 1, {})]


@pytest.mark.parametrize("seed", range(50))
def test_jitter_never_reorders_or_overlaps_touching_segments(seed):
    # Two segments touching at 6.0, both with large jitter pulling toward each other.
    bar = _bar(
        segments=[
            {"start": 3, "end": 6, "state": 1, "jitter": 0.5},
            {"start": 6, "end": 9, "state": 1, "jitter": 0.5},
        ]
    )
    js = jittered_segments(bar, random.Random(seed))
    (a_start, a_end, *_), (b_start, b_end, *_) = js
    # No overlap and correct order.
    assert a_start < a_end <= b_start < b_end
    # Neither boundary crosses the original shared boundary at 6.0.
    assert a_end <= 6.0
    assert b_start >= 6.0


@pytest.mark.parametrize("seed", range(50))
def test_jitter_stays_within_bounds_and_min_width(seed):
    bar = _bar(segments=[{"start": 8, "end": 8.5, "state": 1, "jitter": 0.5}])
    (start, end, *_) = jittered_segments(bar, random.Random(seed))[0]
    assert 0 <= start < end <= 24
    assert end - start >= 0.25  # min 15-min width preserved


def test_jitter_bounded_by_amount():
    bar = _bar(segments=[{"start": 10, "end": 14, "state": 1, "jitter": 10 / 60}])
    for seed in range(200):
        (start, end, *_) = jittered_segments(bar, random.Random(seed))[0]
        assert abs(start - 10) <= 10 / 60 + 1e-9
        assert abs(end - 14) <= 10 / 60 + 1e-9


# -- conflict detection ------------------------------------------------------


def _sched(*bars, enabled=True):
    return Schedule.from_dict({"enabled": enabled, "bars": list(bars)})


def test_conflict_when_shared_target_and_active_overlap():
    sched = _sched(
        {
            "id": "a",
            "name": "A",
            "type": "light",
            "targets": ["light.porch"],
            "segments": [{"start": 18, "end": 23, "state": 1}],
        },
        {
            "id": "b",
            "name": "B",
            "type": "light",
            "targets": ["light.porch"],
            "segments": [{"start": 20, "end": 22, "state": 1}],
        },
    )
    conflicts = detect_conflicts(sched)
    assert conflicts["a"] == ["B"]
    assert conflicts["b"] == ["A"]


def test_no_conflict_without_shared_target():
    sched = _sched(
        {"id": "a", "name": "A", "type": "light", "targets": ["light.x"],
         "segments": [{"start": 18, "end": 23, "state": 1}]},
        {"id": "b", "name": "B", "type": "light", "targets": ["light.y"],
         "segments": [{"start": 20, "end": 22, "state": 1}]},
    )
    assert detect_conflicts(sched) == {"a": [], "b": []}


def test_no_conflict_when_active_spans_dont_overlap():
    sched = _sched(
        {"id": "a", "name": "A", "type": "light", "targets": ["light.x"],
         "segments": [{"start": 6, "end": 9, "state": 1}]},
        {"id": "b", "name": "B", "type": "light", "targets": ["light.x"],
         "segments": [{"start": 18, "end": 22, "state": 1}]},
    )
    assert detect_conflicts(sched) == {"a": [], "b": []}


def test_off_state_overlap_is_not_a_conflict():
    # Overlap where one segment is the off state -> not active -> no conflict.
    sched = _sched(
        {"id": "a", "name": "A", "type": "light", "targets": ["light.x"],
         "segments": [{"start": 6, "end": 12, "state": 1}]},
        {"id": "b", "name": "B", "type": "light", "targets": ["light.x"],
         "segments": [{"start": 6, "end": 12, "state": 0}]},
    )
    assert detect_conflicts(sched) == {"a": [], "b": []}


def test_disabled_bar_excluded_from_conflicts():
    sched = _sched(
        {"id": "a", "name": "A", "type": "light", "targets": ["light.x"],
         "enabled": True, "segments": [{"start": 6, "end": 12, "state": 1}]},
        {"id": "b", "name": "B", "type": "light", "targets": ["light.x"],
         "enabled": False, "segments": [{"start": 6, "end": 12, "state": 1}]},
    )
    assert detect_conflicts(sched) == {"a": [], "b": []}


def test_no_conflict_when_day_masks_dont_intersect():
    # Same entity, overlapping times, but one bar is weekdays and the other is
    # weekend — they can never be active on the same day, so no conflict.
    sched = _sched(
        {"id": "a", "name": "Weekday", "type": "light", "targets": ["light.x"],
         "days": [0, 1, 2, 3, 4], "segments": [{"start": 18, "end": 23, "state": 1}]},
        {"id": "b", "name": "Weekend", "type": "light", "targets": ["light.x"],
         "days": [5, 6], "segments": [{"start": 18, "end": 23, "state": 1}]},
    )
    assert detect_conflicts(sched) == {"a": [], "b": []}


def test_conflict_when_day_masks_partially_intersect():
    # Overlap on Friday (day 4) is enough to conflict.
    sched = _sched(
        {"id": "a", "name": "A", "type": "light", "targets": ["light.x"],
         "days": [0, 1, 2, 3, 4], "segments": [{"start": 18, "end": 23, "state": 1}]},
        {"id": "b", "name": "B", "type": "light", "targets": ["light.x"],
         "days": [4, 5, 6], "segments": [{"start": 20, "end": 22, "state": 1}]},
    )
    conflicts = detect_conflicts(sched)
    assert conflicts["a"] == ["B"]
    assert conflicts["b"] == ["A"]


def test_stateless_bars_are_excluded_from_conflicts():
    # Two trigger bars sharing a target at the same moment are not a conflict —
    # stateless bars hold no state.
    sched = _sched(
        {"id": "a", "name": "A", "type": "trigger", "targets": ["scene.x"],
         "triggers": [{"at": 8, "action": {"service": "scene.turn_on",
                                           "entity_id": "scene.x"}}]},
        {"id": "b", "name": "B", "type": "trigger", "targets": ["scene.x"],
         "triggers": [{"at": 8, "action": {"service": "scene.turn_on",
                                           "entity_id": "scene.x"}}]},
    )
    assert detect_conflicts(sched) == {"a": [], "b": []}


# -- trigger jitter ----------------------------------------------------------


def test_jittered_trigger_at_zero_is_identity():
    assert jittered_trigger_at(Trigger(at=7.0, jitter=0), random.Random(0)) == 7.0


@pytest.mark.parametrize("seed", range(50))
def test_jittered_trigger_at_stays_in_day(seed):
    # A trigger near midnight with large jitter must stay within [0, 24).
    v = jittered_trigger_at(Trigger(at=0.1, jitter=1.0), random.Random(seed))
    assert 0 <= v <= 24 - 0.25


def test_jittered_trigger_at_bounded_by_amount():
    for seed in range(200):
        v = jittered_trigger_at(Trigger(at=12.0, jitter=10 / 60), random.Random(seed))
        assert abs(v - 12.0) <= 10 / 60 + 1e-9


def test_disabled_schedule_has_no_conflicts():
    sched = _sched(
        {"id": "a", "name": "A", "type": "light", "targets": ["light.x"],
         "segments": [{"start": 6, "end": 12, "state": 1}]},
        {"id": "b", "name": "B", "type": "light", "targets": ["light.x"],
         "segments": [{"start": 6, "end": 12, "state": 1}]},
        enabled=False,
    )
    assert detect_conflicts(sched) == {"a": [], "b": []}
