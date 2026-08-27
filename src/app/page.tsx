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

/**
 * Home — the Aura One interactive film.
 *
 * The XP modal gates the experience: while it is open, scroll is locked
 * and the 3D stage sits behind a dark veil. Dismissing the modal
 * synthesizes a startup chime, resumes the audio context, and fades
 * into the luxury dark-mode Act I scene.
 */
export default function Home() {
  const [audioReady, setAudioReady] = useState(false);
  const [modalDismissed, setModalDismissed] = useState(false);

  const handleModalDismiss = useCallback(() => {
    setAudioReady(true);
    // Short delay so the CRT animation finishes before unlocking scroll
    setTimeout(() => setModalDismissed(true), 100);
  }, []);

  // Unlock scroll once modal is dismissed
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

      {/* Scanlines — the engineering aesthetic, fades once past Act I */}
      <div className="scanlines" aria-hidden />

      <CustomCursor />
      <Hud />

      {/* Fixed WebGL stage — the film. Never scrolls itself. */}
      <Experience />

      {/* Scrollable DOM — the screenplay driving the film. */}
      <SmoothScroll>
        <CinematicOverlay />
      </SmoothScroll>

      <ActWipe />

      {/* Audio player — always present, handles enable/toggle/mute */}
      <AudioPlayer enabled={audioReady} />

      {/* Finish switcher — appears at the final reveal section */}
      <FinishSwitcher />

      {/* Retro XP Modal — the competition centrepiece */}
      {!modalDismissed && <WinXpModal onDismiss={handleModalDismiss} />}
    </main>
  );
}
