/**
 * STORY REGISTRY — the single source of truth for the film's structure.
 *
 * Every scene declares its length in vh. From those real weights we
 * derive the global 0→1 progress windows consumed by the WebGL layer,
 * the GSAP choreography and the HUD — so the screenplay and the film
 * can never drift apart.
 *
 * Nine acts. Slow pacing. Long breaths.
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
  { n: "II", title: "The Vessel" },
  { n: "III", title: "Emergence" },
  { n: "IV", title: "Acoustic Architecture" },
  { n: "V", title: "Internal Components" },
  { n: "VI", title: "Sound Engineering" },
  { n: "VII", title: "Experience" },
  { n: "VIII", title: "Ecosystem" },
  { n: "IX", title: "Future of Listening" },
] as const;

export const SCENES: SceneDef[] = [
  /* ---------------- ACT I — THE QUESTION ---------------- */
  { id: "overture", name: "Overture", act: 1, vh: 360 },
  { id: "manifesto", name: "Manifesto", act: 1, vh: 340 },
  { id: "signal", name: "Signal", act: 1, vh: 320 },
  { id: "frequencies", name: "Frequencies", act: 1, vh: 280 },

  /* ---------------- ACT II — THE VESSEL ---------------- */
  { id: "approach", name: "Approach", act: 2, vh: 380 },
  { id: "orbit", name: "Orbit", act: 2, vh: 400 },
  { id: "material", name: "Material", act: 2, vh: 340 },
  { id: "craft", name: "Craft", act: 2, vh: 320 },

  /* ---------------- ACT III — EMERGENCE ---------------- */
  { id: "glimpse", name: "Glimpse", act: 3, vh: 340 },
  { id: "firstlight", name: "First Light", act: 3, vh: 280 },
  { id: "rise", name: "Rise", act: 3, vh: 380 },
  { id: "separation", name: "Separation", act: 3, vh: 300 },

  /* ------------- ACT IV — ACOUSTIC ARCHITECTURE ------------ */
  { id: "hero", name: "Aura One", act: 4, vh: 380 },
  { id: "waves", name: "Waves", act: 4, vh: 340 },
  { id: "driver", name: "Driver", act: 4, vh: 300 },
  { id: "interlude", name: "Interlude", act: 4, vh: 300 },

  /* ----------- ACT V — INTERNAL COMPONENTS ----------- */
  { id: "engineering", name: "Engineering", act: 5, vh: 260 },
  { id: "explosion", name: "Deconstruction", act: 5, vh: 680 },
  { id: "shell", name: "The Shell", act: 5, vh: 260 },
  { id: "processor", name: "Processor", act: 5, vh: 260 },

  /* ------------ ACT VI — SOUND ENGINEERING ------------ */
  { id: "cell", name: "The Cell", act: 6, vh: 260 },
  { id: "anc", name: "Silence", act: 6, vh: 320 },
  { id: "power", name: "Power", act: 6, vh: 300 },
  { id: "connect", name: "Connectivity", act: 6, vh: 280 },

  /* ---------------- ACT VII — EXPERIENCE ---------------- */
  { id: "spatial", name: "Spatial", act: 7, vh: 300 },
  { id: "touch", name: "Touch", act: 7, vh: 280 },

  /* ---------------- ACT VIII — ECOSYSTEM ---------------- */
  { id: "family", name: "Family", act: 8, vh: 320 },
  { id: "versus", name: "Versus", act: 8, vh: 260 },

  /* ---------- ACT IX — FUTURE OF LISTENING ---------- */
  { id: "reassembly", name: "Reassembly", act: 9, vh: 280 },
  { id: "final", name: "Hear Everything", act: 9, vh: 380 },
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
