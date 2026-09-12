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
import FinishSwitcher from "@/components/ui/FinishSwitcher";
import ChapterScrubber from "@/components/ui/ChapterScrubber";
import CinemaMode from "@/components/ui/CinemaMode";
import StickyPreOrderBar from "@/components/ui/StickyPreOrderBar";
import PreOrderModal from "@/components/ui/PreOrderModal";
import HUDViewportMode from "@/components/ui/HUDViewportMode";
import { MusicProvider, useMusic } from "@/hooks/useMusic";
import { RadialMusicWheel } from "@/components/ui/RadialMusicWheel";

/**
 * Home — the Aura One interactive film.
 *
 * Layered architecture (back to front):
 *   z-0   WebGL Canvas (the film)
 *   z-1   Ambient noise texture (subtle grain)
 *   z-10  DOM overlay (the screenplay)
 *   z-30  Vignette (CSS)
 *   z-40  HUD elements (scrubber, cinema mode, pre-order bar, music button)
 *   z-55  Scanlines (CSS)
 *   z-56  Film grain (CSS)
 *   z-57  Light streaks (CSS)
 *   z-60  Letterbox bars (CSS)
 *   z-70  Act wipe line
 *   z-100 Custom cursor
 *   z-200 Loader
 *   z-400 Pre-Order Modal
 *   z-500 Music Wheel Overlay
 */

function MusicIntegration() {
  const {
    tracks,
    currentTrack,
    isPlaying,
    closeWheel,
    playTrack,
  } = useMusic();

  const handleSelectTrack = (track: typeof tracks[0]) => {
    playTrack(track);
  };

  return (
    <RadialMusicWheel
      tracks={tracks}
      currentTrack={currentTrack}
      isPlaying={isPlaying}
      onSelectTrack={handleSelectTrack}
      onClose={closeWheel}
    />
  );
}

export default function Home() {
  const [audioReady, setAudioReady] = useState(false);

  // Auto-enable audio on mount (no more XP modal gate)
  useEffect(() => {
    setAudioReady(true);
  }, []);

  return (
    <MusicProvider>
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

        {/* Audio player — enabled immediately */}
        <AudioPlayer enabled={audioReady} />

        {/* GTA-style music wheel overlay */}
        <MusicIntegration />
      </main>
    </MusicProvider>
  );
}
