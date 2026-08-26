/**
 * STORY REGISTRY — the single source of truth for the film's structure.
 *
 * Every scene declares its length in vh. From those real weights we
 * derive the global 0→1 progress windows consumed by the WebGL layer,
 * the GSAP choreography and the HUD — so the screenplay and the film
 * can never drift apart.
 *
 * Fifteen acts. Extended cinematic pacing.
 */

export type SceneDef = {
  id: string;
  name: string;
  act: number;
  /** Section height in vh — also used directly by the DOM overlay. */
  vh: number;
};

export const ACTS = [
  { n: "I", title: "The Question" },
  { n: "II", title: "Genesis" },
  { n: "III", title: "The Vessel" },
  { n: "IV", title: "Material World" },
  { n: "V", title: "Emergence" },
  { n: "VI", title: "Acoustic Architecture" },
  { n: "VII", title: "Internal Components" },
  { n: "VIII", title: "Sound Engineering" },
  { n: "IX", title: "Resonance" },
  { n: "X", title: "Experience" },
  { n: "XI", title: "Ecosystem" },
  { n: "XII", title: "Precision Assembly" },
  { n: "XIII", title: "Future of Listening" },
] as const;

export const SCENES: SceneDef[] = [
  /* ---------------- ACT I — THE QUESTION ---------------- */
  { id: "overture", name: "Overture", act: 1, vh: 360 },
  { id: "manifesto", name: "Manifesto", act: 1, vh: 340 },
  { id: "signal", name: "Signal", act: 1, vh: 320 },
  { id: "frequencies", name: "Frequencies", act: 1, vh: 280 },

  /* ---------------- ACT II — GENESIS ---------------- */
  { id: "origin", name: "Origin", act: 2, vh: 380 },
  { id: "philosophy", name: "Philosophy", act: 2, vh: 340 },
  { id: "obsession", name: "Obsession", act: 2, vh: 320 },

  /* ---------------- ACT III — THE VESSEL ---------------- */
  { id: "approach", name: "Approach", act: 3, vh: 380 },
  { id: "orbit", name: "Orbit", act: 3, vh: 400 },
  { id: "material", name: "Material", act: 3, vh: 340 },
  { id: "craft", name: "Craft", act: 3, vh: 320 },

  /* ---------------- ACT IV — MATERIAL WORLD ---------------- */
  { id: "graphene", name: "Graphene", act: 4, vh: 360 },
  { id: "ceramic", name: "Ceramic", act: 4, vh: 320 },
  { id: "aluminium", name: "Aluminium", act: 4, vh: 300 },

  /* ---------------- ACT V — EMERGENCE ---------------- */
  { id: "glimpse", name: "Glimpse", act: 5, vh: 340 },
  { id: "firstlight", name: "First Light", act: 5, vh: 280 },
  { id: "rise", name: "Rise", act: 5, vh: 380 },
  { id: "separation", name: "Separation", act: 5, vh: 300 },

  /* ------------- ACT VI — ACOUSTIC ARCHITECTURE ------------ */
  { id: "hero", name: "Aura One", act: 6, vh: 380 },
  { id: "waves", name: "Waves", act: 6, vh: 340 },
  { id: "driver", name: "Driver", act: 6, vh: 300 },
  { id: "interlude", name: "Interlude", act: 6, vh: 300 },

  /* ----------- ACT VII — INTERNAL COMPONENTS ----------- */
  { id: "engineering", name: "Engineering", act: 7, vh: 280 },
  { id: "explosion", name: "Deconstruction", act: 7, vh: 680 },
  { id: "shell", name: "The Shell", act: 7, vh: 280 },
  { id: "processor", name: "Processor", act: 7, vh: 280 },

  /* ------------ ACT VIII — SOUND ENGINEERING ------------ */
  { id: "cell", name: "The Cell", act: 8, vh: 280 },
  { id: "anc", name: "Silence", act: 8, vh: 320 },
  { id: "power", name: "Power", act: 8, vh: 300 },
  { id: "connect", name: "Connectivity", act: 8, vh: 280 },

  /* --------------- ACT IX — RESONANCE --------------- */
  { id: "resonance", name: "Resonance", act: 9, vh: 360 },
  { id: "harmonics", name: "Harmonics", act: 9, vh: 320 },
  { id: "overtones", name: "Overtones", act: 9, vh: 300 },

  /* ---------------- ACT X — EXPERIENCE ---------------- */
  { id: "spatial", name: "Spatial", act: 10, vh: 320 },
  { id: "touch", name: "Touch", act: 10, vh: 300 },

  /* ---------------- ACT XI — ECOSYSTEM ---------------- */
  { id: "family", name: "Family", act: 11, vh: 340 },
  { id: "versus", name: "Versus", act: 11, vh: 280 },

  /* --------------- ACT XII — PRECISION ASSEMBLY --------------- */
  { id: "assembly", name: "Assembly", act: 12, vh: 360 },
  { id: "calibration", name: "Calibration", act: 12, vh: 320 },
  { id: "certification", name: "Certification", act: 12, vh: 280 },

  /* ---------- ACT XIII — FUTURE OF LISTENING ---------- */
  { id: "reassembly", name: "Reassembly", act: 13, vh: 300 },
  { id: "final", name: "Hear Everything", act: 13, vh: 420 },
];

export const TOTAL_VH = SCENES.reduce((sum, s) => sum + s.vh, 0);

export const sceneVh = (id: string): number =>
  SCENES.find((s) => s.id === id)?.vh ?? 100;

export type Window = { start: number; end: number; mid: number };

/* Pre-computed cumulative windows — module init cost only. */
const WINDOWS = (() => {
  const map = new Map<string, Window>();
  let acc = 0;
  for (const s of SCENES) {
    const start = acc / TOTAL_VH;
    const end = (acc + s.vh) / TOTAL_VH;
    map.set(s.id, { start, end, mid: (start + end) / 2 });
    acc += s.vh;
  }
  return map;
})();

const NULL_WINDOW: Window = { start: 0, end: 0, mid: 0 };

export const sceneWindow = (id: string): Window =>
  WINDOWS.get(id) ?? NULL_WINDOW;

export const sceneStart = (id: string): number => sceneWindow(id).start;

/** Midpoint of a scene's window on the global timeline. */
export const sceneMid = (id: string): number => sceneWindow(id).mid;
