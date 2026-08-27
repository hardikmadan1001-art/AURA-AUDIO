/**
 * STORY REGISTRY — the single source of truth for the film's structure.
 *
 * Every scene declares its length in vh. From those real weights we
 * derive the global 0→1 progress windows consumed by the WebGL layer,
 * the GSAP choreography and the HUD — so the screenplay and the film
 * can never drift apart.
 *
 * NEW STRUCTURE: 5 mystery acts (no product) → product reveal → finale
 *
 * ACT I   — The Silence Before Sound (procedural sound sculpture)
 * ACT II  — A Thousand Failures (prototype graveyard)
 * ACT III — Inside the Sound (frequency tunnel)
 * ACT IV  — 1100 Iterations (particle reduction)
 * ACT V   — The Discovery (energy core monolith)
 * ──── PRODUCT REVEAL ────
 * ACT VI  — Case emergence + opening
 * ACT VII — Earbuds rising + separation
 * ACT VIII — Engineering deep-dive
 * ACT IX  — Materials + features
 * ACT X   — Resonance + spatial
 * ACT XI  — Ecosystem + assembly
 * ACT XII — Final hero + pre-order
 */

export type SceneDef = {
  id: string;
  name: string;
  act: number;
  /** Section height in vh — also used directly by the DOM overlay. */
  vh: number;
  /** If true, the 3D product model stays hidden until the reveal. */
  mystery?: boolean;
};

export const ACTS = [
  { n: "I", title: "The Silence Before Sound" },
  { n: "II", title: "A Thousand Failures" },
  { n: "III", title: "Inside the Sound" },
  { n: "IV", title: "1100 Iterations" },
  { n: "V", title: "The Discovery" },
  /* ──── PRODUCT REVEAL ──── */
  { n: "VI", title: "The Vessel" },
  { n: "VII", title: "Emergence" },
  { n: "VIII", title: "Acoustic Architecture" },
  { n: "IX", title: "Internal Components" },
  { n: "X", title: "Sound Engineering" },
  { n: "XI", title: "Resonance" },
  { n: "XII", title: "Future of Listening" },
] as const;

