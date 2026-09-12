"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SCENES, ACTS, sceneStart } from "@/lib/story";

/**
 * ChapterScrubber — replaces the static notch bar with an interactive,
 * scrubbable chapter navigation track.
 *
 * Features:
 * - Click any act notch to smoothly scroll to that scene
 * - Hover tooltip reveals act title + scene name
 * - Active act highlighted with cyan accent
 * - Smooth GSAP scroll-to on click
 */

type ActInfo = {
  act: number;
  label: string;
  title: string;
  position: number; // 0..1 on the progress rail
  sceneId: string;
};

export default function ChapterScrubber() {
  const fillRef = useRef<HTMLDivElement>(null);
  const [hoveredAct, setHoveredAct] = useState<number | null>(null);
  const [activeAct, setActiveAct] = useState(1);

  // Compute act positions on the timeline
  const acts = (() => {
    const map = new Map<number, ActInfo>();
    let acc = 0;
    for (const scene of SCENES) {
      acc += scene.vh;
      if (!map.has(scene.act)) {
        map.set(scene.act, {
          act: scene.act,
          label: `ACT ${ACTS[scene.act - 1]?.n ?? scene.act}`,
          title: ACTS[scene.act - 1]?.title ?? scene.name,
          position: (acc - scene.vh / 2) / (acc + SCENES.slice(SCENES.indexOf(scene) + 1).reduce((s, sc) => s + sc.vh, 0)),
          sceneId: scene.id,
        });
      }
    }
    // Recalculate positions using total
    const totalVh = SCENES.reduce((s, sc) => s + sc.vh, 0);
    let cumulative = 0;
    const result: ActInfo[] = [];
    const seen = new Set<number>();
    for (const scene of SCENES) {
      cumulative += scene.vh;
      if (!seen.has(scene.act)) {
        seen.add(scene.act);
        result.push({
          act: scene.act,
          label: `ACT ${ACTS[scene.act - 1]?.n ?? scene.act}`,
          title: ACTS[scene.act - 1]?.title ?? scene.name,
          position: cumulative / totalVh,
          sceneId: scene.id,
        });
      }
    }
    return result;
  })();

  const scrollToScene = useCallback((sceneId: string) => {
    const el = document.getElementById(`scene-${sceneId}`);
    if (el) {
      gsap.to(window, {
        duration: 1.4,
        scrollTo: { y: el, offsetY: 0 },
        ease: "power3.inOut",
      });
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Dynamically import ScrollToPlugin
    import("gsap/ScrollToPlugin").then(({ ScrollToPlugin }) => {
      gsap.registerPlugin(ScrollToPlugin);
    });
  }, []);

  useEffect(() => {
    const totalVh = SCENES.reduce((s, sc) => s + sc.vh, 0);
    let cumulative = 0;

    const triggers: ScrollTrigger[] = [];
    const seen = new Set<number>();

    for (const scene of SCENES) {
      cumulative += scene.vh;
      if (!seen.has(scene.act)) {
        seen.add(scene.act);
        const section = document.getElementById(`scene-${scene.id}`);
        if (!section) continue;
        const trigger = ScrollTrigger.create({
          trigger: section,
          start: "top center",
          end: "bottom center",
          onEnter: () => setActiveAct(scene.act),
          onEnterBack: () => setActiveAct(scene.act),
        });
        triggers.push(trigger);
      }
    }

    return () => triggers.forEach((t) => t.kill());
  }, []);

  // Update fill bar
  useEffect(() => {
    if (!fillRef.current) return;
    const p = activeAct / acts.length;
    gsap.to(fillRef.current, {
      scaleY: p,
      duration: 0.6,
      ease: "power2.out",
    });
  }, [activeAct, acts.length]);

  return (
    <div className="fixed right-4 top-1/2 z-40 -translate-y-1/2 hidden md:flex flex-col items-center">
      {/* Percentage */}
      <span className="font-mono text-[9px] text-white/45 mb-2">01</span>

      {/* Progress rail */}
      <div className="relative h-48 w-px bg-white/15">
        <div
          ref={fillRef}
          className="absolute inset-x-0 top-0 h-full origin-top bg-gradient-to-b from-[#57e6ff] to-[#57e6ff]/30"
          style={{ transform: "scaleY(0)" }}
        />

        {/* Act notches */}
        {acts.map((actInfo) => (
          <button
            key={actInfo.act}
            data-hover
            onClick={() => scrollToScene(actInfo.sceneId)}
            onMouseEnter={() => setHoveredAct(actInfo.act)}
            onMouseLeave={() => setHoveredAct(null)}
            className="absolute -left-2 group"
            style={{ top: `${actInfo.position * 100}%` }}
            aria-label={`${actInfo.label}: ${actInfo.title}`}
          >
            {/* Notch line */}
            <div
              className={`h-px transition-all duration-300 ${
                activeAct === actInfo.act
                  ? "w-5 bg-[#57e6ff] shadow-[0_0_8px_rgba(87,230,255,0.5)]"
                  : "w-3 bg-white/40 group-hover:w-4 group-hover:bg-white/70"
              }`}
            />

            {/* Hover tooltip */}
            <div
              className={`absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap transition-all duration-300 ${
                hoveredAct === actInfo.act
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 translate-x-2 pointer-events-none"
              }`}
            >
              <div className="glass-panel rounded-md px-3 py-1.5 text-[10px]">
                <span className="font-mono text-[#57e6ff]/90">{actInfo.label}</span>
                <span className="mx-1.5 text-white/30">·</span>
                <span className="text-white/70">{actInfo.title}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Total scene count */}
      <span className="font-mono text-[9px] text-white/45 mt-2">
        {String(acts.length).padStart(2, "0")}
      </span>
    </div>
  );
}
