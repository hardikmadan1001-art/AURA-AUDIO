"use client";

import { useEffect, useState } from "react";

/**
 * FinishSwitcher — a sleek floating UI that allows users to toggle between
 * 4 material finishes on the 3D earbuds:
 *   - DLC Obsidian Black (default)
 *   - Raw Forged 6061 Aluminium (Brushed Titanium/Silver)
 *   - Ceramic Alabaster (Gloss White)
 *   - Sapphire Mesh (Micro-perforated acoustic filter)
 *
 * Communicates via finishState global store (consumed by PremiumEarbud).
 */

export type FinishType = "obsidian" | "titanium" | "ceramic" | "sapphire";

/* ------------------------------------------------------------------ */
/* Global finish store — shared mutable, same pattern as scrollState   */
/* ------------------------------------------------------------------ */

export const finishState = {
  current: "obsidian" as FinishType,
  _listeners: new Set<(f: FinishType) => void>(),
  set(f: FinishType) {
    this.current = f;
    this._listeners.forEach((fn) => fn(f));
  },
  subscribe(fn: (f: FinishType) => void) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  },
};

/* ------------------------------------------------------------------ */
/* Finish metadata                                                     */
/* ------------------------------------------------------------------ */

const FINISH_OPTIONS: {
  key: FinishType;
  label: string;
  color: string;
  gradient: string;
}[] = [
  {
    key: "obsidian",
    label: "Obsidian DLC",
    color: "#0b0b0e",
    gradient: "linear-gradient(135deg, #0b0b0e, #2a2c31)",
  },
  {
    key: "titanium",
    label: "Raw Titanium",
    color: "#8e9196",
    gradient: "linear-gradient(135deg, #7a7d82, #b0b4ba)",
  },
  {
    key: "ceramic",
    label: "Ceramic Alabaster",
    color: "#e8ecf0",
    gradient: "linear-gradient(135deg, #d4d8dc, #f0f2f5)",
  },
  {
    key: "sapphire",
    label: "Sapphire Mesh",
    color: "#3a4a5e",
    gradient: "linear-gradient(135deg, #2a3a50, #5a6a7e)",
  },
];

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function FinishSwitcher() {
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState<FinishType>("obsidian");

  useEffect(() => {
    const unsub = finishState.subscribe(setActive);
    return () => { unsub(); };
  }, []);

  useEffect(() => {
    const sceneEl = document.getElementById("scene-final");
    if (!sceneEl) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting && entry.intersectionRatio > 0.2);
      },
      { threshold: [0.2, 0.4, 0.6] }
    );
    observer.observe(sceneEl);
    return () => observer.disconnect();
  }, []);

  const select = (f: FinishType) => {
    setActive(f);
    finishState.set(f);
  };

  if (!visible) return null;

  return (
    <div
      data-hover
      className="fixed bottom-28 left-1/2 z-40 flex -translate-x-1/2 flex-col items-center gap-3 md:bottom-36"
      style={{
        animation: "switcherFadeIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards",
      }}
    >
      <span className="text-[9px] uppercase tracking-[0.4em] text-white/55">
        Material finish
      </span>

      <div className="flex items-center gap-1 rounded-full border border-white/15 bg-black/60 p-1 backdrop-blur-xl">
        {FINISH_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => select(opt.key)}
            data-hover
            className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-[9px] md:text-[10px] uppercase tracking-[0.2em] transition-all duration-300 ${
              active === opt.key
                ? "bg-white/15 text-white shadow-[0_0_12px_rgba(87,230,255,0.15)]"
                : "text-white/55 hover:text-white/80"
            }`}
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{
                background: opt.gradient,
                boxShadow:
                  active === opt.key ? "0 0 6px rgba(87,230,255,0.4)" : "none",
              }}
            />
            <span className="hidden md:inline">{opt.label}</span>
          </button>
        ))}
      </div>

      <style>{`
        @keyframes switcherFadeIn {
          from { opacity: 0; transform: translate(-50%, 12px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
}
