"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SCENES, ACTS } from "@/lib/story";

/**
 * Fixed HUD: brand mark, act + scene index, progress rail, live percentage.
 * All updates are written straight to the DOM — zero React re-renders.
 */
export default function Hud() {
  const pct = useRef<HTMLSpanElement>(null);
  const index = useRef<HTMLSpanElement>(null);
  const name = useRef<HTMLSpanElement>(null);
  const act = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: document.documentElement,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          if (pct.current) pct.current.textContent = `${Math.round(self.progress * 100)
            .toString()
            .padStart(2, "0")}%`;
        },
      });

      // Per-scene triggers keep index / name / act in lockstep with the DOM.
      SCENES.forEach((scene, i) => {
        const section = document.getElementById(`scene-${scene.id}`);
        if (!section) return;
        ScrollTrigger.create({
          trigger: section,
          start: "top 60%",
          end: "bottom 40%",
          onToggle: (self) => {
            if (!self.isActive) return;
            if (index.current)
              index.current.textContent = String(i + 1).padStart(2, "0");
            if (name.current) name.current.textContent = scene.name;
            if (act.current)
              act.current.textContent = `ACT ${ACTS[scene.act - 1].n}`;
            const nameEl = name.current?.parentElement;
            if (nameEl) {
              gsap.fromTo(
                nameEl,
                { opacity: 0, y: 8 },
                { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
              );
            }
          },
        });
      });
    });
    return () => ctx.revert();
  }, []);

  const scrollToFinal = () => {
    const el = document.getElementById("scene-final");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {/* Brand mark (clickable — back to top) */}
      <button
        onClick={scrollToTop}
        aria-label="Back to top"
        className="fixed left-6 top-6 z-40 mix-blend-difference md:left-10 md:top-10"
      >
        <p className="font-display text-lg font-bold uppercase tracking-[0.3em]">
          Aura<span className="align-super text-[9px]">®</span>
        </p>
      </button>

      {/* Pre-Order button — wired to final scene */}
      <div className="fixed right-6 top-6 z-40 hidden md:right-10 md:top-10 md:block">
        <button
          data-hover
          onClick={scrollToFinal}
          className="rounded-full border border-white/30 px-4 py-2 text-[11px] uppercase tracking-[0.35em] text-white/80 backdrop-blur-sm transition-colors hover:border-[#57e6ff] hover:text-[#57e6ff]"
        >
          Pre-Order
        </button>
      </div>

      {/* Act + scene index + name */}
      <div className="fixed bottom-6 left-6 z-40 flex items-center gap-4 mix-blend-difference md:bottom-10 md:left-10">
        <span ref={act} className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#57e6ff]/90">
          ACT I
        </span>
        <span ref={index} className="font-mono text-xs text-white">01</span>
        <span className="h-px w-8 bg-white/30" />
        <span ref={name} className="text-[11px] uppercase tracking-[0.35em] text-white/80">
          Overture
        </span>
      </div>

      {/* Percentage — shown below the ChapterScrubber rail */}
      <div className="fixed bottom-20 right-6 z-40 mix-blend-difference md:bottom-24 md:right-10">
        <span ref={pct} className="font-mono text-xs text-white/70">00%</span>
      </div>
    </>
  );
}
