"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ACTS } from "@/lib/story";

/**
 * One-shot vertical cyan wipe at the moment each act begins. Reads as
 * "cut to next scene" — light film grammar.
 */
export default function ActWipe() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      // Trigger at every act boundary (the start of the first scene of each act).
      const actStarts = ACTS.slice(0, -1).map((_, i) => {
        const firstSceneOfAct = [
          "overture",
          "approach",
          "glimpse",
          "hero",
          "engineering",
          "cell",
          "spatial",
          "family",
          "reassembly",
        ][i];
        const sceneEl = document.getElementById(`scene-${firstSceneOfAct}`);
        return sceneEl ? ScrollTrigger.create({
          trigger: sceneEl,
          start: "top 80%",
          once: true,
          onEnter: () => {
            gsap.fromTo(
              el,
              { scaleY: 0 },
              {
                scaleY: 1,
                duration: 0.18,
                ease: "power3.in",
                onComplete: () => {
                  gsap.to(el, {
                    scaleY: 0,
                    transformOrigin: "bottom",
                    duration: 0.22,
                    ease: "power3.out",
                    delay: 0.05,
                  });
                },
              }
            );
          },
        }) : null;
      }).filter(Boolean);
      return () => actStarts.forEach((t) => t?.kill());
    });

    return () => ctx.revert();
  }, []);

  return <div ref={ref} aria-hidden className="act-wipe" />;
}
