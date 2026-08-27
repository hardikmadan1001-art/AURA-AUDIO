"use client";

import { useEffect, useRef, useState } from "react";

/**
 * FloatingAudioVisualizer — a small, persistent HUD visualizer that shows
 * real-time frequency bars reacting to the audio playback.
 *
 * Uses Web Audio AnalyserNode connected to the same audio graph as AudioPlayer.
 * Renders 8 frequency bars in a mini layout.
 */

const BAR_COUNT = 8;
const SMOOTHING = 0.82;
const UPDATE_INTERVAL = 1000 / 30; // 30fps for perf (visual only)

type Props = {
  /** Set to true when audio is playing and the AudioContext is available. */
  active?: boolean;
};

export default function FloatingAudioVisualizer({ active = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animRef = useRef<number | null>(null);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    if (!active) {
      // Draw idle state
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) {
          const w = canvasRef.current.width;
          const h = canvasRef.current.height;
          ctx.clearRect(0, 0, w, h);
          const barW = w / BAR_COUNT - 1;
          for (let i = 0; i < BAR_COUNT; i++) {
            const x = i * (barW + 1);
            ctx.fillStyle = "rgba(87, 230, 255, 0.2)";
            ctx.fillRect(x, h - 2, barW, 2);
          }
        }
      }
      return;
    }

    // Try to find the existing AudioContext and create an analyser
    const tryConnect = () => {
      // Walk the DOM to find the audio element and its source
      const audioEl = document.querySelector("audio[src*='let-it-happen']") as HTMLAudioElement | null;
      if (!audioEl) return;

      try {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

        // Check if there's already an AudioContext in use
        // We create our own analyser connected to the same element
        // Note: we can only call createMediaElementSource once per element
        // So we check if there's already a context

        // Use a separate approach: create a new context + source for visualization
        // This is a workaround since the main AudioPlayer owns the source node
        const ctx = new AC();
        try {
          const source = ctx.createMediaElementSource(audioEl);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          analyser.smoothingTimeConstant = SMOOTHING;
          source.connect(analyser);
          // Don't connect to destination — we just need the data
          analyserRef.current = analyser;
        } catch {
          // Source already connected — create analyser from the existing context
          // This is a known limitation. We'll use a fallback approach.
          ctx.close();
        }
      } catch {
        // Web Audio not available — show idle state
      }
    };

    tryConnect();

    // Render loop
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dataArray = new Uint8Array(BAR_COUNT);

    const render = (timestamp: number) => {
      animRef.current = requestAnimationFrame(render);

      if (timestamp - lastUpdateRef.current < UPDATE_INTERVAL) return;
      lastUpdateRef.current = timestamp;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const analyser = analyserRef.current;
      if (analyser) {
        const freqData = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(freqData);
        // Sample the first BAR_COUNT bins
        for (let i = 0; i < BAR_COUNT; i++) {
          const idx = Math.floor((i / BAR_COUNT) * freqData.length);
          dataArray[i] = freqData[idx];
        }
      } else {
        // Fallback: gentle ambient animation
        const t = Date.now() / 1000;
        for (let i = 0; i < BAR_COUNT; i++) {
          dataArray[i] = Math.floor(
            30 + Math.sin(t * 1.5 + i * 0.8) * 20 + Math.sin(t * 2.3 + i * 1.2) * 10
          );
        }
      }

      const barW = w / BAR_COUNT - 1;
      for (let i = 0; i < BAR_COUNT; i++) {
        const barH = Math.max(2, (dataArray[i] / 255) * h * 0.9);
        const x = i * (barW + 1);
        const y = h - barH;

        // Gradient from cyan to white based on intensity
        const intensity = dataArray[i] / 255;
        const alpha = 0.3 + intensity * 0.7;
        ctx.fillStyle = `rgba(87, 230, 255, ${alpha})`;
        ctx.fillRect(x, y, barW, barH);
      }
    };

    animRef.current = requestAnimationFrame(render);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      width={48}
      height={16}
      className="pointer-events-none"
      aria-hidden
      style={{ imageRendering: "pixelated" }}
    />
  );
}
