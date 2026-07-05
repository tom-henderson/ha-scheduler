import React, { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { Plus, Lightbulb, Blinds, Droplets, Fan, Trash2, Copy, AlertTriangle, X, Check, RefreshCw, Dice5 } from "lucide-react";

// ── Design tokens ───────────────────────────────────────────────
const C = {
  bg: "#12161c", panel: "#1a2029", panelHi: "#222b36", line: "#2c3644",
  text: "#e8edf2", dim: "#8a97a6", faint: "#5a6675",
  accent: "#03a9f4", warn: "#f5934e", off: "#1c242f", track: "#0d1116",
};

const HOURS = 24;
const SNAP = 0.25; // 15 min

// states[0] is treated as the natural "off"/rest state for the entity type.
const TYPES = {
  light: { icon: Lightbulb, color: "#f5b301",
    states: [{ k: "off", label: "Off" }, { k: "on", label: "On" }] },
  blind: { icon: Blinds, color: "#7e9cff",
    states: [{ k: "off", label: "Closed" }, { k: "on", label: "Open" }] },
  water: { icon: Droplets, color: "#2bc4d4",
    states: [{ k: "off", label: "Off" }, { k: "on", label: "Watering" }] },
  fan: { icon: Fan, color: "#5ad19a",
    states: [{ k: "off", label: "Off" }, { k: "low", label: "Low" }, { k: "med", label: "Med" }, { k: "high", label: "High" }] },
};

const JITTERS = [
  { v: 0, label: "None" },
  { v: 5 / 60, label: "±5m" },
  { v: 10 / 60, label: "±10m" },
  { v: 15 / 60, label: "±15m" },
  { v: 30 / 60, label: "±30m" },
];

function fmt(h) {
  const t = Math.round(h * 60);
  return `${String(Math.floor(t / 60) % 24).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}
function parse(str) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(str.trim());
  if (!m) return null;
  const h = +m[1], mm = +m[2];
  if (h > 24 || mm > 59) return null;
  return Math.min(24, h + mm / 60);
}
const isActive = (type, si) => TYPES[type].states[si].k !== "off";
const jitterLabel = (v) => (JITTERS.find((j) => Math.abs(j.v - v) < 0.001) || JITTERS[0]).label;

let idc = 4;

// ── Segment popover ─────────────────────────────────────────────
function SegmentEditor({ seg, type, bounds, onSave, onDelete, onClose }) {
  const T = TYPES[type];
  const [si, setSi] = useState(seg.si);
  const [s, setS] = useState(fmt(seg.start));
  const [e, setE] = useState(fmt(seg.end));
  const [jit, setJit] = useState(seg.jitter ?? 0);
  const [err, setErr] = useState("");

  const save = () => {
    const ps = parse(s), pe = parse(e);
    if (ps == null || pe == null) return setErr("Use HH:MM");
    if (pe <= ps) return setErr("End must be after start");
    if (ps < bounds.min || pe > bounds.max) return setErr(`Stay within ${fmt(bounds.min)}–${fmt(bounds.max)}`);
    onSave({ ...seg, si, start: ps, end: pe, jitter: jit });
  };

  return (
    <div style={{ position: "absolute", zIndex: 20, top: 50, left: 0, right: 0, margin: "0 auto",
      width: 268, background: C.panelHi, borderRadius: 12, border: `1px solid ${C.line}`,
      boxShadow: "0 16px 40px #000a", padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>Edit segment</span>
        <button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none",
          color: C.dim, cursor: "pointer", padding: 2 }}><X size={15} /></button>
      </div>

      <div style={{ fontSize: 11, color: C.dim, marginBottom: 6 }}>State</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
        {T.states.map((st, i) => (
          <button key={i} onClick={() => setSi(i)}
            style={{ padding: "6px 11px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600,
              border: `1px solid ${si === i ? T.color : C.line}`,
              background: si === i ? T.color + "22" : "transparent",
              color: si === i ? C.text : C.dim }}>
            {st.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 6 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: C.dim, marginBottom: 4 }}>Start</div>
          <input value={s} onChange={(ev) => { setS(ev.target.value); setErr(""); }} style={inp} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: C.dim, marginBottom: 4 }}>End</div>
          <input value={e} onChange={(ev) => { setE(ev.target.value); setErr(""); }} style={inp} />
        </div>
      </div>
      <div style={{ fontSize: 10.5, color: err ? C.warn : C.faint, marginBottom: 12 }}>
        {err || `Available ${fmt(bounds.min)}–${fmt(bounds.max)}`}
      </div>

      <div style={{ fontSize: 11, color: C.dim, marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
        <Dice5 size={12} /> Daily jitter
        <span style={{ marginLeft: "auto", color: C.faint, fontSize: 10 }}>randomises boundaries ±</span>
      </div>
      <div style={{ display: "flex", gap: 5, marginBottom: 14 }}>
        {JITTERS.map((j) => (
          <button key={j.v} onClick={() => setJit(j.v)}
            style={{ flex: 1, padding: "6px 0", borderRadius: 7, cursor: "pointer", fontSize: 11, fontWeight: 600,
              border: `1px solid ${Math.abs(jit - j.v) < 0.001 ? C.accent : C.line}`,
              background: Math.abs(jit - j.v) < 0.001 ? C.accent + "22" : "transparent",
              color: Math.abs(jit - j.v) < 0.001 ? C.text : C.dim }}>
            {j.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => onDelete(seg.id)}
          style={{ ...btn, background: "transparent", border: `1px solid ${C.line}`, color: C.dim }}>
          <Trash2 size={13} /> Delete
        </button>
        <button onClick={save} style={{ ...btn, background: C.accent, color: "#04121a", flex: 1 }}>
          <Check size={14} /> Save
        </button>
      </div>
    </div>
  );
}
const inp = { width: "100%", boxSizing: "border-box", padding: "7px 9px", borderRadius: 8,
  border: `1px solid ${C.line}`, background: C.track, color: C.text, fontSize: 13,
  fontVariantNumeric: "tabular-nums" };
const btn = { padding: "8px 12px", borderRadius: 8, border: "none", cursor: "pointer",
  fontSize: 12.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, justifyContent: "center" };

// ── Base-state popover (for the fill / empty space) ─────────────
function BasePopover({ bar, onPick, onClose }) {
  const T = TYPES[bar.type];
  return (
    <div style={{ position: "absolute", zIndex: 20, top: 50, left: 0, right: 0, margin: "0 auto",
      width: 240, background: C.panelHi, borderRadius: 12, border: `1px solid ${C.line}`,
      boxShadow: "0 16px 40px #000a", padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontSize: 12.5, fontWeight: 700 }}>Default state</span>
        <button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none",
          color: C.dim, cursor: "pointer", padding: 2 }}><X size={15} /></button>
      </div>
      <div style={{ fontSize: 10.5, color: C.faint, marginBottom: 10, lineHeight: 1.5 }}>
        Applied to all time not covered by a segment.
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {T.states.map((st, i) => (
          <button key={i} onClick={() => onPick(i)}
            style={{ padding: "6px 11px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600,
              border: `1px solid ${bar.base === i ? T.color : C.line}`,
              background: bar.base === i ? T.color + "22" : "transparent",
              color: bar.base === i ? C.text : C.dim }}>
            {st.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Bar ─────────────────────────────────────────────────────────
function Bar({ bar, onChange, onRemove, onDup, scheduleOn, conflicts, now, syncing }) {
  const T = TYPES[bar.type];
  const trackRef = useRef(null);
  const [editing, setEditing] = useState(null); // segment id or "__base__"
  const [drag, setDrag] = useState(null);
  const moved = useRef(false);

  const live = scheduleOn && bar.on;      // this bar is actually acting
  const segs = [...bar.segs].sort((a, b) => a.start - b.start);
  const baseActive = isActive(bar.type, bar.base);

  // resolve the effective state at "now": a covering segment, else the base
  const currentSeg = segs.find((s) => now >= s.start && now < s.end);
  const currentIsBase = !currentSeg;

  const addSegment = () => {
    const occ = segs.map((s) => [s.start, s.end]).sort((a, b) => a[0] - b[0]);
    let best = null, cursor = 0;
    const span = (p) => (p ? p[1] - p[0] : 0);
    for (const [s, e] of occ) {
      if (s - cursor > span(best)) best = [cursor, s];
      cursor = Math.max(cursor, e);
    }
    if (24 - cursor > span(best)) best = [cursor, 24];
    if (!best || span(best) < 0.5) return;
    const start = best[0], end = Math.min(best[1], start + Math.max(1, span(best) / 2));
    // default new segment to first non-base active state
    const si = bar.base === 0 ? 1 : 0;
    const ns = { id: `s${++idc}`, start, end, si, jitter: 0 };
    onChange({ ...bar, segs: [...bar.segs, ns] });
    setEditing(ns.id);
  };

  const boundsFor = (seg) => {
    const others = segs.filter((s) => s.id !== seg.id);
    const min = others.filter((s) => s.end <= seg.start).reduce((m, s) => Math.max(m, s.end), 0);
    const max = others.filter((s) => s.start >= seg.end).reduce((m, s) => Math.min(m, s.start), 24);
    return { min, max };
  };

  const dragSeg = (seg, mode, e) => {
    e.stopPropagation();
    moved.current = false;
    const b = boundsFor(seg);
    const startX = e.clientX;
    const orig = { start: seg.start, end: seg.end };
    setDrag({ id: seg.id, mode });
    const move = (ev) => {
      const w = trackRef.current.getBoundingClientRect().width;
      const dh = Math.round(((ev.clientX - startX) / w) * HOURS / SNAP) * SNAP;
      if (Math.abs(ev.clientX - startX) > 3) moved.current = true;
      let ns = { ...seg };
      if (mode === "move") {
        const len = orig.end - orig.start;
        const start = Math.min(b.max - len, Math.max(b.min, orig.start + dh));
        ns.start = start; ns.end = start + len;
      } else if (mode === "l") {
        ns.start = Math.min(orig.end - SNAP, Math.max(b.min, orig.start + dh));
      } else {
        ns.end = Math.max(orig.start + SNAP, Math.min(b.max, orig.end + dh));
      }
      onChange({ ...bar, segs: bar.segs.map((s) => (s.id === seg.id ? ns : s)) });
    };
    const up = () => { setDrag(null); window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const saveSeg = (ns) => { onChange({ ...bar, segs: bar.segs.map((s) => (s.id === ns.id ? ns : s)) }); setEditing(null); };
  const delSeg = (id) => { onChange({ ...bar, segs: bar.segs.filter((s) => s.id !== id) }); setEditing(null); };
  const pickBase = (i) => { onChange({ ...bar, base: i }); setEditing(null); };

  const editingSeg = segs.find((s) => s.id === editing);

  return (
    <div style={{ marginBottom: 14, opacity: live ? 1 : 0.4, transition: "opacity .2s", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: C.panelHi,
          display: "grid", placeItems: "center", color: T.color, flexShrink: 0 }}>
          <T.icon size={17} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
            {bar.name}
            {conflicts.length > 0 && (
              <span title={`Overlaps ${conflicts.join(", ")} on a shared entity`}
                style={{ display: "inline-flex", alignItems: "center", gap: 3, color: C.warn,
                  fontSize: 11, fontWeight: 600, background: C.warn + "1e", padding: "1px 6px", borderRadius: 6 }}>
                <AlertTriangle size={11} /> Conflict
              </span>
            )}
          </div>
          <div style={{ fontSize: 11.5, color: C.dim, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {bar.targets.join(" · ")}
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 2, alignItems: "center" }}>
          <IconBtn title="Add segment" onClick={addSegment}><Plus size={15} /></IconBtn>
          <IconBtn title="Duplicate bar" onClick={() => onDup(bar.id)}><Copy size={14} /></IconBtn>
          <IconBtn title="Remove bar" onClick={() => onRemove(bar.id)}><Trash2 size={14} /></IconBtn>
          <div style={{ width: 1, height: 20, background: C.line, margin: "0 4px" }} />
          <MiniToggle on={bar.on} onChange={(v) => onChange({ ...bar, on: v })} title="Enable this bar" />
        </div>
      </div>

      <div ref={trackRef}
        style={{ position: "relative", height: 46, background: C.track, borderRadius: 8,
          border: `1px solid ${C.line}`, overflow: "hidden" }}>

        {/* BASE LAYER — fills the whole day; click to change default state */}
        <div onClick={(e) => { e.stopPropagation(); setEditing("__base__"); }}
          title={`Default: ${T.states[bar.base].label} — click to change`}
          style={{ position: "absolute", inset: 0, cursor: "pointer",
            background: baseActive
              ? `repeating-linear-gradient(135deg, ${T.color}cc 0 8px, ${T.color}99 8px 16px)`
              : C.off }}>
          {baseActive && (
            <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
              fontSize: 9.5, fontWeight: 700, color: "#1a1200", opacity: .8, pointerEvents: "none" }}>
              default: {T.states[bar.base].label}
            </span>
          )}
        </div>

        {/* SEGMENT OVERRIDES */}
        {segs.map((s) => {
          const active = isActive(bar.type, s.si);
          const left = (s.start / 24) * 100, width = ((s.end - s.start) / 24) * 100;
          const st = T.states[s.si];
          const dragging = drag && drag.id === s.id;
          const showStart = dragging && (drag.mode === "move" || drag.mode === "l");
          const showEnd = dragging && (drag.mode === "move" || drag.mode === "r");
          return (
            <div key={s.id}
              onPointerDown={(e) => dragSeg(s, "move", e)}
              onClick={(e) => { e.stopPropagation(); if (!moved.current) setEditing(s.id); }}
              title={`${fmt(s.start)}–${fmt(s.end)} · ${st.label}${s.jitter ? ` · ${jitterLabel(s.jitter)}` : ""}`}
              style={{ position: "absolute", left: `${left}%`, width: `${width}%`, top: 3, bottom: 3,
                borderRadius: 5, cursor: "grab", zIndex: dragging ? 8 : 2,
                background: active ? `linear-gradient(180deg, ${T.color}, ${T.color}cc)` : C.off,
                border: active ? "none" : `1px solid ${C.line}`, outline: active ? "none" : `1px solid ${C.faint}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: dragging ? "0 4px 14px #000a" : "0 1px 3px #0006" }}>
              <Handle side="l" onDown={(e) => dragSeg(s, "l", e)} />
              {width > 8 && (
                <span style={{ fontSize: 10.5, fontWeight: 600, pointerEvents: "none", display: "flex",
                  alignItems: "center", gap: 3, color: active ? "#1a1200" : C.dim, whiteSpace: "nowrap" }}>
                  {st.label}{s.jitter ? <Dice5 size={10} /> : null}
                </span>
              )}
              <Handle side="r" onDown={(e) => dragSeg(s, "r", e)} />
              {showStart && <TimeBubble side="l">{fmt(s.start)}</TimeBubble>}
              {showEnd && <TimeBubble side="r">{fmt(s.end)}</TimeBubble>}
            </div>
          );
        })}

        {/* current-time marker */}
        <div style={{ position: "absolute", left: `${(now / 24) * 100}%`, top: -2, bottom: -2,
          width: 2, background: "#ff5a6e", zIndex: 6, pointerEvents: "none",
          boxShadow: syncing ? "0 0 8px 2px #ff5a6e" : "none", transition: "box-shadow .2s" }} />

        {/* sync flash: outline the effective current region */}
        {syncing && live && currentSeg && (
          <div style={{ position: "absolute", top: 1, bottom: 1,
            left: `${(currentSeg.start / 24) * 100}%`, width: `${((currentSeg.end - currentSeg.start) / 24) * 100}%`,
            borderRadius: 6, border: "2px solid #fff", zIndex: 7, pointerEvents: "none",
            animation: "pulse .6s ease-in-out 2" }} />
        )}
        {syncing && live && currentIsBase && (
          <div style={{ position: "absolute", inset: 1, borderRadius: 6, border: "2px solid #fff",
            zIndex: 7, pointerEvents: "none", animation: "pulse .6s ease-in-out 2" }} />
        )}
      </div>

      {editingSeg && (
        <SegmentEditor seg={editingSeg} type={bar.type} bounds={boundsFor(editingSeg)}
          onSave={saveSeg} onDelete={delSeg} onClose={() => setEditing(null)} />
      )}
      {editing === "__base__" && (
        <BasePopover bar={bar} onPick={pickBase} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

function TimeBubble({ side, children }) {
  return (
    <div style={{ position: "absolute", top: 2, [side === "l" ? "left" : "right"]: 2,
      background: "#fff", color: "#12161c", fontSize: 10, fontWeight: 700,
      padding: "1px 5px", borderRadius: 4, whiteSpace: "nowrap", pointerEvents: "none",
      fontVariantNumeric: "tabular-nums", boxShadow: "0 1px 4px #0008", zIndex: 12 }}>
      {children}
    </div>
  );
}

function Handle({ side, onDown }) {
  return (
    <div onPointerDown={onDown} onClick={(e) => e.stopPropagation()}
      style={{ position: "absolute", [side === "l" ? "left" : "right"]: 0, top: 0, bottom: 0,
        width: 10, cursor: "ew-resize", display: "flex", alignItems: "center",
        justifyContent: side === "l" ? "flex-start" : "flex-end", paddingInline: 2, zIndex: 5 }}>
      <div style={{ width: 2.5, height: "45%", background: "#ffffffaa", borderRadius: 2 }} />
    </div>
  );
}

function IconBtn({ children, onClick, title }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} title={title} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ width: 28, height: 28, borderRadius: 7, border: "none", cursor: "pointer",
        background: h ? C.panelHi : "transparent", color: h ? C.text : C.dim, display: "grid", placeItems: "center" }}>
      {children}
    </button>
  );
}
function Toggle({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)} role="switch" aria-checked={on}
      style={{ width: 46, height: 26, borderRadius: 20, border: "none", cursor: "pointer",
        background: on ? C.accent : C.line, position: "relative", transition: "background .2s", flexShrink: 0 }}>
      <span style={{ position: "absolute", top: 3, left: on ? 23 : 3, width: 20, height: 20,
        borderRadius: "50%", background: "#fff", transition: "left .2s" }} />
    </button>
  );
}
function MiniToggle({ on, onChange, title }) {
  return (
    <button onClick={() => onChange(!on)} role="switch" aria-checked={on} title={title}
      style={{ width: 36, height: 20, borderRadius: 20, border: "none", cursor: "pointer",
        background: on ? C.accent : C.line, position: "relative", transition: "background .2s", flexShrink: 0 }}>
      <span style={{ position: "absolute", top: 2.5, left: on ? 18 : 2.5, width: 15, height: 15,
        borderRadius: "50%", background: "#fff", transition: "left .2s" }} />
    </button>
  );
}

