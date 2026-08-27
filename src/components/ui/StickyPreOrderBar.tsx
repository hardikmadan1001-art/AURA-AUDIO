"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";

/**
 * StickyPreOrderBar — persistent glassmorphic bottom pill that fades in
 * when the user scrolls past the hero section.
 *
 * Contains:
 * - Product name + price
 * - Finish indicator (reads from finishState)
 * - "Reserve Now" CTA
 */

export default function StickyPreOrderBar() {
  const [visible, setVisible] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);
  const onReserve = useCallback(() => {
    // Dispatch a custom event that PreOrderModal listens for
    window.dispatchEvent(new CustomEvent("aura:open-preorder"));
  }, []);

  useEffect(() => {
    // Show after scrolling past ~80% of the first act
    const trigger = ScrollTrigger.create({
      trigger: document.documentElement,
      start: "15% top",
      end: "85% top",
      onEnter: () => setVisible(true),
      onLeaveBack: () => setVisible(false),
    });

    return () => trigger.kill();
  }, []);

  useEffect(() => {
    if (visible) {
      gsap.to({ val: opacity }, {
        val: 1,
        duration: 0.6,
        ease: "power2.out",
        onUpdate: function () {
          setOpacity(this.targets()[0].val);
        },
      });
    } else {
      gsap.to({ val: opacity }, {
        val: 0,
        duration: 0.4,
        ease: "power2.in",
        onUpdate: function () {
          setOpacity(this.targets()[0].val);
        },
      });
    }
  }, [visible]);

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
            Reference Series
          </span>
        </div>

        {/* Divider */}
        <div className="h-4 w-px bg-white/15" />

        {/* Price */}
        <span className="font-mono text-sm md:text-base text-white/80">$349</span>

        {/* Finish badge */}
        <div className="hidden md:flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#0b0b0e] ring-1 ring-white/20" />
          <span className="text-[9px] uppercase tracking-[0.2em] text-white/55">Obsidian DLC</span>
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
