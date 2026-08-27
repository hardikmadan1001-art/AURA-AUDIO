"use client";

import { useEffect, useRef, useState } from "react";

/**
 * FinishSwitcher — a sleek floating UI that appears in the final reveal
 * section (Act XIII final scene). It enables the user to toggle between
 * two material finishes on the 3D earbuds:
 *   - DLC Obsidian Black (default)
 *   - Ceramic Gloss Silver
 *
 * The component communicates the selected finish via a global store
 * that PremiumEarbud reads each frame.
 */

export type FinishType = "obsidian" | "silver";

/* ------------------------------------------------------------------ */
/* Global finish store — shared mutable, same pattern as scrollState   */
/* ------------------------------------------------------------------ */

export const finishState = {
  current: "obsidian" as FinishType,
  /** Subscribers register here; called when finish changes. */
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
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function FinishSwitcher() {
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState<FinishType>("obsidian");

  useEffect(() => {
    // Listen for finish changes from other sources (e.g., preset buttons)
    const unsub = finishState.subscribe(setActive);
    return () => { unsub(); };
  }, []);

  useEffect(() => {
    // Observe the final scene to show/hide the switcher
    const sceneEl = document.getElementById("scene-final");
    if (!sceneEl) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting && entry.intersectionRatio > 0.3);
      },
      { threshold: [0.3, 0.5, 0.7] }
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
      <span className="text-[9px] uppercase tracking-[0.4em] text-white/40">
        Material finish
      </span>

      <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/60 p-1 backdrop-blur-xl">
        <button
          onClick={() => select("obsidian")}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-[10px] uppercase tracking-[0.25em] transition-all duration-300 ${
            active === "obsidian"
              ? "bg-white/15 text-white shadow-[0_0_12px_rgba(87,230,255,0.15)]"
              : "text-white/45 hover:text-white/70"
          }`}
        >
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{
              background:
                "linear-gradient(135deg, #0b0b0e, #2a2c31)",
              boxShadow:
                active === "obsidian"
                  ? "0 0 6px rgba(87,230,255,0.4)"
                  : "none",
            }}
          />
          DLC Obsidian
        </button>

        <button
          onClick={() => select("silver")}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-[10px] uppercase tracking-[0.25em] transition-all duration-300 ${
            active === "silver"
              ? "bg-white/15 text-white shadow-[0_0_12px_rgba(87,230,255,0.15)]"
              : "text-white/45 hover:text-white/70"
          }`}
        >
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{
              background:
                "linear-gradient(135deg, #c9ccd4, #e8ecf0)",
              boxShadow:
                active === "silver"
                  ? "0 0 6px rgba(87,230,255,0.4)"
                  : "none",
            }}
          />
          Ceramic Silver
        </button>
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
