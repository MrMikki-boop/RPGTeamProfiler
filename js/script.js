import { useState, useEffect, useRef, useCallback, useMemo } from "react";

/* ─── persistence ─── */
const STORAGE_KEY = "rpg-profiler-v3";
const load = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) } catch { return null } };
const persist = (s) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch {} };

/* ─── palette ─── */
const PALETTE = [
    { id: "crimson",  hex: "#E24B4A", bg: "rgba(226,75,74,0.18)" },
    { id: "emerald",  hex: "#1D9E75", bg: "rgba(29,158,117,0.18)" },
    { id: "sapphire", hex: "#378ADD", bg: "rgba(55,138,221,0.18)" },
    { id: "violet",   hex: "#7F77DD", bg: "rgba(127,119,221,0.18)" },
    { id: "amber",    hex: "#D88A30", bg: "rgba(216,138,48,0.18)" },
    { id: "rose",     hex: "#D4537E", bg: "rgba(212,83,126,0.18)" },
    { id: "teal",     hex: "#45B7D1", bg: "rgba(69,183,209,0.18)" },
    { id: "indigo",   hex: "#6228D6", bg: "rgba(98,40,214,0.18)" },
];
const getColor = (id) => PALETTE.find(p => p.id === id) || PALETTE[0];

/* ─── defaults ─── */
const DEFAULT_LABELS = ["Ролеплей", "Импровизация", "Правила", "Социальность", "Тактика"];
const DEFAULT_CHARS = [
    { id: "c1", name: "Сергей",  role: "player", stats: [8,2,6,7,6], colorId: "indigo" },
    { id: "c2", name: "Дима",    role: "player", stats: [8,3,7,8,8], colorId: "crimson" },
    { id: "c3", name: "Витя",    role: "player", stats: [6,7,4,7,2], colorId: "emerald" },
    { id: "c4", name: "Денис",   role: "player", stats: [2,2,8,2,7], colorId: "sapphire" },
    { id: "c5", name: "Настя",   role: "dm",     stats: [8,8,3,9,3], colorId: "violet" },
];

const uid = () => "c" + Date.now().toString(36) + Math.random().toString(36).slice(2,6);

/* ─── undo system ─── */
const MAX_UNDO = 40;

function useUndoable(init) {
    const [state, setState] = useState(init);
    const history = useRef([init]);
    const idx = useRef(0);

    const set = useCallback((updater) => {
        setState(prev => {
            const next = typeof updater === "function" ? updater(prev) : updater;
            history.current = [...history.current.slice(0, idx.current + 1), next].slice(-MAX_UNDO);
            idx.current = history.current.length - 1;
            return next;
        });
    }, []);

    const undo = useCallback(() => {
        if (idx.current > 0) { idx.current--; setState(history.current[idx.current]); }
    }, []);

    const redo = useCallback(() => {
        if (idx.current < history.current.length - 1) { idx.current++; setState(history.current[idx.current]); }
    }, []);

    const canUndo = idx.current > 0;
    const canRedo = idx.current < history.current.length - 1;

    return [state, set, { undo, redo, canUndo, canRedo }];
}

/* ─── SVG radar (pure, no deps) ─── */
function RadarChart({ datasets, labels, size = 280 }) {
    const cx = size / 2, cy = size / 2, R = size * 0.34;
    const n = labels.length;
    const angle = (i) => -Math.PI / 2 + (2 * Math.PI * i) / n;
    const px = (i, r) => cx + r * Math.cos(angle(i));
    const py = (i, r) => cy + r * Math.sin(angle(i));
    const ticks = [0, 2, 4, 6, 8, 10];

    return (
        <svg viewBox={`0 0 ${size} ${size}`} style={{ width: "100%", maxWidth: size, display: "block", margin: "0 auto" }}>
            {/* grid circles */}
            {ticks.map(t => (
                <circle key={t} cx={cx} cy={cy} r={R * t / 10}
                        fill="none" stroke="var(--grid)" strokeWidth="0.5" />
            ))}
            {/* axes */}
            {labels.map((_, i) => (
                <line key={i} x1={cx} y1={cy} x2={px(i, R)} y2={py(i, R)}
                      stroke="var(--grid)" strokeWidth="0.5" />
            ))}
            {/* tick labels */}
            {ticks.filter(t => t > 0).map(t => (
                <text key={t} x={cx + 3} y={cy - R * t / 10 - 3}
                      fontSize="9" fill="var(--muted)" textAnchor="start">{t}</text>
            ))}
            {/* data polygons */}
            {datasets.map((ds, di) => {
                const pts = ds.data.map((v, i) => `${px(i, R * Math.max(0, v) / 10)},${py(i, R * Math.max(0, v) / 10)}`).join(" ");
                return (
                    <g key={di}>
                        <polygon points={pts} fill={ds.bg} stroke={ds.hex} strokeWidth="2"
                                 style={{ transition: "all 0.3s ease" }} />
                        {ds.data.map((v, i) => (
                            <circle key={i} cx={px(i, R * Math.max(0, v) / 10)} cy={py(i, R * Math.max(0, v) / 10)}
                                    r="3.5" fill={ds.hex} stroke="var(--card)" strokeWidth="1.5"
                                    style={{ transition: "all 0.3s ease" }} />
                        ))}
                    </g>
                );
            })}
            {/* labels */}
            {labels.map((label, i) => {
                const lx = px(i, R + 28), ly = py(i, R + 28);
                return (
                    <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                          fontSize="11" fontWeight="500" fill="var(--text)">
                        {label.length > 13 ? label.slice(0, 12) + "…" : label}
                    </text>
                );
            })}
        </svg>
    );
}

