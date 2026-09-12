"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, Play, Pause } from "lucide-react";
import FloatingAudioVisualizer from "./FloatingAudioVisualizer";
import { connectAudioAnalyser } from "@/hooks/useAudioAnalyser";

/**
 * Floating audio player.
 *
 * - No autoplay (browser policy + UX). The WinXpModal triggers audio
 *   initialization; this component receives the `enabled` signal and
 *   starts playback on first available frame.
 * - Preference (muted / volume) is persisted in localStorage.
 * - Smooth fade in / out via gainRamp when toggling play/mute.
 * - Falls back to native HTMLAudioElement gain when Web Audio is unavailable.
 * - Stays fixed bottom-right, premium-minimal styling.
 */

const SRC = "/audio/let-it-happen.mp3";
const STORAGE_KEY = "aura.audio.prefs.v1";
const FADE_SECONDS = 0.8;

type Props = {
  /** Set to true by the XP modal after it dismisses and chime plays. */
  enabled?: boolean;
};

type PersistedPrefs = {
  muted: boolean;
  volume: number; // 0..1
};

function loadPrefs(): PersistedPrefs {
  if (typeof window === "undefined")
    return { muted: false, volume: 0.55 };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { muted: false, volume: 0.55 };
    const parsed = JSON.parse(raw) as Partial<PersistedPrefs>;
    return {
      muted: !!parsed.muted,
      volume:
        typeof parsed.volume === "number" &&
        parsed.volume >= 0 &&
        parsed.volume <= 1
          ? parsed.volume
          : 0.55,
    };
  } catch {
    return { muted: false, volume: 0.55 };
  }
}

function savePrefs(p: PersistedPrefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* storage disabled — fine */
  }
}

