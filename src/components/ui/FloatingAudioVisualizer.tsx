"use client";

import { useEffect, useRef } from "react";
import { audioData } from "@/hooks/useAudioAnalyser";

/**
 * FloatingAudioVisualizer — a small, persistent HUD visualizer that shows
 * real-time frequency bars reacting to the audio playback.
 *
 * Reads directly from the global audioData singleton (populated by
 * useAudioAnalyser hook in the 3D scene). No duplicate AudioContext.
 * Renders 8 frequency bars in a mini canvas layout at 30fps.
 */

const BAR_COUNT = 8;
const UPDATE_INTERVAL = 1000 / 30; // 30fps for perf

type Props = {
  /** Set to true when audio is playing. */
  active?: boolean;
};

export default function FloatingAudioVisualizer({ active = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = (timestamp: number) => {
      animRef.current = requestAnimationFrame(render);
      if (timestamp - lastUpdateRef.current < UPDATE_INTERVAL) return;
      lastUpdateRef.current = timestamp;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      if (!active) {
        // Idle state: static low bars
        const barW = w / BAR_COUNT - 1;
        for (let i = 0; i < BAR_COUNT; i++) {
          const x = i * (barW + 1);
          ctx.fillStyle = "rgba(87, 230, 255, 0.15)";
          ctx.fillRect(x, h - 2, barW, 2);
        }
        return;
      }

      // Read from global audioData (populated by useAudioAnalyser in 3D scene)
      const freqData = audioData.frequencyData;
      const hasData = freqData.length > 0;

      const barW = w / BAR_COUNT - 1;
      for (let i = 0; i < BAR_COUNT; i++) {
        let value: number;
        if (hasData) {
          const idx = Math.floor((i / BAR_COUNT) * freqData.length);
          value = freqData[idx] / 255;
        } else {
          // Fallback: gentle ambient animation
          const t = Date.now() / 1000;
          value = (30 + Math.sin(t * 1.5 + i * 0.8) * 20 + Math.sin(t * 2.3 + i * 1.2) * 10) / 255;
        }

        const barH = Math.max(2, value * h * 0.9);
        const x = i * (barW + 1);
        const y = h - barH;

        // Gradient: cyan with intensity-based alpha
        const alpha = 0.25 + value * 0.75;
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
