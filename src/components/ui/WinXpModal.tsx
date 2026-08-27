"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * WinXpModal — a retro Windows XP-style .exe popup that serves as the
 * first interaction, unlocking the Web Audio context with a synthesized
 * startup chime. The window is draggable, has working minimize/close
 * controls, and exits with a CRT scanline glitch dissolve.
 *
 * Competes the "EXPERIENCE WITH AUDIO" retro entry point.
 */

type Props = {
  onDismiss: () => void;
};

/* ------------------------------------------------------------------ */
/* Synthesized retro startup chime                                     */
/* ------------------------------------------------------------------ */

function playStartupChime() {
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new AC();
    const master = ctx.createGain();
    master.gain.value = 0.35;
    master.connect(ctx.destination);

    const now = ctx.currentTime;

    // Chord: C5 + E5 + G5 + C6 — bright major arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.5];
    const delays = [0, 0.06, 0.12, 0.18];

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;

      // Slight detune for warmth
      osc.detune.value = (i - 1.5) * 3;

      const t = now + delays[i];
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.22, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);

      osc.connect(gain).connect(master);
      osc.start(t);
      osc.stop(t + 1.5);
    });

    // Sub-harmonic thud for body
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = "sine";
    sub.frequency.value = 130.81;
    subGain.gain.setValueAtTime(0, now);
    subGain.gain.linearRampToValueAtTime(0.3, now + 0.01);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    sub.connect(subGain).connect(master);
    sub.start(now);
    sub.stop(now + 0.7);
  } catch {
    // Silent fallback — chime is decoration, not a dependency
  }
}

/* ------------------------------------------------------------------ */
/* Draggable hook                                                      */
/* ------------------------------------------------------------------ */

function useDraggable(
  ref: React.RefObject<HTMLDivElement | null>,
  handleRef: React.RefObject<HTMLDivElement | null>,
) {
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handle = handleRef.current;
    const el = ref.current;
    if (!handle || !el) return;

    const onDown = (e: MouseEvent | TouchEvent) => {
      dragging.current = true;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const rect = el.getBoundingClientRect();
      offset.current = { x: clientX - rect.left, y: clientY - rect.top };
      el.style.transition = "none";
    };

    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging.current) return;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      el.style.left = `${clientX - offset.current.x}px`;
      el.style.top = `${clientY - offset.current.y}px`;
      el.style.transform = "none";
    };

    const onUp = () => {
      dragging.current = false;
      if (el) el.style.transition = "";
    };

    handle.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    handle.addEventListener("touchstart", onDown, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onUp);

    return () => {
      handle.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      handle.removeEventListener("touchstart", onDown);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [ref, handleRef]);
}

/* ------------------------------------------------------------------ */
/* The Component                                                       */
/* ------------------------------------------------------------------ */

