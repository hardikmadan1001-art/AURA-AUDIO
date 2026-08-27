"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ACTS } from "@/lib/story";

/**
 * ActWipe — cinematic vertical wipe at every act boundary.
 *
 * The wipe is now dual-line: a leading cyan line with a trailing
 * glow, creating a "cut to next scene" film grammar feel.
 * Easing is cubic-bezier for smooth, organic motion.
 */
export default function ActWipe() {
  const ref = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const el = ref.current;
    const glow = glowRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      // Scene IDs where act transitions happen (first scene of each act)
      const actTransitions = [
        "approach",   // Act III
        "glimpse",    // Act V
        "hero",       // Act VI
        "engineering",// Act VII
        "cell",       // Act VIII
        "resonance",  // Act IX
        "spatial",    // Act X
        "family",     // Act XI
        "assembly",   // Act XII
        "reassembly", // Act XIII
      ];

      const triggers = actTransitions.map((sceneId) => {
        const sceneEl = document.getElementById(`scene-${sceneId}`);
        if (!sceneEl) return null;

        return ScrollTrigger.create({
          trigger: sceneEl,
          start: "top 75%",
          once: true,
          onEnter: () => {
            // Main line wipe — sweep down
            const tl = gsap.timeline();

            tl.fromTo(
              el,
              { scaleY: 0, opacity: 0 },
              {
                scaleY: 1,
                opacity: 1,
                duration: 0.2,
                ease: "power2.in",
              }
            );

            // Glow follows slightly behind
            if (glow) {
              tl.fromTo(
                glow,
                { scaleY: 0, opacity: 0 },
                {
                  scaleY: 1,
                  opacity: 0.6,
                  duration: 0.25,
                  ease: "power2.in",
                },
                0.02
              );
            }

            // Wipe out from bottom
            tl.to(el, {
              scaleY: 0,
              transformOrigin: "bottom",
              opacity: 0,
              duration: 0.3,
              ease: "power3.out",
              delay: 0.05,
            });

            if (glow) {
              tl.to(glow, {
                scaleY: 0,
                transformOrigin: "bottom",
                opacity: 0,
                duration: 0.35,
                ease: "power3.out",
              }, "<0.03");
            }
          },
        });
      });

      return () => triggers.forEach((t) => t?.kill());
    });

    return () => ctx.revert();
  }, []);

  return (
    <>
      {/* Main wipe line */}
      <div ref={ref} aria-hidden className="act-wipe" />
      {/* Glow trail — wider, softer, follows the line */}
      <div
        ref={glowRef}
        aria-hidden
        className="fixed top-0 bottom-0 left-0 z-[69] pointer-events-none"
        style={{
          width: "6px",
          background:
            "linear-gradient(to bottom, transparent, rgba(87, 230, 255, 0.3) 30%, rgba(87, 230, 255, 0.3) 70%, transparent)",
          boxShadow: "0 0 24px rgba(87, 230, 255, 0.4), 0 0 60px rgba(87, 230, 255, 0.15)",
          transform: "scaleY(0)",
          transformOrigin: "top",
        }}
      />
    </>
  );
}
