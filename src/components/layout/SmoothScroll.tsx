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
    };
  }, []);

  return (
    <ReactLenis
      root
      options={{
        lerp: 0.09,
        smoothWheel: true,
        wheelMultiplier: 0.95,
        touchMultiplier: 1.4,
      }}
    >
      {children}
    </ReactLenis>
  );
}
