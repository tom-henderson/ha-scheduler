"""Tests for the data model: snapping, validation, serialization."""

from custom_components.daily_schedule.models import (
    Bar,
    Schedule,
    Segment,
    Trigger,
    normalize_expr,
    snap,
    snap_offset,
)


def test_snap_rounds_to_quarter_hour():
    assert snap(6.10) == 6.0
    assert snap(6.13) == 6.25
    assert snap(6.30) == 6.25
    assert snap(6.40) == 6.5
    assert snap(-1) == 0.0
    assert snap(30) == 24.0


def test_segment_from_dict_fixes_inverted_and_zero_width():
    # end <= start gets nudged to a minimum-width span
    seg = Segment.from_dict({"start": 6, "end": 6, "state": 1}, "light")
    assert seg.end > seg.start
    seg2 = Segment.from_dict({"start": 8, "end": 5, "state": 1}, "light")
    assert seg2.end > seg2.start


def test_segment_state_clamped_to_type():
    # light has 2 states (0,1); an out-of-range index is clamped
    seg = Segment.from_dict({"start": 1, "end": 2, "state": 9}, "light")
    assert seg.state == 1
    fan = Segment.from_dict({"start": 1, "end": 2, "state": 3}, "fan")
    assert fan.state == 3  # fan has 4 states


def test_bar_resolve_covering_segment_else_base():
    bar = Bar.from_dict(
        {
            "name": "b",
            "type": "light",
            "base": 0,
            "segments": [
                {"start": 6, "end": 9, "state": 1},
                {"start": 18, "end": 22, "state": 1},
            ],
        }
    )
    assert bar.resolve(0) == 0  # base
    assert bar.resolve(6) == 1  # inside first segment (inclusive start)
    assert bar.resolve(9) == 0  # exclusive end -> base
    assert bar.resolve(20) == 1
    assert bar.resolve(23) == 0


def test_bar_resolve_with_active_base():
    bar = Bar.from_dict(
        {
            "name": "b",
            "type": "blind",
            "base": 1,  # Open by default
            "segments": [{"start": 22, "end": 24, "state": 0}],  # Closed at night
        }
    )
    assert bar.resolve(12) == 1
    assert bar.resolve(23) == 0


def test_schedule_roundtrip_is_stable():
    data = {
        "enabled": True,
        "bars": [
            {
                "id": "bar_x",
                "name": "Holiday Lights",
                "type": "light",
                "base": 0,
                "targets": ["light.porch", "light.lamp"],
                "segments": [
                    {"id": "seg_1", "start": 0, "end": 7, "state": 1, "jitter": 0.16},
                ],
            }
        ],
    }
    sched = Schedule.from_dict(data)
    out = sched.to_dict()
    assert out["bars"][0]["id"] == "bar_x"
    assert out["bars"][0]["segments"][0]["id"] == "seg_1"
    assert out["bars"][0]["targets"] == ["light.porch", "light.lamp"]
    # Re-parsing the output yields identical data (idempotent serialization).
    assert Schedule.from_dict(out).to_dict() == out


def test_segments_always_serialize_sorted():
    bar = Bar.from_dict(
        {
            "name": "b",
            "type": "light",
            "segments": [
                {"start": 18, "end": 20, "state": 1},
                {"start": 6, "end": 8, "state": 1},
            ],
        }
    )
    starts = [s["start"] for s in bar.to_dict()["segments"]]
    assert starts == sorted(starts)


def test_segment_data_defaults_empty_and_roundtrips():
    # Simple types carry no per-segment data.
    seg = Segment.from_dict({"start": 1, "end": 2, "state": 1}, "light")
    assert seg.data == {}
    assert seg.to_dict()["data"] == {}

    # Richer types persist their parameters unchanged through a roundtrip.
    climate = Segment.from_dict(
        {"start": 6, "end": 9, "state": 1, "data": {"temperature": 21.5}}, "climate"
    )
    assert climate.data == {"temperature": 21.5}
    reparsed = Segment.from_dict(climate.to_dict(), "climate")
    assert reparsed.data == {"temperature": 21.5}


