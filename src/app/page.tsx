"use client";

import { useState, useCallback, useEffect } from "react";
import SmoothScroll from "@/components/layout/SmoothScroll";
import Experience from "@/components/3d/Experience";
import CinematicOverlay from "@/components/ui/CinematicOverlay";
import Hud from "@/components/ui/Hud";
import CustomCursor from "@/components/ui/CustomCursor";
import ActWipe from "@/components/ui/ActWipe";
import AuraLoader from "@/components/ui/AuraLoader";
import AudioPlayer from "@/components/ui/AudioPlayer";
import WinXpModal from "@/components/ui/WinXpModal";
import FinishSwitcher from "@/components/ui/FinishSwitcher";
import ChapterScrubber from "@/components/ui/ChapterScrubber";
import CinemaMode from "@/components/ui/CinemaMode";
import StickyPreOrderBar from "@/components/ui/StickyPreOrderBar";
import PreOrderModal from "@/components/ui/PreOrderModal";
import HUDViewportMode from "@/components/ui/HUDViewportMode";

/**
 * Home — the Aura One interactive film.
 *
 * Layered architecture (back to front):
 *   z-0   WebGL Canvas (the film)
 *   z-1   Ambient noise texture (subtle grain)
 *   z-10  DOM overlay (the screenplay)
 *   z-30  Vignette (CSS)
 *   z-40  HUD elements (scrubber, cinema mode, pre-order bar)
 *   z-55  Scanlines (CSS)
 *   z-56  Film grain (CSS)
 *   z-57  Light streaks (CSS)
 *   z-60  Letterbox bars (CSS)
 *   z-70  Act wipe line
 *   z-100 Custom cursor
 *   z-200 Loader
 *   z-300 XP Modal
 *   z-400 Pre-Order Modal
 */
export default function Home() {
  const [audioReady, setAudioReady] = useState(false);
  const [modalDismissed, setModalDismissed] = useState(false);

  const handleModalDismiss = useCallback(() => {
    setAudioReady(true);
    setTimeout(() => setModalDismissed(true), 100);
  }, []);

  // Lock scroll while modal is open
  useEffect(() => {
    if (!modalDismissed) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [modalDismissed]);

  return (
    <main className="bg-black text-white selection:bg-white selection:text-black">
      <AuraLoader />

      {/* ---- Atmospheric layers ---- */}
      <div className="scanlines" aria-hidden />
      <div className="film-grain" aria-hidden />
      <div className="ambient-noise" aria-hidden />
      <div className="light-streak" aria-hidden />

      <CustomCursor />
      <Hud />

      {/* ---- Navigation & UX ---- */}
      <ChapterScrubber />
      <CinemaMode />
      <HUDViewportMode />

      {/* Fixed WebGL stage — the film */}
      <Experience />

      {/* Scrollable DOM — the screenplay */}
      <SmoothScroll>
        <CinematicOverlay />
      </SmoothScroll>

      <ActWipe />

      {/* ---- Commerce ---- */}
      <StickyPreOrderBar />
      <FinishSwitcher />
      <PreOrderModal />

      {/* Audio player — post-XP-modal */}
      <AudioPlayer enabled={audioReady} />

      {/* Retro XP Modal — gates the experience */}
      {!modalDismissed && <WinXpModal onDismiss={handleModalDismiss} />}
    </main>
  );
}