export default function AudioPlayer({ enabled = false }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.55);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoStartFired = useRef(false);

  /* Track whether Web Audio is available so we can fall back gracefully. */
  const hasWebAudio = useRef(false);

  /* Hydrate prefs once on mount */
  useEffect(() => {
    const p = loadPrefs();
    setMuted(p.muted);
    setVolume(p.volume);
  }, []);

  /* Persist on any change */
  useEffect(() => {
    if (!enabled) return;
    savePrefs({ muted, volume });
  }, [enabled, muted, volume]);

  /* Apply native volume as a fallback whenever Web Audio is not handling it. */
  const applyNativeVolume = useCallback(
    (a: HTMLAudioElement | null) => {
      if (!a || hasWebAudio.current) return;
      a.volume = muted ? 0 : volume;
    },
    [muted, volume]
  );

  /* Build the Web Audio graph lazily (on first opt-in). */
  const ensureGraph = useCallback(() => {
    if (hasWebAudio.current || !audioRef.current) return;
    try {
      const AC: typeof AudioContext =
        window.AudioContext ||
        (
          window as unknown as { webkitAudioContext: typeof AudioContext }
        ).webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      const source = ctx.createMediaElementSource(audioRef.current);
      const gain = ctx.createGain();
      gain.gain.value = 0; // start silent; fade in on play
      source.connect(gain).connect(ctx.destination);
      ctxRef.current = ctx;
      sourceRef.current = source;
      gainRef.current = gain;
      hasWebAudio.current = true;
    } catch (e) {
      console.warn("[AudioPlayer] Web Audio init failed, using native gain:", e);
      hasWebAudio.current = false;
    }
  }, []);

  /** Linear fade ramp from current gain to target, in FADE_SECONDS. */
  const fadeTo = useCallback((target: number, now: number) => {
    const g = gainRef.current;
    const ctx = ctxRef.current;
    if (!g || !ctx) return;
    const t = now + FADE_SECONDS;
    try {
      g.gain.cancelScheduledValues(now);
      g.gain.setValueAtTime(g.gain.value, now);
      g.gain.linearRampToValueAtTime(target, t);
    } catch {
      g.gain.value = target;
    }
  }, []);

  /** Resume the audio context after a user gesture (browsers require it). */
  const resume = useCallback(async () => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
        /* ignore */
      }
    }
  }, []);

  /* Keep native volume in sync when not using Web Audio. */
  useEffect(() => {
    applyNativeVolume(audioRef.current);
  }, [applyNativeVolume]);

  /** Start playback — handles both Web Audio and native fallback paths. */
  const startPlayback = useCallback(async () => {
    const a = audioRef.current;
    if (!a) return;
    a.muted = false;
    try {
      await resume();
      a.currentTime = 0;
      await a.play();
      if (hasWebAudio.current) {
        const target = muted ? 0 : volume;
        fadeTo(target, ctxRef.current!.currentTime);
      } else {
        a.volume = muted ? 0 : volume;
      }
      setPlaying(true);
      setExpanded(false);
      return true;
    } catch (e) {
      setError("Audio could not start. Try clicking play again.");
      console.warn("[AudioPlayer] play failed:", e);
      return false;
    }
  }, [resume, fadeTo, muted, volume]);

  /* When the XP modal fires `enabled`, auto-start playback once. */
  useEffect(() => {
    if (enabled && !autoStartFired.current) {
      autoStartFired.current = true;
      ensureGraph();
      // Small delay so the Web Audio graph is ready and the chime tail
      // has faded, then start the ambient track.
      setTimeout(() => {
        startPlayback();
        // Connect the analyser for 3D audio reactivity
        setTimeout(connectAudioAnalyser, 600);
      }, 400);
    }
  }, [enabled, ensureGraph, startPlayback]);

  /** Play / pause via the toggle. */
  const togglePlay = useCallback(async () => {
    const a = audioRef.current;
    if (!a) return;

    ensureGraph();

    if (playing) {
      if (hasWebAudio.current && ctxRef.current) {
        fadeTo(0, ctxRef.current.currentTime);
        setTimeout(() => a.pause(), FADE_SECONDS * 1000);
      } else {
        a.pause();
      }
      setPlaying(false);
    } else {
      try {
        await resume();
        await a.play();
        if (hasWebAudio.current && ctxRef.current) {
          fadeTo(muted ? 0 : volume, ctxRef.current.currentTime);
        } else {
          a.volume = muted ? 0 : volume;
        }
        setPlaying(true);
      } catch (e) {
        setError("Audio could not resume.");
        console.warn("[AudioPlayer] resume failed:", e);
      }
    }
  }, [playing, ensureGraph, resume, fadeTo, muted, volume]);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      const a = audioRef.current;
      if (hasWebAudio.current && ctxRef.current && enabled) {
        const target = next ? 0 : volume;
        fadeTo(target, ctxRef.current.currentTime);
      } else if (a) {
        a.volume = next ? 0 : volume;
      }
      return next;
    });
  }, [enabled, volume, fadeTo]);

  const onVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = Number(e.target.value) / 100;
      setVolume(v);
      if (hasWebAudio.current && ctxRef.current && enabled && !muted && playing) {
        fadeTo(v, ctxRef.current.currentTime);
      } else if (audioRef.current && enabled && !muted) {
        audioRef.current.volume = v;
      }
    },
    [enabled, muted, playing, fadeTo]
  );

  // If the user navigates away mid-playback, pause.
  useEffect(() => {
    const onVis = () => {
      if (document.hidden && playing && audioRef.current) {
        audioRef.current.pause();
        setPlaying(false);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [playing]);

  return (
    <>
      <audio
        ref={audioRef}
        src={SRC}
        preload="none"
        playsInline
        loop
        onError={() => setError("Track unavailable.")}
      />

      {/* Show controls once the XP modal has been dismissed */}
      {enabled && (
        <div
          role="region"
          aria-label="Background audio player"
          data-hover
          className="fixed bottom-6 right-6 z-50 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/70 px-2 py-1.5 text-white/80 shadow-2xl backdrop-blur-xl transition-all md:bottom-10 md:right-10"
        >
          <button
            onClick={togglePlay}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/10"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? (
              <Pause className="h-3.5 w-3.5" fill="currentColor" />
            ) : (
              <Play className="h-3.5 w-3.5" fill="currentColor" />
            )}
          </button>

          {/* Live audio visualizer bars */}
          <div className="hidden sm:block">
            <FloatingAudioVisualizer active={playing} />
          </div>

          {/* Track title */}
          <div className="hidden lg:flex flex-col min-w-0">
            <span className="text-[8px] uppercase tracking-[0.15em] text-white/35 truncate max-w-[80px]">
              Now Playing
            </span>
            <span className="text-[9px] text-white/65 truncate max-w-[80px]">
              Let It Happen
            </span>
          </div>

          {/* Expandable volume control */}
          {expanded && (
            <div className="flex items-center gap-2 pl-1 pr-1.5">
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(volume * 100)}
                onChange={onVolumeChange}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                aria-label="Volume"
                className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-white/15 accent-[#57e6ff]"
                style={{
                  background: `linear-gradient(to right, #57e6ff 0%, #57e6ff ${Math.round(volume * 100)}%, rgba(255,255,255,0.15) ${Math.round(volume * 100)}%, rgba(255,255,255,0.15) 100%)`,
                }}
              />
            </div>
          )}

          <button
            onClick={() => setExpanded((x) => !x)}
            aria-label="Toggle volume control"
            className="hidden h-9 w-9 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 sm:flex"
            title={expanded ? "Hide volume" : "Show volume"}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M3 6h2l3-2v8L5 10H3V6z" fill="currentColor" />
              <path
                d="M10 5c1.5 1 1.5 5 0 6"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
              />
              <path
                d="M12 3c2.5 1.5 2.5 8.5 0 10"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <button
            onClick={toggleMute}
            aria-label={muted ? "Unmute" : "Mute"}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10"
          >
            {muted || !playing ? (
              <VolumeX className="h-3.5 w-3.5" />
            ) : (
              <Volume2 className="h-3.5 w-3.5" />
            )}
          </button>

          {error && (
            <span className="ml-1 hidden max-w-[120px] truncate text-[10px] text-red-300 md:inline">
              {error}
            </span>
          )}
        </div>
      )}
    </>
  );
}
