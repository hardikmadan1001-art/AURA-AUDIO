"use client";

import { useEffect, useState } from "react";

/**
 * First-paint loader — the first thing the user sees.
 *
 * Now features a pulsing cyan glow, refined typography,
 * and a smooth fade-out that dissolves into the CRT boot screen.
 */
export default function AuraLoader() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const finish = () => {
      // Smooth fade-out with a slight delay so the Canvas has time to initialize
      setTimeout(() => setHidden(true), 500);
    };
    if (document.readyState === "complete") {
      finish();
    } else {
      window.addEventListener("load", finish, { once: true });
      const t = setTimeout(finish, 3000);
      return () => {
        clearTimeout(t);
        window.removeEventListener("load", finish);
      };
    }
  }, []);

  return (
    <div
      aria-hidden={hidden}
      className={`aura-loader ${hidden ? "hidden" : ""}`}
    >
      {/* Ambient glow behind the logo */}
      <div
        className="pointer-events-none absolute h-[40vh] w-[40vh] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(87, 230, 255, 0.08) 0%, transparent 70%)",
          animation: "breathe 4s ease-in-out infinite",
        }}
      />

      <div className="flex flex-col items-center gap-5">
        <p
          className="font-display text-sm font-bold uppercase tracking-[0.5em] text-white/80"
          style={{
            textShadow: "0 0 30px rgba(87, 230, 255, 0.3)",
          }}
        >
          Aura
        </p>
        <div className="aura-loader-bar" />
        <p className="text-[9px] uppercase tracking-[0.4em] text-white/25">
          Preparing experience
        </p>
      </div>
    </div>
  );
}
