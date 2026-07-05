"""Tests for the pure scheduling logic: resolution, boundaries, jitter, conflicts."""

import random

import pytest

from custom_components.daily_schedule.logic import (
    daily_changepoints,
    detect_conflicts,
    jittered_segments,
    resolve_from_plan,
)
from custom_components.daily_schedule.models import Bar, Schedule


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


# -- jitter ------------------------------------------------------------------


def test_jitter_zero_is_identity():
    bar = _bar(segments=[{"start": 6, "end": 9, "state": 1, "jitter": 0}])
    js = jittered_segments(bar, random.Random(123))
    assert js == [(6.0, 9.0, 1)]


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
    (a_start, a_end, _), (b_start, b_end, _) = js
    # No overlap and correct order.
    assert a_start < a_end <= b_start < b_end
    # Neither boundary crosses the original shared boundary at 6.0.
    assert a_end <= 6.0
    assert b_start >= 6.0


@pytest.mark.parametrize("seed", range(50))
def test_jitter_stays_within_bounds_and_min_width(seed):
    bar = _bar(segments=[{"start": 8, "end": 8.5, "state": 1, "jitter": 0.5}])
    (start, end, _) = jittered_segments(bar, random.Random(seed))[0]
    assert 0 <= start < end <= 24
    assert end - start >= 0.25  # min 15-min width preserved


def test_jitter_bounded_by_amount():
    bar = _bar(segments=[{"start": 10, "end": 14, "state": 1, "jitter": 10 / 60}])
    for seed in range(200):
        (start, end, _) = jittered_segments(bar, random.Random(seed))[0]
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


def test_disabled_schedule_has_no_conflicts():
    sched = _sched(
        {"id": "a", "name": "A", "type": "light", "targets": ["light.x"],
         "segments": [{"start": 6, "end": 12, "state": 1}]},
        {"id": "b", "name": "B", "type": "light", "targets": ["light.x"],
         "segments": [{"start": 6, "end": 12, "state": 1}]},
        enabled=False,
    )
    assert detect_conflicts(sched) == {"a": [], "b": []}
