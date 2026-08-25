"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

/**
 * Two-part cursor: a precise dot and a lagging ring that swells over
 * interactive targets ([data-hover]). Rendered only on fine pointers.
 */
export default function CustomCursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    setEnabled(true);
    document.documentElement.classList.add("no-native-cursor");

    const setX = (el: HTMLElement, x: number) => gsap.quickSetter(el, "x", "px")(x);
    const dotX = gsap.quickSetter(dot.current, "x", "px");
    const dotY = gsap.quickSetter(dot.current, "y", "px");

    const onMove = (e: MouseEvent) => {
      dotX(e.clientX);
      dotY(e.clientY);
      gsap.to(ring.current, { x: e.clientX, y: e.clientY, duration: 0.45, ease: "power3.out" });
    };

    const onOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("[data-hover]");
      gsap.to(ring.current, {
        scale: target ? 2.2 : 1,
        opacity: target ? 0.9 : 0.5,
        duration: 0.35,
        ease: "power3.out",
      });
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver, { passive: true });
    return () => {
      document.documentElement.classList.remove("no-native-cursor");
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      void setX;
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={dot}
        className="pointer-events-none fixed left-0 top-0 z-[100] h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white mix-blend-difference"
        style={{ marginLeft: -3, marginTop: -3 }}
      />
      <div
        ref={ring}
        className="pointer-events-none fixed left-0 top-0 z-[99] h-9 w-9 rounded-full border border-white/60 opacity-50 mix-blend-difference"
        style={{ marginLeft: -18, marginTop: -18 }}
      />
    </>
  );
}
