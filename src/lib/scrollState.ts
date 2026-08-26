/**
 * Shared mutable scroll state + master timeline.
 *
 * Written once per scroll frame by a single global ScrollTrigger, read
 * directly inside useFrame loops on the GPU-side components.
 * Deliberately NOT React state — pumping this through setState would
 * re-render the whole tree 60x/sec and destroy the frame budget.
 */
import { sceneWindow } from "./story";

export const scrollState = {
  /** Global page progress, 0 -> 1 */
  progress: 0,
  /** Scroll velocity (px/s), for audio-reactive instruments */
  velocity: 0,
  /** Eased explosion factor: 0 (assembled) -> 1 (exploded) -> 0 (reassembled) */
  explode: 0,
  /** Charging case lid: 0 (closed) -> 1 (fully open) */
  caseOpen: 0,
};

/* ------------------------------------------------------------------ */
/* Named beats — every window below is derived from the story registry */
/* ------------------------------------------------------------------ */

const W = sceneWindow;

export const T = {
  /* ACT I — The Question */
  overture: W("overture"),
  manifesto: W("manifesto"),
  signal: W("signal"),
  frequencies: W("frequencies"),

  /* ACT II — The Vessel (stages 1–3 of the reveal) */
  approach: W("approach"),
  orbit: W("orbit"),
  material: W("material"),
  craft: W("craft"),

  /* ACT III — Emergence (stages 4–8 of the reveal) */
  glimpse: W("glimpse"),
  firstlight: W("firstlight"),
  rise: W("rise"),
  separation: W("separation"),

  /* ACT IV — Acoustic Architecture */
  hero: W("hero"),
  waves: W("waves"),
  driver: W("driver"),
  interlude: W("interlude"),

  /* ACT V — Internal Components */
  engineering: W("engineering"),
  explosion: W("explosion"),
  shell: W("shell"),
  processor: W("processor"),

  /* ACT VI — Sound Engineering */
  cell: W("cell"),
  anc: W("anc"),
  power: W("power"),
  connect: W("connect"),

  /* ACT VII — Experience */
  spatial: W("spatial"),
  touch: W("touch"),

  /* ACT VIII — Ecosystem */
  family: W("family"),
  versus: W("versus"),

  /* ACT IX — Future of Listening */
  reassembly: W("reassembly"),
  final: W("final"),
} as const;

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

/** Fraction of a scene's length, as a helper for sub-beats. */
export const at = (w: { start: number; end: number }, f: number) =>
  w.start + (w.end - w.start) * f;

/* ------------------------------------------------------------------ */
/* Choreography                                                        */
/* ------------------------------------------------------------------ */

/**
 * STAGE 1–2 — Case emergence from the void below.
 * The vessel ascends into the key light across most of APPROACH while
 * the camera is still travelling toward it.
 */
export function computeStageRise(p: number): number {
  return easeInOut(win(p, at(T.approach, 0.02), at(T.approach, 0.72)));
}

/**
 * STAGE 4–5 — Lid choreography:
 *   GLIMPSE 8%→45%   slow crack — a sliver of light escapes
 *   GLIMPSE → FIRST LIGHT 55%   HOLD THE SLIVER. Anticipation.
 *   rest of FIRST LIGHT   full open, unhurried
 */
const SLIVER = 0.18;

export function computeCaseOpen(p: number): number {
  const g = T.glimpse;
  if (p < at(g, 0.08)) return 0;
  if (p < at(g, 0.45)) {
    return SLIVER * easeInOut((p - at(g, 0.08)) / (at(g, 0.45) - at(g, 0.08)));
  }
  const holdEnd = at(T.firstlight, 0.55);
  if (p < holdEnd) return SLIVER;
  return SLIVER + (1 - SLIVER) * easeInOut(clamp01((p - holdEnd) / (T.firstlight.end - holdEnd)));
}

/**
 * STAGE 6 — Earbuds rise INDIVIDUALLY.
 * The left bud lifts first; the right follows on its own beat,
 * overlapping but never synchronised.
 */
export function computeBudLift(p: number, side: 1 | -1): number {
  const r = T.rise;
  if (side === -1) {
    // First off the pad.
    return easeInOut(win(p, r.start, at(r, 0.62)));
  }
  // Second, slower, more reluctant — a different personality.
  return easeInOut(win(p, at(r, 0.38), r.end));
}

/**
 * STAGE 7 — Earbuds separate clearly into two distinct objects.
 */
export function computeSeparation(p: number): number {
  const s = T.separation;
  return easeInOut(win(p, at(s, 0.12), at(s, 0.9)));
}

/**
 * STAGE 8 — Hero reveal is a camera + light event (see Experience),
 * not a transform on the buds themselves.
 */

/**
 * Explosion timeline — deliberately late. The product must be earned
 * before it is deconstructed:
 *   explosion scene 6%→34%   deconstruct (cubic in-out)
 *   through the cell chapter fully exploded, each part getting its film
 *   reassembly scene →42%    reassemble with magnetic overshoot (ACT IX)
 */
export function computeExplode(p: number): number {
  const e = T.explosion;
  const deconStart = at(e, 0.06);
  const deconEnd = at(e, 0.34);
  const holdEnd = at(T.cell, 0.96);
  const reasEnd = at(T.reassembly, 0.42);

  if (p <= deconStart || p >= reasEnd + 0.001) return 0;
  if (p < deconEnd) return easeInOut((p - deconStart) / (deconEnd - deconStart));
  if (p <= holdEnd) return 1;
  // Reassembly: back-out overshoot lets parts cross their rest point
  // slightly — reads as a magnetic snap rather than a stop.
  return 1 - easeOutBack(clamp01((p - holdEnd) / (reasEnd - holdEnd)));
}
