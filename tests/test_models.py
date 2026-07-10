"""Tests for the data model: snapping, validation, serialization."""

from custom_components.daily_schedule.models import Bar, Schedule, Segment, snap


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
