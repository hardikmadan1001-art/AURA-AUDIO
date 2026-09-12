"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

/**
 * Premium custom cursor — two-part system:
 *   1. A precise dot that follows the pointer with spring physics
 *   2. A lagging glow ring that swells and pulses over interactive targets
 *
 * The cursor adds a layer of tactile precision that communicates
 * "this is a premium, engineered experience."
 */
export default function CustomCursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const glow = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const enableRaf = requestAnimationFrame(() => setEnabled(true));
    document.documentElement.classList.add("no-native-cursor");

    let mouseX = 0;
    let mouseY = 0;
    let isHovering = false;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      // Dot follows instantly with slight spring
      gsap.to(dot.current, {
        x: mouseX,
        y: mouseY,
        duration: 0.15,
        ease: "power2.out",
      });
    };

    const onOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("[data-hover]");
      const newHovering = !!target;
      if (newHovering === isHovering) return;
      isHovering = newHovering;

      // Ring swells on hover targets
      gsap.to(ring.current, {
        scale: isHovering ? 2.5 : 1,
        opacity: isHovering ? 0.85 : 0.4,
        borderColor: isHovering
          ? "rgba(87, 230, 255, 0.7)"
          : "rgba(255, 255, 255, 0.5)",
        duration: 0.5,
        ease: "power3.out",
      });

      // Glow appears on hover
      gsap.to(glow.current, {
        scale: isHovering ? 1.8 : 0,
        opacity: isHovering ? 0.3 : 0,
        duration: 0.6,
        ease: "power3.out",
      });
    };

    // Smooth ring following — the "operator hand" feel
    const tick = () => {
      gsap.to(ring.current, {
        x: mouseX,
        y: mouseY,
        duration: 0.6,
        ease: "power3.out",
      });
      gsap.to(glow.current, {
        x: mouseX,
        y: mouseY,
        duration: 0.8,
        ease: "power3.out",
      });
    };

    const ticker = gsap.ticker;
    ticker.add(tick);

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver, { passive: true });

    return () => {
      cancelAnimationFrame(enableRaf);
      document.documentElement.classList.remove("no-native-cursor");
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      ticker.remove(tick);
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      {/* Precise dot — follows instantly */}
      <div
        ref={dot}
        className="pointer-events-none fixed left-0 top-0 z-[100]"
        style={{
          width: "5px",
          height: "5px",
          borderRadius: "50%",
          background: "white",
          mixBlendMode: "difference",
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* Glow ring — lags behind, swells on targets */}
      <div
        ref={ring}
        className="pointer-events-none fixed left-0 top-0 z-[99]"
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          border: "1.5px solid rgba(255, 255, 255, 0.5)",
          opacity: 0.4,
          mixBlendMode: "difference",
          transform: "translate(-50%, -50%)",
          transition: "border-color 0.4s ease",
        }}
      />

      {/* Ambient glow — appears on hover targets */}
      <div
        ref={glow}
        className="pointer-events-none fixed left-0 top-0 z-[98]"
        style={{
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(87, 230, 255, 0.25) 0%, transparent 70%)",
          opacity: 0,
          transform: "translate(-50%, -50%)",
        }}
      />
    </>
  );
}
