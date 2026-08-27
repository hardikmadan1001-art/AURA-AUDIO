"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * WinXpModal — a full CRT boot experience that gates the Aura Audio
 * immersive experience. Phosphor-green boot text, authentic Windows XP
 * window chrome, synthesized startup chime, and a pixel-dissolve exit
 * that transitions into the luxury dark-mode Act I scene.
 */

type Props = {
  onDismiss: () => void;
};

/* ------------------------------------------------------------------ */
/* Synthesized retro startup chime — warm major chord with reverb tail */
/* ------------------------------------------------------------------ */

function playStartupChime() {
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new AC();

    // Reverb via convolver (simple impulse)
    const reverbLength = ctx.sampleRate * 1.2;
    const reverbBuffer = ctx.createBuffer(2, reverbLength, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = reverbBuffer.getChannelData(ch);
      for (let i = 0; i < reverbLength; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / reverbLength, 2.5);
      }
    }
    const convolver = ctx.createConvolver();
    convolver.buffer = reverbBuffer;
    const reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.18;
    convolver.connect(reverbGain);

    const master = ctx.createGain();
    master.gain.value = 0.3;
    master.connect(ctx.destination);
    reverbGain.connect(ctx.destination);

    const now = ctx.currentTime;

    // Warm C major: C4 + E4 + G4 + C5 with gentle stagger
    const notes = [261.63, 329.63, 392.0, 523.25];
    const delays = [0, 0.05, 0.1, 0.15];

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.detune.value = (i - 1.5) * 4;

      const t = now + delays[i];
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.8);

      osc.connect(gain).connect(master);
      osc.connect(gain).connect(convolver);
      osc.start(t);
      osc.stop(t + 2);
    });

    // Sub bass thud
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = "sine";
    sub.frequency.value = 65.41;
    subGain.gain.setValueAtTime(0, now);
    subGain.gain.linearRampToValueAtTime(0.25, now + 0.008);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    sub.connect(subGain).connect(master);
    sub.start(now);
    sub.stop(now + 0.6);
  } catch {
    // Silent fallback
  }
}

/* ------------------------------------------------------------------ */
/* CRT boot text sequence                                              */
/* ------------------------------------------------------------------ */

