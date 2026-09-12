"use client";

import { useEffect, useRef } from "react";

/**
 * useAudioAnalyser — connects to the existing <audio> element's Web Audio
 * graph and exposes a real-time frequency data buffer.
 *
 * Returns a ref to a mutable AudioAnalyserData object that is updated
 * every animation frame. Read .bass, .mid, .treble, .overall inside useFrame.
 *
 * Does NOT cause React re-renders — the data lives in a mutable ref
 * for zero-cost GPU-side consumption.
 */

export type AudioAnalyserData = {
  frequencyData: Uint8Array;
  bass: number;
  mid: number;
  treble: number;
  overall: number;
};

/** The shared mutable data object — read from any useFrame loop. */
export const audioData: AudioAnalyserData = {
  frequencyData: new Uint8Array(0),
  bass: 0,
  mid: 0,
  treble: 0,
  overall: 0,
};

let globalAnalyser: AnalyserNode | null = null;
let globalLoopRunning = false;
let globalConnected = false;

function tick() {
  if (!globalLoopRunning) return;
  requestAnimationFrame(tick);

  if (!globalAnalyser) return;
  const binCount = globalAnalyser.frequencyBinCount;
  const freqData = new Uint8Array(binCount);
  globalAnalyser.getByteFrequencyData(freqData);

  let bassSum = 0, bassCount = 0;
  let midSum = 0, midCount = 0;
  let trebleSum = 0, trebleCount = 0;
  let totalSum = 0;

  for (let i = 0; i < binCount; i++) {
    const val = freqData[i] / 255;
    totalSum += val;
    if (i <= 0) { bassSum += val; bassCount++; }
    else if (i <= 11) { midSum += val; midCount++; }
    else if (i <= 46) { trebleSum += val; trebleCount++; }
  }

  audioData.frequencyData = freqData;
  audioData.bass = bassCount > 0 ? bassSum / bassCount : 0;
  audioData.mid = midCount > 0 ? midSum / midCount : 0;
  audioData.treble = trebleCount > 0 ? trebleSum / trebleCount : 0;
  audioData.overall = binCount > 0 ? totalSum / binCount : 0;
}

/**
 * Connect to the audio element's source. Call once after AudioPlayer
 * has set up its Web Audio graph.
 */
export function connectAudioAnalyser() {
  if (globalConnected) return;
  globalConnected = true;

  const audioEl = document.querySelector("audio[src*='let-it-happen']") as HTMLAudioElement | null;
  if (!audioEl) return;

  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    const source = ctx.createMediaElementSource(audioEl);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.82;
    source.connect(analyser);
    globalAnalyser = analyser;
    if (!globalLoopRunning) {
      globalLoopRunning = true;
      requestAnimationFrame(tick);
    }
  } catch {
    globalConnected = false;
  }
}

/**
 * React hook — subscribes to audio analyser.
 * Returns a ref whose .current is updated every frame with live data.
 * Use inside useFrame for zero-render GPU consumption.
 */
export function useAudioAnalyser() {
  const dataRef = useRef(audioData);

  useEffect(() => {
    // Ensure the global loop is running
    if (!globalLoopRunning && globalAnalyser) {
      globalLoopRunning = true;
      requestAnimationFrame(tick);
    }

    // Update ref every frame (cheap — no React renders)
    let rafId: number;
    const updateRef = () => {
      dataRef.current = audioData;
      rafId = requestAnimationFrame(updateRef);
    };
    rafId = requestAnimationFrame(updateRef);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return dataRef;
}