/* ─── color picker popover ─── */
function ColorPicker({ current, onChange }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return;
        const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, [open]);

    const c = getColor(current);
    return (
        <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
            <button onClick={() => setOpen(!open)}
                    style={{ width: 22, height: 22, borderRadius: "50%", background: c.hex,
                        border: "2px solid var(--border)", cursor: "pointer", padding: 0 }} />
            {open && (
                <div style={{ position: "absolute", top: 30, left: -20, zIndex: 10,
                    background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10,
                    padding: 8, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
                    {PALETTE.map(p => (
                        <button key={p.id} onClick={() => { onChange(p.id); setOpen(false); }}
                                style={{ width: 26, height: 26, borderRadius: "50%", background: p.hex,
                                    border: p.id === current ? "2px solid var(--text)" : "2px solid transparent",
                                    cursor: "pointer", padding: 0, transition: "transform 0.15s",
                                }}
                                onMouseEnter={e => e.target.style.transform = "scale(1.2)"}
                                onMouseLeave={e => e.target.style.transform = "scale(1)"} />
                    ))}
                </div>
            )}
        </div>
    );
}

/* ─── stat slider row ─── */
function StatRow({ label, value, onChange }) {
    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 44px 1fr", gap: 8, alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 13, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
            <input type="number" min={0} max={10} step={1} value={value}
                   onChange={e => onChange(Math.max(0, Math.min(10, +e.target.value || 0)))}
                   style={{ width: 44, textAlign: "center", background: "var(--surface)", border: "1px solid var(--border)",
                       borderRadius: 6, color: "var(--text)", padding: "4px 2px", fontSize: 14, fontWeight: 600 }} />
            <input type="range" min={0} max={10} step={1} value={value}
                   onChange={e => onChange(+e.target.value)}
                   style={{ width: "100%", accentColor: "var(--accent)" }} />
        </div>
    );
}

