"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ArrowRight } from "lucide-react";
import { finishState, type FinishType } from "./FinishSwitcher";

/**
 * StickyPreOrderBar — persistent glassmorphic bottom pill.
 *
 * Shows when scrolling between Act II and Act XI (product visible).
 * Hidden during mystery acts (I-V) and finale (XII).
 * Displays dynamic finish badge from finishState.
 */

const FINISH_BADGES: Record<FinishType, { label: string; color: string }> = {
  obsidian: { label: "Obsidian DLC", color: "#0b0b0e" },
  titanium: { label: "Raw Titanium", color: "#8e9196" },
  ceramic: { label: "Ceramic Alabaster", color: "#e8ecf0" },
  sapphire: { label: "Sapphire Mesh", color: "#3a4a5e" },
};

export default function StickyPreOrderBar() {
  const [visible, setVisible] = useState(false);
  const [finish, setFinish] = useState<FinishType>(finishState.current);
  const [opacity, setOpacity] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);

  const onReserve = useCallback(() => {
    window.dispatchEvent(new CustomEvent("aura:open-preorder"));
  }, []);

  // Track finish state
  useEffect(() => {
    const unsub = finishState.subscribe(setFinish);
    return () => { unsub(); };
  }, []);

  // Show/hide based on scroll position
  useEffect(() => {
    const checkScroll = () => {
      const p = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      // Show between ~8% (after mystery acts) and ~92% (before finale)
      setVisible(p > 0.08 && p < 0.92);
    };
    window.addEventListener("scroll", checkScroll, { passive: true });
    checkScroll();
    return () => window.removeEventListener("scroll", checkScroll);
  }, []);

  // Animate opacity
  useEffect(() => {
    gsap.to({ val: opacity }, {
      val: visible ? 1 : 0,
      duration: visible ? 0.6 : 0.4,
      ease: visible ? "power2.out" : "power2.in",
      onUpdate: function () {
        setOpacity(this.targets()[0].val);
      },
    });
  }, [visible]);

  const badge = FINISH_BADGES[finish];

  return (
    <div
      ref={barRef}
      className="fixed bottom-0 left-0 right-0 z-40 flex justify-center px-4 pb-4 md:pb-6 pointer-events-none"
      style={{ opacity, transform: `translateY(${(1 - opacity) * 20}px)` }}
    >
      <div
        data-hover
        className="pointer-events-auto glass-panel flex items-center gap-3 md:gap-5 rounded-full border border-white/10 px-4 py-2.5 md:px-6 md:py-3 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
      >
        {/* Product name */}
        <div className="flex items-center gap-2">
          <span className="font-display text-xs md:text-sm font-bold uppercase tracking-wider">
            AURA One
          </span>
          <span className="hidden md:inline text-white/30">·</span>
          <span className="hidden md:inline text-[10px] uppercase tracking-[0.25em] text-white/55">
            Spring 2027
          </span>
        </div>

        {/* Divider */}
        <div className="h-4 w-px bg-white/15" />

        {/* Price */}
        <span className="font-mono text-sm md:text-base text-white/80">$349</span>

        {/* Finish badge — dynamic */}
        <div className="hidden md:flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 transition-all duration-500">
          <span
            className="inline-block h-1.5 w-1.5 rounded-full ring-1 ring-white/20 transition-colors duration-500"
            style={{ backgroundColor: badge.color }}
          />
          <span className="text-[9px] uppercase tracking-[0.2em] text-white/55 transition-colors duration-500">
            {badge.label}
          </span>
        </div>

        {/* Divider */}
        <div className="hidden md:block h-4 w-px bg-white/15" />

        {/* CTA */}
        <button
          onClick={onReserve}
          className="flex items-center gap-1.5 rounded-full bg-[#57e6ff]/10 border border-[#57e6ff]/25 px-3 py-1.5 md:px-4 md:py-2 text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-[#57e6ff] transition-all hover:bg-[#57e6ff]/20 hover:border-[#57e6ff]/40 hover:shadow-[0_0_20px_rgba(87,230,255,0.15)]"
        >
          Reserve — $50
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
