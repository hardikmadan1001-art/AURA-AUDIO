"use client";

import { useEffect, useState } from "react";

/**
 * First-paint loader. Shown until window.load fires plus a beat, so the
 * WebGL canvas never paints under a half-loaded UI.
 */
export default function AuraLoader() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const finish = () => {
      // Wait one tick so the Canvas has a chance to lay out first.
      setTimeout(() => setHidden(true), 350);
    };
    if (document.readyState === "complete") {
      finish();
    } else {
      window.addEventListener("load", finish, { once: true });
      // Hard cap — never block longer than 2.5s even if fonts hang.
      const t = setTimeout(finish, 2500);
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
      <div className="flex flex-col items-center gap-5">
        <p className="font-display text-sm font-bold uppercase tracking-[0.5em] text-white/80">
          Aura
        </p>
        <div className="aura-loader-bar" />
      </div>
    </div>
  );
}
