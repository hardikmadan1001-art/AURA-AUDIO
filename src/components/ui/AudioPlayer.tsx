"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, Play, Pause, Music } from "lucide-react";

/**
 * Floating audio player.
 *
 * - No autoplay (browser policy + UX). The first interaction shows the
 *   "Enable Sound" affordance; until then nothing is loaded.
 * - Preference (enabled / muted / volume) is persisted in localStorage.
 * - Smooth fade in / out via gainRamp when toggling play/mute.
 * - Falls back to native HTMLAudioElement gain when Web Audio is unavailable.
 * - Stays fixed bottom-right, premium-minimal styling.
 */

const SRC = "/audio/let-it-happen.mp3";
const STORAGE_KEY = "aura.audio.prefs.v1";
const FADE_SECONDS = 0.8;

type PersistedPrefs = {
  enabled: boolean;
  muted: boolean;
  volume: number; // 0..1
};

function loadPrefs(): PersistedPrefs {
  if (typeof window === "undefined")
    return { enabled: false, muted: false, volume: 0.55 };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { enabled: false, muted: false, volume: 0.55 };
    const parsed = JSON.parse(raw) as Partial<PersistedPrefs>;
    return {
      enabled: !!parsed.enabled,
      muted: !!parsed.muted,
      volume:
        typeof parsed.volume === "number" &&
        parsed.volume >= 0 &&
        parsed.volume <= 1
          ? parsed.volume
          : 0.55,
    };
  } catch {
    return { enabled: false, muted: false, volume: 0.55 };
  }
}

function savePrefs(p: PersistedPrefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* storage disabled — fine */
  }
}

export default function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const [enabled, setEnabled] = useState(false); // user has opted in
  const [playing, setPlaying] = useState(false); // actually playing
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.55);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Track whether Web Audio is available so we can fall back gracefully. */
  const hasWebAudio = useRef(false);

  /* Hydrate prefs once on mount */
  useEffect(() => {
    const p = loadPrefs();
    setEnabled(p.enabled);
    setMuted(p.muted);
    setVolume(p.volume);
  }, []);

  /* Persist on any change */
  useEffect(() => {
    if (!enabled && !playing) return;
    savePrefs({ enabled, muted, volume });
  }, [enabled, muted, volume, playing]);

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
      // Web Audio init failed — we'll use native volume control instead.
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

  /** ENTRY POINT — first click. Opts the user in and kicks playback. */
  const enable = useCallback(async () => {
    setError(null);
    setEnabled(true);
    ensureGraph();
    await startPlayback();
  }, [ensureGraph, startPlayback]);

  /** Play / pause via the toggle. */
  const togglePlay = useCallback(async () => {
    const a = audioRef.current;
    if (!a) return;

    /* First time: the user hasn't opted in yet. */
    if (!enabled) {
      return enable();
    }

    /* Ensure the Web Audio graph is initialised (it may not be if prefs
       were restored from localStorage on a fresh page load). */
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
  }, [enabled, playing, enable, ensureGraph, resume, fadeTo, muted, volume]);

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

      {!enabled ? (
        /* Compact "Enable Sound" pill — the very first interaction */
        <button
          onClick={enable}
          data-hover
          className="group fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full border border-white/25 bg-black/60 px-4 py-2.5 text-[10px] uppercase tracking-[0.35em] text-white/80 backdrop-blur-md transition-all hover:border-[#57e6ff]/70 hover:text-[#57e6ff] md:bottom-10 md:right-10"
          aria-label="Enable background music"
        >
          <Music className="h-3.5 w-3.5" />
          <span>Enable Sound</span>
        </button>
      ) : (
        /* Expanded floating player */
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