export default function WinXpModal({ onDismiss }: Props) {
  const [phase, setPhase] = useState<"open" | "closing" | "done">("open");
  const [minimized, setMinimized] = useState(false);
  const winRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  useDraggable(winRef, handleRef);

  const dismiss = useCallback(() => {
    playStartupChime();
    setPhase("closing");
    // Allow the CRT animation to play, then signal parent
    setTimeout(() => {
      setPhase("done");
      onDismiss();
    }, 900);
  }, [onDismiss]);

  // Keyboard fallbacks: Enter / Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "Escape") {
        e.preventDefault();
        dismiss();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dismiss]);

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (phase === "done") return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm"
        onClick={dismiss}
        aria-hidden
      />

      {/* CRT exit overlay — animated when closing */}
      {phase === "closing" && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[400]"
          style={{
            background:
              "repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 3px)",
            animation: "crtGlitch 0.9s ease-out forwards",
          }}
        />
      )}

      {/* XP Window */}
      {!minimized && (
        <div
          ref={winRef}
          className="fixed left-1/2 top-1/2 z-[310] w-[92vw] max-w-[440px] select-none"
          style={{
            transform: "translate(-50%, -50%)",
            filter:
              phase === "closing"
                ? "brightness(2) saturate(0) contrast(2)"
                : undefined,
            animation:
              phase === "closing"
                ? "xpClose 0.9s ease-in forwards"
                : "xpOpen 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards",
          }}
        >
          {/* Title bar */}
          <div
            ref={handleRef}
            className="flex cursor-grab items-center rounded-t-lg bg-gradient-to-b from-[#0054E3] via-[#0054D0] to-[#003C99] px-2 py-1 active:cursor-grabbing"
          >
            {/* Icon */}
            <div className="mr-2 flex h-4 w-4 items-center justify-center rounded-sm bg-[#FFD700]/80">
              <span className="text-[8px] font-black text-[#003C99]">A</span>
            </div>
            <span className="flex-1 truncate text-[11px] font-bold text-white drop-shadow-sm">
              AURA_AUDIO_EXPERIENCE.exe
            </span>
            <div className="flex gap-0.5">
              <button
                aria-label="Minimize"
                onClick={() => setMinimized(true)}
                className="flex h-5 w-5 items-center justify-center rounded-sm border border-white/30 bg-gradient-to-b from-[#3C7FDE] to-[#2461C0] text-[10px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] hover:brightness-110 active:from-[#1A4FA0] active:to-[#1A4FA0]"
              >
                _
              </button>
              <button
                aria-label="Close"
                onClick={dismiss}
                className="flex h-5 w-5 items-center justify-center rounded-sm border border-white/30 bg-gradient-to-b from-[#E9775C] to-[#C04030] text-[10px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] hover:brightness-110 active:from-[#9C2A18] active:to-[#9C2A18]"
              >
                ×
              </button>
            </div>
          </div>

          {/* Window body */}
          <div className="rounded-b-lg border border-t-0 border-[#0054E3]/50 bg-[#ECE9D8] p-5">
            <div className="flex gap-4">
              {/* System icon */}
              <div className="hidden flex-shrink-0 sm:block">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-[#A0A0A0]/50 bg-gradient-to-br from-[#FFE066] to-[#E6A800] shadow-inner">
                  <span className="text-xl">🔊</span>
                </div>
              </div>

              <div className="flex-1">
                <p className="mb-1 font-bold text-[#003399]">
                  AURA Audio Experience
                </p>
                <p className="mb-4 text-[12px] leading-[1.6] text-[#333]">
                  This experience includes immersive spatial audio, ambient
                  soundscapes, and low-frequency sweeps designed to accompany
                  the visual journey.
                </p>
                <p className="mb-5 text-[11px] text-[#666]">
                  Click <b>OK</b> to enable audio and begin the experience.
                </p>

                {/* Buttons row */}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={dismiss}
                    className="rounded border border-[#003399]/50 bg-gradient-to-b from-[#F0F0F0] to-[#D4D0C8] px-5 py-1 text-[11px] font-bold text-[#333] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] hover:from-[#E8E8E8] hover:to-[#C8C4BC] active:from-[#C0BEB5] active:to-[#AEA99C]"
                  >
                    OK
                  </button>
                  <button
                    onClick={dismiss}
                    className="rounded border border-[#003399]/50 bg-gradient-to-b from-[#F0F0F0] to-[#D4D0C8] px-5 py-1 text-[11px] font-bold text-[#333] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] hover:from-[#E8E8E8] hover:to-[#C8C4BC] active:from-[#C0BEB5] active:to-[#AEA99C]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>

            {/* Progress-like bar at the bottom — purely decorative */}
            <div className="mt-4 h-[3px] overflow-hidden rounded-full bg-[#C0C0C0]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#0054E3] via-[#3399FF] to-[#0054E3]"
                style={{
                  animation: "xpProgress 2s ease-in-out infinite",
                  width: "40%",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Minimized taskbar entry */}
      {minimized && (
        <button
          onClick={() => setMinimized(false)}
          className="fixed bottom-4 left-1/2 z-[310] -translate-x-1/2 rounded-sm border border-[#0054E3]/50 bg-gradient-to-b from-[#3C7FDE] to-[#2461C0] px-4 py-1.5 text-[10px] font-bold text-white shadow-md hover:brightness-110 active:from-[#1A4FA0] active:to-[#1A4FA0]"
        >
          AURA_AUDIO_EXPERIENCE.exe
        </button>
      )}

      {/* Inject keyframes */}
      <style>{`
        @keyframes xpOpen {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes xpClose {
          0% { opacity: 1; transform: translate(-50%, -50%) scale(1); filter: brightness(1); }
          40% { opacity: 1; transform: translate(-50%, -50%) scale(1.02); filter: brightness(1.5); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0.01); filter: brightness(3) saturate(0); }
        }
        @keyframes crtGlitch {
          0% { opacity: 0; }
          15% { opacity: 0.9; }
          30% { opacity: 0.3; }
          50% { opacity: 0.7; }
          70% { opacity: 0.15; }
          100% { opacity: 0; }
        }
        @keyframes xpProgress {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(350%); }
        }
      `}</style>
    </>
  );
}