def test_segment_data_ignores_non_dict():
    seg = Segment.from_dict({"start": 1, "end": 2, "state": 1, "data": "nope"}, "climate")
    assert seg.data == {}


def test_triggers_parse_sort_and_roundtrip():
    bar = Bar.from_dict(
        {
            "name": "Scenes",
            "type": "trigger",
            "triggers": [
                {"id": "t2", "at": 18, "jitter": 0.16,
                 "action": {"service": "scene.turn_on", "entity_id": "scene.night"}},
                {"id": "t1", "at": 7,
                 "action": {"service": "scene.turn_on", "entity_id": "scene.wake"}},
            ],
        }
    )
    assert [t.id for t in bar.sorted_triggers()] == ["t1", "t2"]
    out = bar.to_dict()
    assert [t["at"] for t in out["triggers"]] == [7.0, 18.0]
    assert isinstance(bar.triggers[0], Trigger)
    # Idempotent serialization.
    assert Bar.from_dict(out).to_dict() == out


def test_trigger_time_snaps_to_grid():
    t = Trigger.from_dict({"at": 7.1, "action": {"service": "scene.turn_on"}})
    assert t.at == 7.0


def test_range_bar_has_empty_triggers_and_stateless_base_clamps():
    bar = Bar.from_dict(
        {"name": "b", "type": "light", "segments": [{"start": 6, "end": 9, "state": 1}]}
    )
    assert bar.triggers == []
    assert bar.to_dict()["triggers"] == []
    # A trigger bar takes no state; base clamps to 0 without a states list.
    trig = Bar.from_dict({"name": "t", "type": "trigger", "base": 3})
    assert trig.base == 0


def test_snap_offset_grids_and_clamps():
    assert snap_offset(-0.5) == -0.5
    assert snap_offset(0.13) == 0.25
    assert snap_offset(-0.13) == -0.25
    assert snap_offset(5) == 2.0  # clamped to +MAX
    assert snap_offset(-5) == -2.0  # clamped to -MAX


def test_normalize_expr_accepts_valid_and_rejects_junk():
    assert normalize_expr({"event": "sunset", "offset": -0.5}) == {
        "event": "sunset",
        "offset": -0.5,
    }
    # Offset snapped + clamped.
    assert normalize_expr({"event": "sunrise", "offset": 9}) == {
        "event": "sunrise",
        "offset": 2.0,
    }
    # Missing offset defaults to 0.
    assert normalize_expr({"event": "dawn"}) == {"event": "dawn", "offset": 0.0}
    # Junk / unknown event / plain number -> None (stays an absolute boundary).
    assert normalize_expr({"event": "lunchtime"}) is None
    assert normalize_expr(18.5) is None
    assert normalize_expr(None) is None


def test_segment_parses_solar_exprs_and_roundtrips():
    seg = Segment.from_dict(
        {
            "start": 17.5,
            "end": 23,
            "state": 1,
            "start_expr": {"event": "sunset", "offset": -0.5},
        },
        "light",
    )
    assert seg.start_expr == {"event": "sunset", "offset": -0.5}
    assert seg.end_expr is None  # a clock end
    out = seg.to_dict()
    assert out["start_expr"] == {"event": "sunset", "offset": -0.5}
    assert "end_expr" not in out  # absent boundary stays compact
    assert Segment.from_dict(out, "light").to_dict() == out


def test_plain_clock_segment_carries_no_expr_keys():
    # Backward compatibility: an existing segment (no expr) serialises unchanged.
    seg = Segment.from_dict({"start": 6, "end": 9, "state": 1}, "light")
    assert seg.start_expr is None and seg.end_expr is None
    out = seg.to_dict()
    assert "start_expr" not in out and "end_expr" not in out


def test_active_intervals_excludes_off_state():
    bar = Bar.from_dict(
        {
            "name": "b",
            "type": "light",
            "base": 0,
            "segments": [
                {"start": 6, "end": 8, "state": 0},  # off override -> not active
                {"start": 18, "end": 20, "state": 1},  # on -> active
            ],
        }
    )
    intervals = bar.active_intervals()
    assert intervals == [(18.0, 20.0, 1)]
