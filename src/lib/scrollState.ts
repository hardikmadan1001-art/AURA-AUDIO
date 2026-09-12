/**
 * Shared mutable scroll state + master timeline.
 *
 * Written once per scroll frame by a single global ScrollTrigger, read
 * directly inside useFrame loops on the GPU-side components.
 * Deliberately NOT React state — pumping this through setState would
 * re-render the whole tree 60x/sec and destroy the frame budget.
 *
 * REWRITTEN: 5 mystery acts (no product) → product reveal → finale
 */
import { sceneWindow, REVEAL_PROGRESS } from "./story";

export const scrollState = {
  /** Global page progress, 0 -> 1 */
  progress: 0,
  /** Scroll velocity (px/s), for audio-reactive instruments */
  velocity: 0,
  /** Eased explosion factor: 0 (assembled) -> 1 (exploded) -> 0 (reassembled) */
  explode: 0,
  /** Charging case lid: 0 (closed) -> 1 (fully open) */
  caseOpen: 0,
  /** Product visibility: 0 (hidden) -> 1 (fully visible). Stays 0 through mystery acts. */
  productVisibility: 0,
  /** Mystery scene intensity: 1 during acts I–V, fades to 0 at reveal. */
  mysteryIntensity: 0,
};

/* ------------------------------------------------------------------ */
/* Named beats — every window below is derived from the story registry */
/* ------------------------------------------------------------------ */

const W = sceneWindow;

export const T = {
  /* ACT I — The Silence Before Sound */
  silence: W("silence"),
  wavescape: W("wavescape"),
  sonicform: W("sonicform"),

  /* ACT II — A Thousand Failures */
  graveyard: W("graveyard"),
  fragments: W("fragments"),
  ruins: W("ruins"),

  /* ACT III — Inside the Sound */
  tunnel: W("tunnel"),
  frequency: W("frequency"),
  resonance_chamber: W("resonance_chamber"),

  /* ACT IV — 1100 Iterations */
  iterations: W("iterations"),
  convergence: W("convergence"),
  singular: W("singular"),

  /* ACT V — The Discovery */
  monolith: W("monolith"),
  awakening: W("awakening"),

  /* ════════════ PRODUCT REVEAL ════════════ */

  /* ACT VI — The Vessel */
  emergence: W("emergence"),
  orbit: W("orbit"),
  material: W("material"),
  craft: W("craft"),

  /* ACT VII — Emergence */
  glimpse: W("glimpse"),
  firstlight: W("firstlight"),
  rise: W("rise"),
  separation: W("separation"),

  /* ACT VIII — Acoustic Architecture */
  hero: W("hero"),
  waves: W("waves"),
  driver: W("driver"),
  interlude: W("interlude"),

  /* ACT IX — Internal Components */
  engineering: W("engineering"),
  explosion: W("explosion"),
  shell: W("shell"),
  processor: W("processor"),

  /* ACT X — Sound Engineering */
  cell: W("cell"),
  anc: W("anc"),
  power: W("power"),
  connect: W("connect"),

  /* ACT XI — Resonance */
  resonance: W("resonance"),
  harmonics: W("harmonics"),
  overtones: W("overtones"),

  /* ACT XII — Future of Listening */
  reassembly: W("reassembly"),
  final: W("final"),

  /* ──── Backward-compat aliases for existing atmospheric systems ──── */
  overture: W("overture"),
  manifesto: W("manifesto"),
  signal: W("signal"),
  frequencies: W("frequencies"),
  origin: W("origin"),
  philosophy: W("philosophy"),
  obsession: W("obsession"),
  approach: W("approach"),
  graphene: W("graphene"),
  ceramic: W("ceramic"),
  aluminium: W("aluminium"),
  spatial: W("spatial"),
  touch: W("touch"),
  family: W("family"),
  versus: W("versus"),
  assembly: W("assembly"),
  calibration: W("calibration"),
  certification: W("certification"),
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
/* Product visibility — hidden through mystery acts, revealed at ACT VI */
/* ------------------------------------------------------------------ */

/**
 * Product visibility: 0 throughout mystery acts, fades to 1
 * during the EMERGENCE scene (ACT VI), then stays 1.
 */
export function computeProductVisibility(p: number): number {
  return easeInOut(win(p, at(T.emergence, 0.05), at(T.emergence, 0.5)));
}

/**
 * Mystery intensity: 1 through ACT I–V, fades out during ACT VI emergence.
 */
export function computeMysteryIntensity(p: number): number {
  return 1 - easeInOut(win(p, at(T.emergence, 0.0), at(T.emergence, 0.6)));
}

/* ------------------------------------------------------------------ */
/* Product Choreography — same logic, new timeline positions           */
/* ------------------------------------------------------------------ */

/**
 * STAGE 1–2 — Case emergence from the void below.
 */
export function computeStageRise(p: number): number {
  return easeInOut(win(p, at(T.emergence, 0.02), at(T.emergence, 0.72)));
}

/**
 * STAGE 4–5 — Lid choreography.
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
 */
export function computeBudLift(p: number, side: 1 | -1): number {
  const r = T.rise;
  if (side === -1) {
    return easeInOut(win(p, r.start, at(r, 0.62)));
  }
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
 * STAGE 8 — Hero reveal is a camera + light event.
 */

/** Explosion timeline — deliberately late. */
export function computeExplode(p: number): number {
  const e = T.explosion;
  const deconStart = at(e, 0.06);
  const deconEnd = at(e, 0.34);
  const holdEnd = at(T.cell, 0.96);
  const reasEnd = at(T.reassembly, 0.42);

  if (p <= deconStart || p >= reasEnd + 0.001) return 0;
  if (p < deconEnd) return easeInOut((p - deconStart) / (deconEnd - deconStart));
  if (p <= holdEnd) return 1;
  return 1 - easeOutBack(clamp01((p - holdEnd) / (reasEnd - holdEnd)));
}
