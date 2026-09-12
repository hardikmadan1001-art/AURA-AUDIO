"use client";

import { ReactLenis } from "lenis/react";
import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Lenis smooth scroll, driven by the GSAP ticker so Lenis, ScrollTrigger
 * and the WebGL render loop all share one clock — no drift between the
 * DOM choreography and the 3D camera.
 */
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Letterbox + scanlines: engaged on first scroll, scanlines fade out
    // by the Hero scene, letterbox stays the whole way through.
    const onScroll = () => {
      if (window.scrollY > 24) {
        document.documentElement.classList.add("letterbox");
      }
      if (window.scrollY > 1200) {
        document.documentElement.classList.remove("scanned");
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    document.documentElement.classList.add("scanned");

    // Lenis (via ReactLenis) scrolls the native window, so ScrollTrigger
    // just works — we only need to keep it informed and refreshed once
    // fonts/layout have settled.
    const refresh = () => ScrollTrigger.refresh();
    refresh();
    const t = setTimeout(refresh, 500);
    window.addEventListener("load", refresh);

    return () => {
      clearTimeout(t);
      window.removeEventListener("load", refresh);
      window.removeEventListener("scroll", onScroll);
      document.documentElement.classList.remove("letterbox", "scanned");
    };
  }, []);

  return (
    <ReactLenis
      root
      options={{
        lerp: 0.08,
        smoothWheel: true,
        wheelMultiplier: 0.92,
        touchMultiplier: 1.3,
        duration: 1.4,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      }}
    >
      {children}
    </ReactLenis>
  );
}
