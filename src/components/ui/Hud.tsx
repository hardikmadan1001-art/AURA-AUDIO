"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const SCENE_COUNT = 9;

/**
 * Fixed HUD: brand mark, scene index, progress rail and live percentage.
 * All updates are written straight to the DOM — zero React re-renders.
 */
export default function Hud() {
  const fill = useRef<HTMLDivElement>(null);
  const pct = useRef<HTMLSpanElement>(null);
  const index = useRef<HTMLSpanElement>(null);
  const name = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: document.documentElement,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          if (fill.current) fill.current.style.transform = `scaleY(${self.progress})`;
          if (pct.current) pct.current.textContent = `${String(Math.round(self.progress * 100)).padStart(2, "0")}%`;
          const i = Math.min(SCENE_COUNT - 1, Math.floor(self.progress * SCENE_COUNT));
          if (index.current) index.current.textContent = `0${i + 1}`;
        },
      });

      gsap.utils.toArray<HTMLElement>("[data-scene]").forEach((section, i) => {
        ScrollTrigger.create({
          trigger: section,
          start: "top 60%",
          end: "bottom 40%",
          onToggle: (self) => {
            if (!self.isActive || !name.current) return;
            name.current.textContent = section.dataset.name ?? "";
            gsap.fromTo(
              name.current.parentElement,
              { opacity: 0, y: 8 },
              { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
            );
            void i;
          },
        });
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <>
      {/* Brand mark */}
      <div className="fixed left-6 top-6 z-40 mix-blend-difference md:left-10 md:top-10">
        <p className="font-display text-lg font-bold uppercase tracking-[0.3em]">
          Aura<span className="align-super text-[9px]">®</span>
        </p>
      </div>

      {/* Ghost menu link */}
      <div className="fixed right-6 top-6 z-40 hidden mix-blend-difference md:right-10 md:top-10 md:block">
        <button data-hover className="text-[11px] uppercase tracking-[0.35em] text-white/70 transition-colors hover:text-white">
          Pre-Order
        </button>
      </div>

      {/* Scene index + name */}
      <div className="fixed bottom-6 left-6 z-40 flex items-center gap-4 mix-blend-difference md:bottom-10 md:left-10">
        <span ref={index} className="font-mono text-xs text-white">01</span>
        <span className="h-px w-8 bg-white/30" />
        <span ref={name} className="text-[11px] uppercase tracking-[0.35em] text-white/80">
          Silence
        </span>
      </div>

      {/* Progress rail */}
      <div className="fixed right-5 top-1/2 z-40 flex -translate-y-1/2 flex-col items-center gap-4 md:right-9">
        <span className="font-mono text-[9px] text-white/40">01</span>
        <div className="relative h-36 w-px overflow-hidden bg-white/15">
          <div
            ref={fill}
            className="absolute inset-x-0 top-0 h-full origin-top bg-white"
            style={{ transform: "scaleY(0)" }}
          />
        </div>
        <span className="font-mono text-[9px] text-white/40">09</span>
      </div>

      {/* Percentage */}
      <div className="fixed bottom-6 right-6 z-40 mix-blend-difference md:bottom-10 md:right-10">
        <span ref={pct} className="font-mono text-xs text-white/70">00%</span>
      </div>
    </>
  );
}
