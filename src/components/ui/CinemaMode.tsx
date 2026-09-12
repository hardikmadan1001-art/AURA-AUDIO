"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SCENES } from "@/lib/story";
import { Play, Pause, SkipForward } from "lucide-react";

/**
 * CinemaMode — auto-scrolling narrative playback.
 *
 * Adds a "Play Film" button that smoothly auto-advances the scrollytelling
 * experience at a curated cinematic pace. User can pause at any time.
 *
 * Keyboard binds:
 *   Space → play/pause
 *   → (arrow right) → skip to next scene
 *   ← (arrow left) → skip to previous scene
 */

const CINEMATIC_SPEED = 0.12; // vh per frame at 60fps → smooth cinematic pace
const SKIP_DURATION = 1.2;

export default function CinemaMode() {
  const [playing, setPlaying] = useState(false);
  const [visible, setVisible] = useState(false);
  const rafRef = useRef<number | null>(null);
  const speedRef = useRef(CINEMATIC_SPEED);

  // Show cinema mode button only after scrolling past the hero
  useEffect(() => {
    const checkScroll = () => {
      setVisible(window.scrollY > window.innerHeight * 0.5);
    };
    window.addEventListener("scroll", checkScroll, { passive: true });
    return () => window.removeEventListener("scroll", checkScroll);
  }, []);

  // Auto-scroll animation loop
  useEffect(() => {
    if (!playing) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const tick = () => {
      // Advance scroll by speed per frame
      window.scrollBy(0, speedRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [playing]);

  const togglePlay = useCallback(() => {
    setPlaying((prev) => !prev);
  }, []);

  const skipToNext = useCallback(() => {
    const currentScroll = window.scrollY;
    const vh = window.innerHeight;
    const totalVh = SCENES.reduce((s, sc) => s + sc.vh, 0);

    // Find current scene based on scroll position
    let acc = 0;
    for (const scene of SCENES) {
      acc += scene.vh;
      const sceneTop = (acc - scene.vh) / totalVh * document.documentElement.scrollHeight;
      const sceneBottom = acc / totalVh * document.documentElement.scrollHeight;
      if (currentScroll >= sceneTop && currentScroll < sceneBottom) {
        // Scroll to the next scene
        const nextScene = SCENES[SCENES.indexOf(scene) + 1];
        if (nextScene) {
          const nextEl = document.getElementById(`scene-${nextScene.id}`);
          if (nextEl) {
            gsap.to(window, {
              duration: SKIP_DURATION,
              scrollTo: { y: nextEl, offsetY: 0 },
              ease: "power3.inOut",
            });
          }
        }
        break;
      }
    }
  }, []);

  const skipToPrev = useCallback(() => {
    const currentScroll = window.scrollY;
    const totalVh = SCENES.reduce((s, sc) => s + sc.vh, 0);

    let acc = 0;
    for (const scene of SCENES) {
      acc += scene.vh;
      const sceneTop = (acc - scene.vh) / totalVh * document.documentElement.scrollHeight;
      const sceneBottom = acc / totalVh * document.documentElement.scrollHeight;
      if (currentScroll >= sceneTop && currentScroll < sceneBottom) {
        const prevScene = SCENES[SCENES.indexOf(scene) - 1];
        if (prevScene) {
          const prevEl = document.getElementById(`scene-${prevScene.id}`);
          if (prevEl) {
            gsap.to(window, {
              duration: SKIP_DURATION,
              scrollTo: { y: prevEl, offsetY: 0 },
              ease: "power3.inOut",
            });
          }
        }
        break;
      }
    }
  }, []);

  // Keyboard binds
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in inputs
      if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowRight":
          e.preventDefault();
          skipToNext();
          break;
        case "ArrowLeft":
          e.preventDefault();
          skipToPrev();
          break;
        case "ArrowUp":
          e.preventDefault();
          skipToPrev();
          break;
        case "ArrowDown":
          e.preventDefault();
          skipToNext();
          break;
        case "PageDown":
          e.preventDefault();
          skipToNext();
          break;
        case "PageUp":
          e.preventDefault();
          skipToPrev();
          break;
        case "Home":
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
          break;
        case "End":
          e.preventDefault();
          window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [togglePlay, skipToNext, skipToPrev]);

  // Pause on user scroll (manual scroll cancels cinema mode)
  useEffect(() => {
    if (!playing) return;

    let lastScroll = window.scrollY;
    const onScroll = () => {
      const delta = Math.abs(window.scrollY - lastScroll);
      // If user scrolled more than 50px manually, pause
      if (delta > 50) {
        setPlaying(false);
      }
      lastScroll = window.scrollY;
    };

    // Debounce: don't trigger on our own scroll
    const timeout = setTimeout(() => {
      window.addEventListener("scroll", onScroll, { passive: true });
    }, 500);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("scroll", onScroll);
    };
  }, [playing]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-6 z-40 flex items-center gap-2 md:bottom-10 md:left-10">
      <button
        data-hover
        onClick={togglePlay}
        className={`flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] uppercase tracking-[0.3em] backdrop-blur-xl transition-all duration-500 ${
          playing
            ? "border-[#57e6ff]/40 bg-[#57e6ff]/10 text-[#57e6ff] shadow-[0_0_20px_rgba(87,230,255,0.15)]"
            : "border-white/20 bg-black/50 text-white/65 hover:border-white/40 hover:text-white/90"
        }`}
        aria-label={playing ? "Pause film" : "Play film"}
      >
        {playing ? (
          <Pause className="h-3 w-3" fill="currentColor" />
        ) : (
          <Play className="h-3 w-3" fill="currentColor" />
        )}
        {playing ? "Pause Film" : "Play Film"}
      </button>

      {/* Skip buttons — shown when playing */}
      <button
        data-hover
        onClick={skipToNext}
        className={`flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/50 backdrop-blur-sm transition-all hover:border-white/30 hover:text-white/80 ${
          playing ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-label="Skip to next scene"
      >
        <SkipForward className="h-3 w-3" />
      </button>
    </div>
  );
}
