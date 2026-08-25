/**
 * Shared mutable scroll state.
 *
 * Written once per scroll frame by a single global ScrollTrigger, read
 * directly inside useFrame loops on the GPU-side components.
 * Deliberately NOT React state — pumping this through setState would
 * re-render the whole tree 60x/sec and destroy the frame budget.
 */
export const scrollState = {
  /** Global page progress, 0 -> 1 */
  progress: 0,
  /** Eased explosion factor: 0 (assembled) -> 1 (fully exploded) -> 0 (reassembled) */
  explode: 0,
};

/* ------------------------------------------------------------------ */
/* Easing + window helpers                                             */
/* ------------------------------------------------------------------ */

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Smoothstep between two progress points. Returns 0 before `a`, 1 after `b`. */
export function win(p: number, a: number, b: number): number {
  if (b <= a) return p >= b ? 1 : 0;
  const t = clamp01((p - a) / (b - a));
  return t * t * (3 - 2 * t);
}

/** Cubic in-out — the house easing for every choreographed move. */
export const easeInOut = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/** Back-out overshoot — used for the magnetic reassembly "clack". */
export const easeOutBack = (t: number): number => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

/**
 * Explosion timeline:
 *   0.36 -> 0.50  deconstruct (cubic in-out)
 *   0.50 -> 0.76  hold, fully exploded
 *   0.76 -> 0.88  reassemble with magnetic overshoot
 */
export function computeExplode(p: number): number {
  if (p <= 0.36 || p >= 0.9) return 0;
  if (p < 0.5) return easeInOut((p - 0.36) / 0.14);
  if (p <= 0.76) return 1;
  // Reassembly: back-out overshoot lets parts cross their rest point
  // slightly — reads as a magnetic snap rather than a stop.
  return 1 - easeOutBack(clamp01((p - 0.76) / 0.12));
}