export default function ScheduleMockup() {
  const [enabled, setEnabled] = useState(true);
  const [bars, setBars] = useState([
    { id: 1, name: "Holiday Lights", type: "light", on: true, base: 0, targets: ["Front Porch", "Living Room lamp"],
      segs: [{ id: "a1", start: 0, end: 7, si: 1, jitter: 10 / 60 }, { id: "a2", start: 16.5, end: 23, si: 1, jitter: 15 / 60 }] },
    { id: 2, name: "Garden Watering", type: "water", on: true, base: 0, targets: ["Zone 1 · Vege beds"],
      segs: [{ id: "b1", start: 6, end: 6.5, si: 1, jitter: 0 }, { id: "b2", start: 18.5, end: 19, si: 1, jitter: 0 }] },
    { id: 3, name: "Porch Accent", type: "light", on: false, base: 0, targets: ["Front Porch"],
      segs: [{ id: "c1", start: 18, end: 22, si: 1, jitter: 0 }] },
  ]);

  const update = (b) => setBars((bs) => bs.map((x) => (x.id === b.id ? b : x)));
  const remove = (id) => setBars((bs) => bs.filter((x) => x.id !== id));
  const dup = (id) => setBars((bs) => {
    const src = bs.find((x) => x.id === id);
    return [...bs, { ...src, id: ++idc, name: src.name + " copy",
      segs: src.segs.map((s) => ({ ...s, id: `s${++idc}` })) }];
  });
  const addBar = (type) => setBars((bs) => [...bs, { id: ++idc, name: "New schedule", type, on: true, base: 0,
    targets: ["Choose entities…"], segs: [{ id: `s${++idc}`, start: 8, end: 18, si: 1, jitter: 0 }] }]);

  const conflictMap = useMemo(() => {
    const m = {};
    bars.forEach((b) => (m[b.id] = new Set()));
    for (let i = 0; i < bars.length; i++)
      for (let j = i + 1; j < bars.length; j++) {
        const A = bars[i], B = bars[j];
        if (!A.on || !B.on) continue;
        if (!A.targets.some((t) => B.targets.includes(t))) continue;
        const overlap = A.segs.some((sa) => isActive(A.type, sa.si) &&
          B.segs.some((sb) => isActive(B.type, sb.si) && sa.start < sb.end && sb.start < sa.end));
        if (overlap) { m[A.id].add(B.name); m[B.id].add(A.name); }
      }
    return m;
  }, [bars]);

  const [menu, setMenu] = useState(false);

  const [now, setNow] = useState(() => {
    const d = new Date();
    return d.getHours() + d.getMinutes() / 60;
  });
  useEffect(() => {
    const t = setInterval(() => {
      const d = new Date();
      setNow(d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600);
    }, 30000);
    return () => clearInterval(t);
  }, []);

  const [syncing, setSyncing] = useState(false);
  const runSync = () => { setSyncing(true); setTimeout(() => setSyncing(false), 1400); };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "28px 16px",
      fontFamily: "'Inter', system-ui, sans-serif", color: C.text }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .25; } }
      `}</style>
      <div style={{ maxWidth: 620, margin: "0 auto" }}>
        <div style={{ background: C.panel, borderRadius: 16, border: `1px solid ${C.line}`, overflow: "visible" }}>
          <div style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 14,
            borderBottom: `1px solid ${C.line}` }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.2 }}>Daily Schedule</div>
              <div style={{ fontSize: 12.5, color: C.dim, marginTop: 2 }}>
                Repeats every day · {bars.length} {bars.length === 1 ? "bar" : "bars"}
              </div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={runSync} disabled={!enabled} title="Set every entity to its state for the current time"
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 9,
                  border: `1px solid ${C.line}`, background: syncing ? C.accent + "22" : "transparent",
                  color: enabled ? (syncing ? C.accent : C.text) : C.faint, fontSize: 12.5, fontWeight: 600,
                  cursor: enabled ? "pointer" : "not-allowed" }}>
                <RefreshCw size={14} style={{ animation: syncing ? "spin .8s linear infinite" : "none" }} />
                {syncing ? "Syncing…" : "Sync now"}
              </button>
              <div style={{ width: 1, height: 22, background: C.line }} />
              <span style={{ fontSize: 12.5, color: enabled ? C.accent : C.dim, fontWeight: 600 }}>
                {enabled ? "Enabled" : "Disabled"}
              </span>
              <Toggle on={enabled} onChange={setEnabled} />
            </div>
          </div>

          <div style={{ padding: "14px 20px 4px" }}>
            <div style={{ position: "relative", height: 16, marginBottom: 2 }}>
              {[0, 6, 12, 18, 24].map((h) => (
                <span key={h} style={{ position: "absolute", left: `${(h / 24) * 100}%`,
                  transform: h === 0 ? "none" : h === 24 ? "translateX(-100%)" : "translateX(-50%)",
                  fontSize: 10.5, color: C.faint, fontVariantNumeric: "tabular-nums" }}>{fmt(h)}</span>
              ))}
              <span style={{ position: "absolute", left: `${(now / 24) * 100}%`, transform: "translateX(-50%)",
                top: -1, fontSize: 10, fontWeight: 700, color: "#ff5a6e", fontVariantNumeric: "tabular-nums",
                background: C.panel, padding: "0 3px", borderRadius: 3 }}>
                {fmt(now)}
              </span>
            </div>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
                {[6, 12, 18].map((h) => (
                  <div key={h} style={{ position: "absolute", left: `${(h / 24) * 100}%`,
                    top: 0, bottom: 0, width: 1, background: C.line, opacity: 0.5 }} />
                ))}
              </div>
              <div style={{ position: "relative", zIndex: 1 }}>
                {bars.map((b) => (
                  <Bar key={b.id} bar={b} scheduleOn={enabled} onChange={update} onRemove={remove}
                    onDup={dup} conflicts={[...conflictMap[b.id]]} now={now} syncing={syncing} />
                ))}
              </div>
            </div>
          </div>

          <div style={{ padding: "6px 20px 20px", position: "relative" }}>
            <button onClick={() => setMenu((m) => !m)}
              style={{ width: "100%", padding: 11, borderRadius: 10, cursor: "pointer",
                background: "transparent", border: `1.5px dashed ${C.line}`, color: C.dim,
                fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
              <Plus size={16} /> Add schedule bar
            </button>
            {menu && (
              <div style={{ position: "absolute", left: 20, right: 20, bottom: 62, background: C.panelHi,
                borderRadius: 12, border: `1px solid ${C.line}`, padding: 6, zIndex: 30, boxShadow: "0 12px 32px #0008" }}>
                {Object.entries(TYPES).map(([k, v]) => (
                  <button key={k} onClick={() => { addBar(k); setMenu(false); }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = C.panel)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 10px",
                      borderRadius: 8, border: "none", cursor: "pointer", background: "transparent", color: C.text,
                      fontSize: 13, textAlign: "left" }}>
                    <v.icon size={16} color={v.color} />
                    <span style={{ textTransform: "capitalize" }}>{k}</span>
                    <span style={{ marginLeft: "auto", fontSize: 11, color: C.faint }}>
                      {v.states.map((s) => s.label).join(" / ")}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: 14, fontSize: 11.5, color: C.faint, lineHeight: 1.7, textAlign: "center" }}>
          Striped/plain fill = default state (click to change) · tap a segment to edit state, times &amp; jitter · drag to move or resize · per-bar toggle on the right
        </div>
      </div>
    </div>
  );
}