export const SCENES: SceneDef[] = [
  /* ============ ACT I — THE SILENCE BEFORE SOUND ============ */
  { id: "silence", name: "The Silence", act: 1, vh: 400, mystery: true },
  { id: "overture", name: "Overture", act: 1, vh: 200, mystery: true },
  { id: "manifesto", name: "Manifesto", act: 1, vh: 200, mystery: true },
  { id: "wavescape", name: "Wavescape", act: 1, vh: 200, mystery: true },
  { id: "signal", name: "Signal", act: 1, vh: 200, mystery: true },
  { id: "sonicform", name: "Sonic Form", act: 1, vh: 200, mystery: true },
  { id: "frequencies", name: "Frequencies", act: 1, vh: 200, mystery: true },

  /* ============ ACT II — A THOUSAND FAILURES ============ */
  { id: "graveyard", name: "The Graveyard", act: 2, vh: 440, mystery: true },
  { id: "origin", name: "Origin", act: 2, vh: 200, mystery: true },
  { id: "fragments", name: "Fragments", act: 2, vh: 200, mystery: true },
  { id: "philosophy", name: "Philosophy", act: 2, vh: 200, mystery: true },
  { id: "obsession", name: "Obsession", act: 2, vh: 200, mystery: true },
  { id: "ruins", name: "Ruins", act: 2, vh: 200, mystery: true },

  /* ============ ACT III — INSIDE THE SOUND ============ */
  { id: "tunnel", name: "The Tunnel", act: 3, vh: 460, mystery: true },
  { id: "frequency", name: "Frequency", act: 3, vh: 400, mystery: true },
  { id: "resonance_chamber", name: "Resonance Chamber", act: 3, vh: 380, mystery: true },

  /* ============ ACT IV — 1100 ITERATIONS ============ */
  { id: "iterations", name: "1100", act: 4, vh: 420, mystery: true },
  { id: "convergence", name: "Convergence", act: 4, vh: 380, mystery: true },
  { id: "singular", name: "The One", act: 4, vh: 340, mystery: true },

  /* ============ ACT V — THE DISCOVERY ============ */
  { id: "monolith", name: "The Monolith", act: 5, vh: 400, mystery: true },
  { id: "awakening", name: "Awakening", act: 5, vh: 360, mystery: true },

  /* ════════════════════ PRODUCT REVEAL ════════════════════ */

  /* ============ ACT VI — THE VESSEL ============ */
  { id: "emergence", name: "Emergence", act: 6, vh: 380 },
  { id: "approach", name: "Approach", act: 6, vh: 380 },
  { id: "orbit", name: "Orbit", act: 6, vh: 400 },
  { id: "material", name: "Material", act: 6, vh: 340 },
  { id: "craft", name: "Craft", act: 6, vh: 320 },
  { id: "graphene", name: "Graphene", act: 6, vh: 360 },
  { id: "ceramic", name: "Ceramic", act: 6, vh: 320 },
  { id: "aluminium", name: "Aluminium", act: 6, vh: 300 },

  /* ============ ACT VII — EMERGENCE ============ */
  { id: "glimpse", name: "Glimpse", act: 7, vh: 340 },
  { id: "firstlight", name: "First Light", act: 7, vh: 280 },
  { id: "rise", name: "Rise", act: 7, vh: 380 },
  { id: "separation", name: "Separation", act: 7, vh: 300 },

  /* ============ ACT VIII — ACOUSTIC ARCHITECTURE ============ */
  { id: "hero", name: "Aura One", act: 8, vh: 380 },
  { id: "waves", name: "Waves", act: 8, vh: 340 },
  { id: "driver", name: "Driver", act: 8, vh: 300 },
  { id: "interlude", name: "Interlude", act: 8, vh: 300 },
  { id: "spatial", name: "Spatial", act: 8, vh: 320 },
  { id: "touch", name: "Touch", act: 8, vh: 300 },

  /* ============ ACT IX — INTERNAL COMPONENTS ============ */
  { id: "engineering", name: "Engineering", act: 9, vh: 280 },
  { id: "explosion", name: "Deconstruction", act: 9, vh: 680 },
  { id: "shell", name: "The Shell", act: 9, vh: 280 },
  { id: "processor", name: "Processor", act: 9, vh: 280 },

  /* ============ ACT X — SOUND ENGINEERING ============ */
  { id: "cell", name: "The Cell", act: 10, vh: 280 },
  { id: "anc", name: "Silence", act: 10, vh: 320 },
  { id: "power", name: "Power", act: 10, vh: 300 },
  { id: "connect", name: "Connectivity", act: 10, vh: 280 },
  { id: "family", name: "Family", act: 10, vh: 340 },
  { id: "versus", name: "Versus", act: 10, vh: 280 },

  /* ============ ACT XI — RESONANCE ============ */
  { id: "resonance", name: "Resonance", act: 11, vh: 360 },
  { id: "harmonics", name: "Harmonics", act: 11, vh: 320 },
  { id: "overtones", name: "Overtones", act: 11, vh: 300 },
  { id: "assembly", name: "Assembly", act: 11, vh: 360 },
  { id: "calibration", name: "Calibration", act: 11, vh: 320 },
  { id: "certification", name: "Certification", act: 11, vh: 280 },

  /* ============ ACT XII — FUTURE OF LISTENING ============ */
  { id: "reassembly", name: "Reassembly", act: 12, vh: 300 },
  { id: "final", name: "Hear Everything", act: 12, vh: 420 },
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

/** The scroll progress at which the 3D product becomes visible. */
const REVEAL_SCENE = WINDOWS.get("emergence");
export const REVEAL_PROGRESS = REVEAL_SCENE?.start ?? 0.48;