const BOOT_LINES = [
  { text: "AURA BIOS v4.2.1 — Initializing...", delay: 0 },
  { text: "Memory check: 65536 KB OK", delay: 200 },
  { text: "Audio subsystem: Graphene Driver Array detected", delay: 500 },
  { text: "Spatial engine: 360° soundstage loaded", delay: 800 },
  { text: "Noise cancellation: −48 dB hybrid ANC active", delay: 1100 },
  { text: "Codec: LDAC / aptX Lossless — locked", delay: 1400 },
  { text: "Battery: 48h playback — full charge", delay: 1600 },
  { text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", delay: 1800 },
  { text: "All systems nominal. Welcome to Aura.", delay: 2000 },
  { text: "", delay: 2200 },
  { text: "C:\\AURA> experience_with_audio.exe", delay: 2500 },
];

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
  const [phase, setPhase] = useState<"booting" | "ready" | "closing" | "done">("booting");
  const [bootLine, setBootLine] = useState(0);
  const [cursorBlink, setCursorBlink] = useState(true);
  const winRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  useDraggable(winRef, handleRef);

  // Boot text sequence
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    BOOT_LINES.forEach((line, i) => {
      timers.push(
        setTimeout(() => setBootLine(i), line.delay)
      );
    });
    timers.push(
      setTimeout(() => setPhase("ready"), BOOT_LINES[BOOT_LINES.length - 1].delay + 400)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  // Cursor blink
  useEffect(() => {
    const iv = setInterval(() => setCursorBlink((b) => !b), 530);
    return () => clearInterval(iv);
  }, []);

  const dismiss = useCallback(() => {
    if (phase === "closing" || phase === "done") return;
    playStartupChime();
    setPhase("closing");
    setTimeout(() => {
      setPhase("done");
      onDismiss();
    }, 1200);
  }, [onDismiss, phase]);

  // Keyboard fallbacks: Enter / Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "Escape") {
        e.preventDefault();
        if (phase === "ready") dismiss();
        else if (phase === "booting") {
          // Skip boot animation
          setBootLine(BOOT_LINES.length - 1);
          setPhase("ready");
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dismiss, phase]);

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
      {/* Full-screen CRT backdrop with scanlines */}
      <div
        className="fixed inset-0 z-[300]"
        style={{
          background: "radial-gradient(ellipse at center, #0a0a12 0%, #000000 100%)",
        }}
      >
        {/* CRT scanlines overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 1px, transparent 1px, transparent 3px)",
            mixBlendMode: "multiply",
          }}
        />
        {/* Vignette — darker corners like a real CRT */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)",
          }}
        />
        {/* Phosphor glow — subtle green tint */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.02]"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(87, 230, 255, 0.4), transparent 70%)",
          }}
        />

        {/* Clickable dismiss area (behind the window) */}
        <button
          onClick={dismiss}
          className="absolute inset-0 z-0"
          aria-label="Dismiss"
        />
      </div>

      {/* CRT exit overlay — pixel dissolve + scanline glitch */}
      {phase === "closing" && (
        <>
          {/* Scanline glitch sweep */}
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 z-[400]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, rgba(87,230,255,0.08) 0px, rgba(87,230,255,0.08) 1px, transparent 1px, transparent 3px)",
              animation: "crtScanline 1.2s ease-in-out forwards",
            }}
          />
          {/* Brightness flash */}
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 z-[401]"
            style={{
              background: "white",
              animation: "crtFlash 1.2s ease-out forwards",
            }}
          />
        </>
      )}

      {/* ====== Boot Text Screen ====== */}
      {phase === "booting" && (
        <div
          className="fixed inset-0 z-[301] flex items-center justify-center p-8"
          style={{ animation: "fadeIn 0.3s ease-out" }}
        >
          <div className="max-w-lg w-full">
            {/* AURA logo at top */}
            <div className="mb-8 text-center">
              <p
                className="font-display text-2xl font-bold tracking-[0.5em] uppercase"
                style={{
                  color: "#57e6ff",
                  textShadow: "0 0 20px rgba(87, 230, 255, 0.5), 0 0 40px rgba(87, 230, 255, 0.2)",
                }}
              >
                AURA
              </p>
              <p className="mt-1 text-[10px] tracking-[0.4em] text-white/30">
                AUDIO SYSTEMS
              </p>
            </div>

            {/* Boot lines */}
            <div className="font-mono text-[11px] leading-[2] text-[#57e6ff]/80">
              {BOOT_LINES.slice(0, bootLine + 1).map((line, i) => (
                <div
                  key={i}
                  style={{
                    animation: "fadeSlideUp 0.2s ease-out",
                    opacity: i === bootLine ? 1 : 0.5,
                  }}
                >
                  {line.text}
                  {i === bootLine && (
                    <span
                      style={{
                        opacity: cursorBlink ? 1 : 0,
                        color: "#57e6ff",
                      }}
                    >
                      ▊
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="mt-6 h-[2px] overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${((bootLine + 1) / BOOT_LINES.length) * 100}%`,
                  background:
                    "linear-gradient(90deg, #57e6ff, rgba(87, 230, 255, 0.5))",
                  transition: "width 0.3s ease-out",
                  boxShadow: "0 0 10px rgba(87, 230, 255, 0.5)",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ====== XP Window (appears after boot) ====== */}
      {phase === "ready" && (
        <div
          ref={winRef}
          className="fixed left-1/2 top-1/2 z-[310] w-[92vw] max-w-[440px] select-none"
          style={{
            transform: "translate(-50%, -50%)",
            animation: "xpWindowAppear 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards",
          }}
        >
          {/* Title bar — authentic XP gradient */}
          <div
            ref={handleRef}
            className="flex cursor-grab items-center rounded-t-[3px] px-2 py-[3px] active:cursor-grabbing"
            style={{
              background:
                "linear-gradient(180deg, #0997FF 0%, #0563D9 8%, #0054E3 18%, #0048D1 40%, #0042C4 55%, #003CB8 75%, #0033A0 100%)",
            }}
          >
            {/* Icon */}
            <div className="mr-1.5 flex h-[16px] w-[16px] items-center justify-center rounded-[2px] bg-gradient-to-br from-[#FFE066] to-[#E6A800] shadow-sm">
              <span className="text-[7px] font-black text-[#003366]">♫</span>
            </div>
            <span className="flex-1 truncate text-[11px] font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
              AURA_EXPERIENCE.exe
            </span>
            <div className="flex gap-[2px]">
              {/* Minimize */}
              <button
                aria-label="Minimize"
                onClick={() => setPhase("closing")}
                className="flex h-[21px] w-[21px] items-center justify-center rounded-[2px] text-[9px] text-white"
                style={{
                  background:
                    "linear-gradient(180deg, #3E8FED 0%, #2B6AC4 50%, #1C4FA0 100%)",
                  boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,0.4), 0 1px 0 rgba(0,0,0,0.3)",
                  border: "1px solid rgba(0,0,0,0.3)",
                }}
              >
                _
              </button>
              {/* Maximize */}
              <button
                aria-label="Maximize"
                className="flex h-[21px] w-[21px] items-center justify-center rounded-[2px] text-[9px] text-white"
                style={{
                  background:
                    "linear-gradient(180deg, #3E8FED 0%, #2B6AC4 50%, #1C4FA0 100%)",
                  boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,0.4), 0 1px 0 rgba(0,0,0,0.3)",
                  border: "1px solid rgba(0,0,0,0.3)",
                }}
              >
                □
              </button>
              {/* Close */}
              <button
                aria-label="Close"
                onClick={dismiss}
                className="flex h-[21px] w-[21px] items-center justify-center rounded-[2px] text-[11px] font-bold text-white"
                style={{
                  background:
                    "linear-gradient(180deg, #E8785C 0%, #D1503C 40%, #C04030 100%)",
                  boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,0.4), 0 1px 0 rgba(0,0,0,0.3)",
                  border: "1px solid rgba(0,0,0,0.3)",
                }}
              >
                ×
              </button>
            </div>
          </div>

          {/* Window body — authentic XP silver/gray */}
          <div
            className="rounded-b-[3px] p-5"
            style={{
              background: "linear-gradient(180deg, #ECE9D8 0%, #E3DFCF 100%)",
              boxShadow:
                "0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)",
              border: "1px solid #0054E3",
              borderTop: "none",
            }}
          >
            <div className="flex gap-4">
              {/* System icon */}
              <div className="hidden flex-shrink-0 sm:block">
                <div
                  className="flex h-[48px] w-[48px] items-center justify-center rounded-lg"
                  style={{
                    background:
                      "linear-gradient(135deg, #FFE066 0%, #E6A800 100%)",
                    boxShadow:
                      "inset 0 1px 3px rgba(0,0,0,0.2), 0 1px 0 rgba(255,255,255,0.8)",
                    border: "1px solid #B8960A",
                  }}
                >
                  <span className="text-xl">🔊</span>
                </div>
              </div>

              <div className="flex-1">
                <p
                  className="mb-1 text-[13px] font-bold"
                  style={{ color: "#003399" }}
                >
                  AURA Audio Experience
                </p>
                <p
                  className="mb-4 text-[12px] leading-[1.6]"
                  style={{ color: "#333333" }}
                >
                  This experience includes spatial audio, ambient soundscapes,
                  and low-frequency sweeps designed to accompany the visual
                  journey. Audio enhances the immersion — enable it now.
                </p>
                <p
                  className="mb-5 text-[11px]"
                  style={{ color: "#666666" }}
                >
                  Click <b>OK</b> to enable audio and begin the experience.
                </p>

                {/* Buttons */}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={dismiss}
                    className="rounded-[3px] px-6 py-[5px] text-[11px] font-bold"
                    style={{
                      color: "#000",
                      background:
                        "linear-gradient(180deg, #FFFFFF 0%, #F0F0F0 20%, #E0DFD4 80%, #D4D0C8 100%)",
                      boxShadow:
                        "inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 2px rgba(0,0,0,0.2)",
                      border: "1px solid #8E8F8A",
                    }}
                  >
                    OK
                  </button>
                  <button
                    onClick={dismiss}
                    className="rounded-[3px] px-6 py-[5px] text-[11px] font-bold"
                    style={{
                      color: "#000",
                      background:
                        "linear-gradient(180deg, #FFFFFF 0%, #F0F0F0 20%, #E0DFD4 80%, #D4D0C8 100%)",
                      boxShadow:
                        "inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 2px rgba(0,0,0,0.2)",
                      border: "1px solid #8E8F8A",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>

            {/* Progress bar — purely decorative */}
            <div
              className="mt-4 h-[3px] overflow-hidden rounded-[2px]"
              style={{ background: "#C0C0C0" }}
            >
              <div
                className="h-full rounded-[2px]"
                style={{
                  width: "35%",
                  background:
                    "linear-gradient(90deg, #3C7FDE, #57A8FF, #3C7FDE)",
                  animation: "xpProgressBar 2.5s ease-in-out infinite",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Keyframes */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes xpWindowAppear {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.6) translateY(20px); filter: blur(4px); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1) translateY(0); filter: blur(0); }
        }
        @keyframes crtFlash {
          0% { opacity: 0; }
          10% { opacity: 0.8; }
          30% { opacity: 0.1; }
          50% { opacity: 0.5; }
          70% { opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes crtScanline {
          0% { opacity: 0; }
          15% { opacity: 0.7; }
          40% { opacity: 0.2; }
          60% { opacity: 0.5; }
          80% { opacity: 0.1; }
          100% { opacity: 0; }
        }
        @keyframes xpProgressBar {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(380%); }
        }
      `}</style>
    </>
  );
}