/* ─── character card ─── */
function CharacterCard({ char, labels, onUpdate, onDelete }) {
    const c = getColor(char.colorId);
    const ds = [{ data: char.stats, hex: c.hex, bg: c.bg }];

    return (
        <div style={{
            background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14,
            padding: "20px 20px 16px", position: "relative",
            borderLeft: `3px solid ${c.hex}`,
            transition: "transform 0.2s, box-shadow 0.2s",
        }}
             onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 8px 24px ${c.bg}` }}
             onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "" }}>
            {/* delete */}
            <button onClick={() => { if (confirm("Удалить " + char.name + "?")) onDelete(char.id) }}
                    style={{ position: "absolute", top: 10, right: 10, background: "none", border: "none",
                        color: "var(--muted)", cursor: "pointer", fontSize: 18, padding: "2px 6px", borderRadius: 6,
                        transition: "color 0.15s" }}
                    onMouseEnter={e => e.target.style.color = "#E24B4A"}
                    onMouseLeave={e => e.target.style.color = "var(--muted)"}>×</button>

            {/* header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <ColorPicker current={char.colorId} onChange={cid => onUpdate({ ...char, colorId: cid })} />
                <span style={{
                    fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8,
                    padding: "3px 10px", borderRadius: 12,
                    background: char.role === "dm" ? "rgba(127,119,221,0.15)" : "rgba(29,158,117,0.15)",
                    color: char.role === "dm" ? "#9b8eef" : "#5edcd4",
                }}>{char.role === "dm" ? "ДМ" : "Игрок"}</span>
                <input value={char.name}
                       onChange={e => onUpdate({ ...char, name: e.target.value })}
                       style={{ flex: 1, background: "transparent", border: "none", borderBottom: "1px solid transparent",
                           color: "var(--text)", fontSize: 17, fontWeight: 600, padding: "4px 0",
                           fontFamily: "inherit", outline: "none",
                           transition: "border-color 0.2s" }}
                       onFocus={e => e.target.style.borderBottomColor = c.hex}
                       onBlur={e => e.target.style.borderBottomColor = "transparent"} />
            </div>

            {/* chart */}
            <RadarChart datasets={ds} labels={labels} size={260} />

            {/* stats */}
            <div style={{ marginTop: 12 }}>
                {char.stats.map((v, i) => (
                    <StatRow key={i} label={labels[i]} value={v}
                             onChange={val => {
                                 const next = [...char.stats]; next[i] = val;
                                 onUpdate({ ...char, stats: next });
                             }} />
                ))}
            </div>
        </div>
    );
}

/* ─── comparison section ─── */
function ComparisonSection({ chars, labels, visible, onToggle }) {
    const ds = chars.filter(c => visible.has(c.id)).map(c => {
        const col = getColor(c.colorId);
        return { data: c.stats, hex: col.hex, bg: col.bg, label: c.name };
    });

    return (
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14,
            padding: 24, textAlign: "center", marginTop: 8 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text)", margin: "0 0 16px" }}>
                Сравнительный анализ команды
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 16 }}>
                {chars.map(c => {
                    const col = getColor(c.colorId);
                    const on = visible.has(c.id);
                    return (
                        <label key={c.id} style={{
                            display: "flex", alignItems: "center", gap: 6, padding: "5px 12px",
                            borderRadius: 20, cursor: "pointer", fontSize: 13, fontWeight: 500,
                            background: on ? col.bg : "var(--surface)", border: `1px solid ${on ? col.hex : "var(--border)"}`,
                            color: on ? col.hex : "var(--muted)", transition: "all 0.2s", userSelect: "none",
                        }}>
                            <input type="checkbox" checked={on}
                                   onChange={e => onToggle(c.id, e.target.checked)}
                                   style={{ display: "none" }} />
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: on ? col.hex : "var(--muted)" }} />
                            {c.name}
                        </label>
                    );
                })}
            </div>
            <RadarChart datasets={ds} labels={labels} size={340} />
            {/* legend */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center", marginTop: 12 }}>
                {ds.map((d, i) => (
                    <span key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--muted)" }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: d.hex }} />
                        {d.label}
          </span>
                ))}
            </div>
        </div>
    );
}

/* ─── export utilities ─── */
function svgToPng(svgEl, width, height, bg) {
    return new Promise((resolve) => {
        const clone = svgEl.cloneNode(true);
        const css = getComputedStyle(document.documentElement);
        const vars = { "--text": css.getPropertyValue("--text").trim() || "#fff",
            "--muted": css.getPropertyValue("--muted").trim() || "#999",
            "--grid": css.getPropertyValue("--grid").trim() || "rgba(255,255,255,0.1)",
            "--card": css.getPropertyValue("--card").trim() || "#1e1e2f" };
        const styleEl = document.createElementNS("http://www.w3.org/2000/svg", "style");
        styleEl.textContent = `:root{${Object.entries(vars).map(([k,v])=>`${k}:${v}`).join(";")}}`;
        clone.insertBefore(styleEl, clone.firstChild);
        const data = new XMLSerializer().serializeToString(clone);
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = width * 2; canvas.height = height * 2;
            const ctx = canvas.getContext("2d");
            ctx.scale(2, 2);
            if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, width, height); }
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/png"));
        };
        img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(data);
    });
}

/* ─── JSON import/export ─── */
function exportJSON(state) {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "rpg-team-profiles.json";
    a.click();
    URL.revokeObjectURL(a.href);
}

function importJSON(file) {
    return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => { try { resolve(JSON.parse(r.result)) } catch(e) { reject(e) } };
        r.onerror = reject;
        r.readAsText(file);
    });
}

/* ─── keyboard shortcut hook ─── */
function useHotkeys(handlers) {
    useEffect(() => {
        const fn = (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === "z" && !e.shiftKey && handlers.undo) { e.preventDefault(); handlers.undo(); }
                if ((e.key === "y" || (e.key === "z" && e.shiftKey)) && handlers.redo) { e.preventDefault(); handlers.redo(); }
                if (e.key === "s" && handlers.save) { e.preventDefault(); handlers.save(); }
            }
        };
        window.addEventListener("keydown", fn);
        return () => window.removeEventListener("keydown", fn);
    }, [handlers]);
}

/* ─── main app ─── */
export default function App() {
    const saved = useMemo(() => load(), []);

    const [chars, setChars, undoCtrl] = useUndoable(saved?.chars || DEFAULT_CHARS);
    const [labels, setLabels] = useState(saved?.labels || [...DEFAULT_LABELS]);
    const [visible, setVisible] = useState(() => new Set(saved?.visible || (saved?.chars || DEFAULT_CHARS).map(c => c.id)));
    const [exportMenu, setExportMenu] = useState(false);
    const [toast, setToast] = useState(null);
    const exportRef = useRef(null);
    const fileRef = useRef(null);

    // auto-save
    useEffect(() => {
        persist({ chars, labels, visible: [...visible] });
    }, [chars, labels, visible]);

    // keyboard shortcuts
    useHotkeys(useMemo(() => ({
        undo: undoCtrl.undo,
        redo: undoCtrl.redo,
        save: () => { exportJSON({ chars, labels, visible: [...visible] }); showToast("JSON сохранён") },
    }), [undoCtrl, chars, labels, visible]));

    // close export menu on outside click
    useEffect(() => {
        if (!exportMenu) return;
        const fn = (e) => { if (exportRef.current && !exportRef.current.contains(e.target)) setExportMenu(false) };
        document.addEventListener("mousedown", fn);
        return () => document.removeEventListener("mousedown", fn);
    }, [exportMenu]);

    const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

    // CRUD
    const updateChar = useCallback((updated) => {
        setChars(prev => prev.map(c => c.id === updated.id ? updated : c));
    }, [setChars]);

    const deleteChar = useCallback((id) => {
        setChars(prev => prev.filter(c => c.id !== id));
        setVisible(prev => { const n = new Set(prev); n.delete(id); return n; });
    }, [setChars]);

    const addChar = (role) => {
        const id = uid();
        const colorIdx = chars.filter(c => c.role === role).length % PALETTE.length;
        const newChar = {
            id, name: role === "dm" ? "Новый ДМ" : "Новый игрок", role,
            stats: [5,5,5,5,5],
            colorId: role === "dm" ? "violet" : PALETTE[colorIdx].id,
        };
        setChars(prev => [...prev, newChar]);
        setVisible(prev => new Set([...prev, id]));
    };

    const reset = () => {
        if (!confirm("Сбросить все данные?")) return;
        setChars(DEFAULT_CHARS);
        setLabels([...DEFAULT_LABELS]);
        setVisible(new Set(DEFAULT_CHARS.map(c => c.id)));
        showToast("Данные сброшены");
    };

    const handleImport = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const data = await importJSON(file);
            if (data.chars) setChars(data.chars);
            if (data.labels) setLabels(data.labels);
            if (data.visible) setVisible(new Set(data.visible));
            showToast("Профили загружены");
        } catch { showToast("Ошибка импорта"); }
        e.target.value = "";
    };

    const toggleVis = (id, on) => {
        setVisible(prev => { const n = new Set(prev); on ? n.add(id) : n.delete(id); return n; });
    };

    // share URL
    const shareURL = async () => {
        const data = JSON.stringify({ chars, labels, visible: [...visible] });
        const encoded = btoa(unescape(encodeURIComponent(data)));
        const url = location.origin + location.pathname + "?d=" + encodeURIComponent(encoded);
        try { await navigator.clipboard.writeText(url); showToast("Ссылка скопирована"); }
        catch { showToast("Не удалось скопировать"); }
    };

    // CSS vars injection
    const cssVars = {
        "--bg": "#0f0f1a",
        "--surface": "#1a1a2e",
        "--card": "#1e1e30",
        "--border": "rgba(255,255,255,0.08)",
        "--text": "#e8e8f0",
        "--muted": "#7a7a99",
        "--accent": "#7F77DD",
        "--grid": "rgba(255,255,255,0.08)",
        "--danger": "#E24B4A",
    };

    return (
        <div style={{
            ...cssVars,
            fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
            color: "var(--text)", minHeight: "100vh", padding: "24px 16px",
            background: "linear-gradient(160deg, #0f0f1a 0%, #1a1a2e 40%, #0f0f1a 100%)",
        }}>
            {/* Toast */}
            {toast && (
                <div style={{
                    position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 999,
                    background: "var(--accent)", color: "#fff", padding: "10px 24px", borderRadius: 10,
                    fontSize: 14, fontWeight: 600, boxShadow: "0 4px 20px rgba(127,119,221,0.4)",
                    animation: "fadeIn 0.25s ease",
                }}>{toast}</div>
            )}

            <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateX(-50%) translateY(-10px) } to { opacity:1; transform:translateX(-50%) translateY(0) } }
        input[type=range] { height: 4px; }
        input[type=range]::-webkit-slider-thumb { width: 16px; height: 16px; }
        ::selection { background: rgba(127,119,221,0.3); }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: var(--accent); border-radius: 3px; }
      `}</style>

            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 28 }}>
                <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0,
                    background: "linear-gradient(135deg, #7F77DD, #4ecdc4)", WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent" }}>
                    RPG Team Profiler
                </h1>
                <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 6 }}>
                    Профили и аналитика НРИ-команды
                </p>
            </div>

            {/* Toolbar */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 24 }}>
                <button onClick={() => addChar("player")}
                        style={btnStyle}>+ Игрок</button>
                <button onClick={() => addChar("dm")}
                        style={btnStyle}>+ ДМ</button>
                <button onClick={undoCtrl.undo} disabled={!undoCtrl.canUndo}
                        style={{ ...btnStyle, opacity: undoCtrl.canUndo ? 1 : 0.35 }}>Отменить</button>
                <button onClick={undoCtrl.redo} disabled={!undoCtrl.canRedo}
                        style={{ ...btnStyle, opacity: undoCtrl.canRedo ? 1 : 0.35 }}>Повторить</button>

                {/* Export dropdown */}
                <div ref={exportRef} style={{ position: "relative" }}>
                    <button onClick={() => setExportMenu(!exportMenu)} style={btnStyle}>Экспорт</button>
                    {exportMenu && (
                        <div style={{
                            position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 20, minWidth: 200,
                            background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10,
                            boxShadow: "0 8px 32px rgba(0,0,0,0.4)", overflow: "hidden",
                        }}>
                            <div onClick={() => { exportJSON({ chars, labels, visible: [...visible] }); showToast("JSON сохранён"); setExportMenu(false); }}
                                 style={menuItem}>JSON (все данные)</div>
                            <div onClick={() => { shareURL(); setExportMenu(false); }}
                                 style={menuItem}>Ссылка для шаринга</div>
                            <div onClick={() => { fileRef.current?.click(); setExportMenu(false); }}
                                 style={menuItem}>Импорт из JSON</div>
                            <div style={{ height: 1, background: "var(--border)" }} />
                            <div onClick={reset} style={{ ...menuItem, color: "var(--danger)" }}>Сбросить всё</div>
                        </div>
                    )}
                </div>
                <input ref={fileRef} type="file" accept=".json" onChange={handleImport} style={{ display: "none" }} />
            </div>

            {/* Label editor */}
            <div style={{ marginBottom: 24, textAlign: "center" }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--muted)", marginBottom: 10 }}>Метки характеристик</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 700, margin: "0 auto" }}>
                    {labels.map((l, i) => (
                        <input key={i} value={l}
                               onChange={e => { const n = [...labels]; n[i] = e.target.value; setLabels(n); }}
                               style={{
                                   background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8,
                                   color: "var(--text)", padding: "8px 12px", fontSize: 13, width: 130, textAlign: "center",
                                   fontFamily: "inherit",
                               }} />
                    ))}
                </div>
            </div>

            {/* Character cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, marginBottom: 24 }}>
                {chars.map(c => (
                    <CharacterCard key={c.id} char={c} labels={labels}
                                   onUpdate={updateChar} onDelete={deleteChar} />
                ))}
            </div>

            {/* Comparison */}
            {chars.length >= 2 && (
                <ComparisonSection chars={chars} labels={labels} visible={visible} onToggle={toggleVis} />
            )}

            {/* Footer */}
            <p style={{ textAlign: "center", color: "var(--muted)", fontSize: 12, marginTop: 32, opacity: 0.5 }}>
                Ctrl+Z / Ctrl+Y — отмена/повтор &middot; Ctrl+S — экспорт JSON
            </p>
        </div>
    );
}

const btnStyle = {
    background: "rgba(127,119,221,0.12)", border: "1px solid rgba(127,119,221,0.25)",
    color: "#b0a8f0", padding: "9px 18px", borderRadius: 8, cursor: "pointer",
    fontSize: 13, fontWeight: 600, fontFamily: "inherit", transition: "all 0.2s",
};

const menuItem = {
    padding: "11px 16px", fontSize: 13, color: "var(--text)", cursor: "pointer",
    transition: "background 0.15s",
};