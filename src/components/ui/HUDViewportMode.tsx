"use client";

import { useEffect, useState, useCallback } from "react";

/**
 * HUDViewportMode — floating toggle in the 3D viewport allowing users to
 * cycle between 3 visual rendering modes:
 *
 * 1. STUDIO PHOTOREAL (default): Deep rim lights, soft shadows, film grain
 * 2. CAD BLUEPRINT / WIREFRAME: Cyan wireframe mesh with gridlines
 * 3. ACOUSTIC THERMAL MAP: False-color pressure heatmap (cyan → violet → amber)
 */

export type ViewportMode = "studio" | "wireframe" | "thermal";

/* ------------------------------------------------------------------ */
/* Global viewport mode store — same pattern as finishState            */
/* ------------------------------------------------------------------ */

export const viewportModeState = {
  current: "studio" as ViewportMode,
  _listeners: new Set<(m: ViewportMode) => void>(),
  set(m: ViewportMode) {
    this.current = m;
    this._listeners.forEach((fn) => fn(m));
  },
  subscribe(fn: (m: ViewportMode) => void) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  },
};

const MODES: { key: ViewportMode; label: string; shortLabel: string }[] = [
  { key: "studio", label: "Studio Photoreal", shortLabel: "STUDIO" },
  { key: "wireframe", label: "CAD Blueprint", shortLabel: "CAD" },
  { key: "thermal", label: "Acoustic Thermal", shortLabel: "THERMAL" },
];

export default function HUDViewportMode() {
  const [active, setActive] = useState<ViewportMode>("studio");
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const unsub = viewportModeState.subscribe(setActive);
    return () => { unsub(); };
  }, []);

  // Show only when product is visible (after reveal)
  useEffect(() => {
    const check = () => {
      // Show after ~50% scroll (past mystery acts)
      setVisible(window.scrollY > window.innerHeight * 8);
    };
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, []);

  const select = useCallback((m: ViewportMode) => {
    setActive(m);
    viewportModeState.set(m);
    setExpanded(false);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed left-6 top-1/2 z-40 -translate-y-1/2 hidden md:block"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Mode indicator / trigger */}
      <button
        data-hover
        onClick={() => setExpanded((x) => !x)}
        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[9px] uppercase tracking-[0.3em] backdrop-blur-xl transition-all duration-300 ${
          expanded
            ? "border-[#57e6ff]/30 bg-black/60"
            : "border-white/15 bg-black/40 hover:border-white/25"
        }`}
      >
        {/* Mode dot */}
        <span
          className={`h-1.5 w-1.5 rounded-full transition-colors ${
            active === "studio"
              ? "bg-white/80"
              : active === "wireframe"
                ? "bg-[#57e6ff]"
                : "bg-[#ffb45e]"
          }`}
        />
        <span className="text-white/65">
          {MODES.find((m) => m.key === active)?.shortLabel ?? "STUDIO"}
        </span>
      </button>

      {/* Expanded mode list */}
      {expanded && (
        <div className="mt-2 glass-panel rounded-lg overflow-hidden">
          {MODES.map((mode) => (
            <button
              key={mode.key}
              data-hover
              onClick={() => select(mode.key)}
              className={`flex items-center gap-3 w-full px-4 py-2.5 text-left transition-all ${
                active === mode.key
                  ? "bg-[#57e6ff]/10 text-[#57e6ff]"
                  : "text-white/55 hover:bg-white/5 hover:text-white/80"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  mode.key === "studio"
                    ? "bg-white/80"
                    : mode.key === "wireframe"
                      ? "bg-[#57e6ff]"
                      : "bg-[#ffb45e]"
                }`}
              />
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em]">{mode.shortLabel}</p>
                <p className="text-[8px] uppercase tracking-[0.15em] text-white/35">{mode.label}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
