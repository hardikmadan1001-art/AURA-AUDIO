"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, PerspectiveCamera } from "@react-three/drei";
import { Suspense, useRef, useState, useEffect, useCallback, useMemo } from "react";
import {
  Bloom,
  EffectComposer,
  Noise,
  Vignette,
  ChromaticAberration,
} from "@react-three/postprocessing";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";
import PremiumEarbud from "./PremiumEarbud";
import MysteryScenes from "./MysteryScenes";
import { scrollState, win, T, at, computeProductVisibility, computeMysteryIntensity } from "@/lib/scrollState";

const CHROMA_OFFSET = new THREE.Vector2(0.0007, 0.0009);
const ANIM_LERP = (a: number, b: number, dt: number, rate = 3.5) =>
  a + (b - a) * (1 - Math.exp(-rate * Math.min(dt, 0.05)));

/* ------------------------------------------------------------------ */
/* Dynamic DPR hook — scales canvas resolution to prevent stutter      */
/* on mobile GPUs / Safari while keeping desktop buttery.              */
/* ------------------------------------------------------------------ */

function useDynamicDpr(): [number, number] {
  const [dpr, setDpr] = useState<[number, number]>(() => {
    if (typeof window === "undefined") return [1, 1.5];
    const isMobile = window.innerWidth < 768;
    const isLowPower =
      navigator.hardwareConcurrency <= 4 ||
      /Mobi|Android/i.test(navigator.userAgent);
    const max = isLowPower ? 1.25 : isMobile ? 1.5 : 1.75;
    return [1, max];
  });

  useEffect(() => {
    let frameId: number;
    let lastCheck = Date.now();
    const CHECK_INTERVAL = 5000; // re-evaluate every 5s

    const check = () => {
      const now = Date.now();
      if (now - lastCheck < CHECK_INTERVAL) {
        frameId = requestAnimationFrame(check);
        return;
      }
      lastCheck = now;

      const isMobile = window.innerWidth < 768;
      const isLowPower =
        navigator.hardwareConcurrency <= 4 ||
        /Mobi|Android/i.test(navigator.userAgent);
      const max = isLowPower ? 1.25 : isMobile ? 1.5 : 1.75;

      setDpr((prev) => {
        if (prev[1] !== max) return [1, max];
        return prev;
      });

      frameId = requestAnimationFrame(check);
    };

    frameId = requestAnimationFrame(check);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return dpr;
}

/* ------------------------------------------------------------------ */
/* Cinematic camera: keyframed dolly, scrubbed by scroll               */
/*                                                                     */
/* Keys follow the nine acts:                                          */
/*   ACT I    void drift — nothing to see yet                          */
/*   ACT II   approach + orbit around the closed vessel, light sweep   */
/*   ACT III  push into the seam, hold, then rise & separation         */
/*   ACT IV   hero framing, waves film, driver macro                   */
/*   ACT V    pull wide for the exploded constellation                 */
/*   ACT VI   one framing per engineering film                         */
/*   ACT VII  spatial wide, materials macro                            */
/*   ACT VIII ecosystem trio                                           */
/*   ACT IX   reassembly settle + final hero pull-back                 */
/* ------------------------------------------------------------------ */

type CamKey = {
  p: number;
  pos: [number, number, number];
  look: [number, number, number];
  fov: number;
};

const CAM_KEYS: CamKey[] = [
  // ══════ MYSTERY ACTS I–V — no product, pure atmosphere ══════
  // ACT I — The Silence Before Sound: slow orbit through particle waves
  { p: 0.0, pos: [0, 0.5, 12], look: [0, 0, 0], fov: 42 }, // void — nothing yet
  { p: at(T.silence, 0.3), pos: [3, 1.0, 10], look: [0, 0, -1], fov: 40 }, // drift into the sculpture
  { p: T.wavescape.start, pos: [-2, 0.8, 8], look: [0, 0.2, 0], fov: 38 }, // orbiting the wave landscape
  { p: T.wavescape.mid, pos: [0, 1.5, 6], look: [0, 0, 0], fov: 36 }, // above the particles
  { p: T.sonicform.start, pos: [4, 0.3, 7], look: [0, 0.5, 0], fov: 40 }, // close to the wireframe
  { p: T.sonicform.end, pos: [0, 0.6, 9], look: [0, 0.2, 0], fov: 42 }, // pull back — mystery deepens

  // ACT II — A Thousand Failures: drift through debris field
  { p: at(T.graveyard, 0.1), pos: [-3, 0.5, 10], look: [0, 0, -2], fov: 38 }, // approach the graveyard
  { p: T.graveyard.mid, pos: [0, 0.3, 6], look: [0, 0.2, -1], fov: 36 }, // through the debris
  { p: T.fragments.start, pos: [2, -0.2, 5], look: [0, 0.3, 0], fov: 38 }, // among fragments
  { p: T.fragments.mid, pos: [-1, 0.4, 7], look: [0, 0.1, 0], fov: 40 }, // wider view of destruction
  { p: T.ruins.start, pos: [0, 0.8, 8], look: [0, 0, 0], fov: 42 }, // pulling away from ruins

  // ACT III — Inside the Sound: dive into frequency tunnel
  { p: at(T.tunnel, 0.05), pos: [0, 0, 10], look: [0, 0, -4], fov: 50 }, // mouth of the tunnel
  { p: at(T.tunnel, 0.3), pos: [0, 0.3, 6], look: [0, 0, -3], fov: 56 }, // diving in
  { p: T.frequency.start, pos: [0.5, 0.2, 3], look: [0, 0, -2], fov: 60 }, // deep inside
  { p: T.frequency.mid, pos: [0, 0, 1], look: [0, 0, -1], fov: 64 }, // maximum immersion
  { p: T.resonance_chamber.start, pos: [-0.5, 0.4, 4], look: [0, 0, -1], fov: 52 }, // emerging
  { p: T.resonance_chamber.end, pos: [0, 0.6, 8], look: [0, 0, 0], fov: 44 }, // back to open space

  // ACT IV — 1100 Iterations: observe particle reduction
  { p: at(T.iterations, 0.1), pos: [4, 2, 8], look: [0, 0, 0], fov: 38 }, // overview of all clusters
  { p: T.iterations.mid, pos: [0, 1.5, 6], look: [0, 0, 0], fov: 36 }, // watching reduction
  { p: T.convergence.start, pos: [-2, 0.8, 5], look: [0, 0.2, 0], fov: 38 }, // clusters thinning
  { p: T.convergence.mid, pos: [0, 0.5, 4], look: [0, 0.3, 0], fov: 40 }, // approaching singularity
  { p: T.singular.start, pos: [0, 0.3, 3], look: [0, 0.4, 0], fov: 42 }, // the last cluster
  { p: T.singular.end, pos: [0, 0.5, 5], look: [0, 0.2, 0], fov: 44 }, // one remains

  // ACT V — The Discovery: energy core monolith
  { p: at(T.monolith, 0.1), pos: [3, 1.0, 8], look: [0, 0.5, 0], fov: 38 }, // first glimpse of the monolith
  { p: T.monolith.mid, pos: [0, 0.8, 5], look: [0, 0.5, 0], fov: 36 }, // orbiting the core
  { p: at(T.monolith, 0.8), pos: [-2, 0.6, 4], look: [0, 0.6, 0], fov: 38 }, // close approach
  { p: T.awakening.start, pos: [0, 0.4, 3], look: [0, 0.7, 0], fov: 42 }, // energy building
  { p: T.awakening.mid, pos: [0, 0.3, 2], look: [0, 0.8, 0], fov: 48 }, // climax — maximum tension
  { p: T.awakening.end, pos: [0, 0.2, 4], look: [0, 0.5, 0], fov: 44 }, // pull back for the reveal

  // ══════ PRODUCT REVEAL — ACT VI onwards ══════
  // ACT VI — The Vessel: case emergence from darkness
  { p: at(T.emergence, 0.3), pos: [0, 0.3, 8], look: [0, 0, 0], fov: 40 }, // vessel appears
  { p: T.orbit.start, pos: [-1.5, 0.7, 6], look: [0, 0.1, 0], fov: 36 }, // arrive alongside
  { p: at(T.orbit, 0.4), pos: [2.5, 1.0, 5.5], look: [0, 0.1, 0], fov: 34 }, // orbit begins
  { p: T.material.start, pos: [-2.2, 0.8, 4.5], look: [0, 0.1, 0], fov: 34 }, // far side
  { p: at(T.material, 0.55), pos: [-2.0, 0.5, 3.5], look: [0, 0.12, 0], fov: 36 }, // material sweep
  { p: T.craft.mid, pos: [-0.5, 0.8, 3.8], look: [0, 0.15, 0], fov: 36 }, // front settle

  // ACT VII — Emergence: case opening + earbuds rising
  { p: at(T.glimpse, 0.15), pos: [0, 0.35, 3.2], look: [0, 0.4, 0], fov: 48 }, // approach seam
  { p: at(T.glimpse, 0.55), pos: [0.3, 0.52, 2.2], look: [0, 0.5, 0], fov: 56 }, // extreme close
  { p: at(T.glimpse, 0.88), pos: [0, 0.58, 2.0], look: [0, 0.52, 0], fov: 58 }, // hold the crack
  { p: at(T.firstlight, 0.1), pos: [0, 0.4, 2.4], look: [0, 0.55, 0], fov: 54 }, // first glow
  { p: at(T.firstlight, 0.5), pos: [-0.4, 0.7, 2.8], look: [0, 0.55, 0], fov: 48 }, // lid opening
  { p: at(T.firstlight, 0.9), pos: [-0.6, 0.9, 3.5], look: [0, 0.55, 0], fov: 44 }, // lid almost full
  { p: at(T.rise, 0.15), pos: [-0.3, 1.0, 4.0], look: [0, 0.6, 0], fov: 42 }, // first bud lifts
  { p: at(T.rise, 0.5), pos: [0.6, 1.15, 5.0], look: [0, 0.55, 0], fov: 38 }, // both rising
  { p: at(T.rise, 0.9), pos: [0.3, 0.8, 5.8], look: [0, 0.5, 0], fov: 36 }, // settling
  { p: at(T.separation, 0.3), pos: [0, 0.6, 6.5], look: [0, 0.48, 0], fov: 36 }, // apart
  { p: T.separation.end, pos: [0, 0.55, 7.0], look: [0, 0.45, 0], fov: 35 }, // two objects

  // ACT VIII — Acoustic Architecture: hero + waves + driver
  { p: T.hero.start, pos: [0, 0.5, 7.5], look: [0, 0.4, 0], fov: 37 }, // hero approach
  { p: T.hero.end, pos: [0, 0.45, 6.5], look: [0, 0.4, 0], fov: 36 }, // HERO framing
  { p: T.waves.mid, pos: [1.7, 0.3, 5.0], look: [0, 0.4, 0], fov: 40 }, // audio waves
  { p: T.driver.mid, pos: [-1.6, -0.1, 3.5], look: [0, 0.35, 0], fov: 44 }, // driver macro
  { p: T.interlude.mid, pos: [0, 0.3, 8.5], look: [0, 0.3, 0], fov: 38 }, // interlude

  // ACT IX — Internal Components: engineering + explosion
  { p: T.engineering.mid, pos: [0.5, 0.4, 6.5], look: [0, 0.3, 0], fov: 40 },
  { p: at(T.explosion, 0.15), pos: [0, 0.6, 7.5], look: [0, 0.3, 0], fov: 38 },
  { p: at(T.explosion, 0.35), pos: [0.8, 0.55, 7.2], look: [0, 0.3, 0], fov: 38 },
  { p: at(T.explosion, 0.65), pos: [1.4, 0.35, 6.5], look: [0, 0.3, 0], fov: 40 },
  { p: T.shell.mid, pos: [-0.8, 0.3, 6.0], look: [0, 0.3, 0], fov: 40 },
  { p: T.processor.mid, pos: [-1.1, 0.2, 6.2], look: [0, 0.25, 0], fov: 40 },

  // ACT X — Sound Engineering
  { p: T.cell.mid, pos: [0.8, 0.4, 5.5], look: [0, 0.3, 0], fov: 38 },
  { p: T.anc.mid, pos: [-1.8, -0.25, 4.0], look: [0, 0.35, 0], fov: 42 },
  { p: T.power.mid, pos: [0.9, 0.5, 3.8], look: [0, 0.4, 0], fov: 40 },
  { p: T.connect.mid, pos: [0, 0.05, 3.2], look: [0, 0.45, 0], fov: 50 },

  // ACT XI — Resonance
  { p: T.resonance.mid, pos: [0, 0.4, 5.2], look: [0, 0.45, 0], fov: 38 },
  { p: T.harmonics.mid, pos: [-1.5, 0.3, 4.6], look: [0, 0.4, 0], fov: 40 },
  { p: T.overtones.mid, pos: [0.8, 0.5, 5.5], look: [0, 0.4, 0], fov: 37 },

  // ACT XII — Future of Listening: finale
  { p: T.reassembly.mid, pos: [0, 0.5, 6.0], look: [0, 0.35, 0], fov: 38 },
  { p: at(T.reassembly, 0.9), pos: [0, 0.4, 6.5], look: [0, 0.35, 0], fov: 36 },
  { p: 1.0, pos: [0, 0.3, 9.5], look: [0, 0.3, 0], fov: 32 }, // FINAL pull-back
];

const smooth = (t: number) => t * t * (3 - 2 * t);
const vA = new THREE.Vector3();
const vB = new THREE.Vector3();
const vLook = new THREE.Vector3();
const vPar = new THREE.Vector3();

function CameraRig() {
  const camRef = useRef<THREE.PerspectiveCamera>(null);
  const lookAt = useRef(new THREE.Vector3(0, -0.6, 0));
  const parallax = useRef(new THREE.Vector3());

  useFrame(({ pointer, clock }, dt) => {
    const cam = camRef.current;
    if (!cam) return;
    const p = scrollState.progress;

    // Locate the segment.
    let i = 0;
    while (i < CAM_KEYS.length - 2 && p > CAM_KEYS[i + 1].p) i++;
    const a = CAM_KEYS[i];
    const b = CAM_KEYS[i + 1];
    const t = smooth(Math.min(1, Math.max(0, (p - a.p) / (b.p - a.p))));

    // Pointer parallax — a subtle operator's hand on the frame.
    vPar.set(pointer.x * 0.22, pointer.y * 0.12, 0);

    // Slow ambient sway — the world breathes between scroll ticks.
    const breath = clock.elapsedTime * 0.25;
    const swayX = Math.sin(breath) * 0.025;
    const swayY = Math.cos(breath * 0.7) * 0.018;

    vA.set(...a.pos).lerp(vB.set(...b.pos), t).add(vPar);
    vA.x += swayX;
    vA.y += swayY;
    const targetLook = vLook.set(...a.look);
    const targetFov = a.fov + (b.fov - a.fov) * t;

    // Frame-rate independent damping — the "operator" hand.
    const k = 1 - Math.exp(-4.5 * Math.min(dt, 0.05));
    cam.position.lerp(vA, k);
    parallax.current.lerp(vPar, k * 0.6);
    lookAt.current.lerp(targetLook, k);
    cam.lookAt(lookAt.current);
    if (Math.abs(cam.fov - targetFov) > 0.01) {
      cam.fov += (targetFov - cam.fov) * k;
      cam.updateProjectionMatrix();
    }
  });

  return <PerspectiveCamera ref={camRef} makeDefault fov={42} near={0.1} far={60} />;
}

/* ------------------------------------------------------------------ */
/* Lighting console — every act has its own lighting cue, plus the     */
/* dedicated MATERIAL sweep that reveals surface quality in ACT II.    */
/* ------------------------------------------------------------------ */

function Lights() {
  const key = useRef<THREE.SpotLight>(null);
  const sweep = useRef<THREE.SpotLight>(null);
  const cyanRim = useRef<THREE.PointLight>(null);
  const amberFill = useRef<THREE.PointLight>(null);
  const violetFill = useRef<THREE.PointLight>(null);
  const top = useRef<THREE.DirectionalLight>(null);
  // Case reveal drama — blooms during glimpse/firstlight
  const caseReveal = useRef<THREE.PointLight>(null);
  // Resonance glow — purple halo during ACT IX
  const resonanceGlow = useRef<THREE.PointLight>(null);
  // Assembly clinical overhead — cold light for ACT XII
  const assemblyClinical = useRef<THREE.SpotLight>(null);

  useFrame(() => {
    const p = scrollState.progress;
    // Mystery acts lighting
    const mysteryA = win(p, T.silence.start, T.sonicform.end);
    const mysteryB = win(p, T.graveyard.start, T.ruins.end);
    const mysteryC = win(p, T.tunnel.start, T.resonance_chamber.end);
    const mysteryD = win(p, T.iterations.start, T.singular.end);
    const mysteryE = win(p, T.monolith.start, T.awakening.end);
    // Product acts lighting
    const arrival = win(p, T.emergence.start, T.material.start);
    const sweepW = win(p, T.material.start, T.material.end);
    const glimpse = win(p, T.glimpse.start, T.glimpse.end);
    const firstlight = win(p, T.firstlight.start, T.firstlight.end);
    const opened = win(p, T.firstlight.start, T.rise.start);
    const hero = win(p, T.hero.start, T.hero.end);
    const sound = win(p, T.waves.start, T.waves.end);
    const anc = win(p, T.anc.start, T.anc.end);
    const power = win(p, T.power.start, T.power.end);
    const spatial = win(p, T.hero.start, T.hero.end);
    const eng = win(p, T.explosion.start, T.cell.end);
    const resonance = win(p, T.resonance.start, T.overtones.end);
    const assembly = win(p, T.engineering.start, T.processor.end);
    const finale = win(p, T.final.start, 1);

    // Key light — ramps up through mystery acts, peaks at hero.
    if (key.current)
      key.current.intensity =
        (22 +
          mysteryA * 15 + mysteryB * 10 + mysteryC * 20 + mysteryD * 12 + mysteryE * 25 +
          arrival * 130 +
          opened * 80 +
          hero * 140 +
          power * 60 +
          eng * 70 +
          glimpse * 20) *
        (1 - finale * 0.55);
    if (sweep.current) {
      sweep.current.intensity = sweepW * 260;
      const x = -6 + sweepW * 13;
      sweep.current.position.set(x, 4.2, 4);
    }
    if (cyanRim.current)
      cyanRim.current.intensity =
        (6 +
          mysteryC * 30 + mysteryE * 15 +
          arrival * 12 +
          sound * 30 +
          anc * 18 +
          eng * 42 +
          glimpse * 14 +
          resonance * 18) *
        (1 - finale * 0.5);
    if (amberFill.current)
      amberFill.current.intensity = 2 + mysteryE * 20 + power * 46 + hero * 24 + arrival * 4 - finale * 3;
    if (violetFill.current)
      violetFill.current.intensity = (spatial * 30 + resonance * 22) * (1 - finale * 0.5);
    if (top.current)
      top.current.intensity = 0.7 + mysteryA * 0.5 + mysteryC * 0.8 + arrival * 1.4 + eng * 1.2 - finale * 0.6;

    // Case reveal — dramatic warm bloom that peaks between glimpse and firstlight.
    if (caseReveal.current) {
      const caseBloom = glimpse * 0.8 + firstlight * 1.0;
      caseReveal.current.intensity = caseBloom * 180;
      // Light rises as the lid opens.
      caseReveal.current.position.y = 0.3 + firstlight * 0.6;
    }
    // Resonance — purple glow from below during harmonic acts.
    if (resonanceGlow.current) {
      resonanceGlow.current.intensity = resonance * 28;
    }
    // Assembly — clinical overhead spotlight for the cleanroom.
    if (assemblyClinical.current) {
      assemblyClinical.current.intensity = assembly * 85;
    }
  });

  return (
    <>
      <ambientLight intensity={0.08} />
      <spotLight
        ref={key}
        position={[6, 7, 6]}
        angle={0.45}
        penumbra={1}
        intensity={22}
        color="#ffffff"
      />
      {/* Material sweep */}
      <spotLight
        ref={sweep}
        position={[-6, 4.2, 4]}
        angle={0.32}
        penumbra={1}
        intensity={0}
        color="#eaf6ff"
      />
      {/* Cyan rim — engineering + resonance signature */}
      <pointLight ref={cyanRim} position={[-7, 2, -4]} intensity={6} color="#57e6ff" />
      {/* Amber fill — power-system warmth */}
      <pointLight ref={amberFill} position={[4, -4, 3]} intensity={2} color="#ffb45e" />
      {/* Violet fill — spatial + resonance halo */}
      <pointLight ref={violetFill} position={[0, 3, -5]} intensity={0} color="#b48cff" />
      <directionalLight ref={top} position={[0, 8, -2]} intensity={0.7} color="#dfe8ff" />

      {/* Case reveal drama — blooms upward during glimpse/firstlight */}
      <pointLight
        ref={caseReveal}
        position={[0, 0.3, 0.5]}
        intensity={0}
        color="#ffb45e"
        distance={6}
        decay={2}
      />
      {/* Resonance glow — violet halo from below */}
      <pointLight
        ref={resonanceGlow}
        position={[0, -2, 0]}
        intensity={0}
        color="#b48cff"
        distance={8}
        decay={2}
      />
      {/* Assembly clinical — cold overhead for the cleanroom */}
      <spotLight
        ref={assemblyClinical}
        position={[0, 8, 2]}
        angle={0.35}
        penumbra={0.8}
        intensity={0}
        color="#e8f0ff"
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Procedural studio environment — no HDR downloads, fully local       */
/* ------------------------------------------------------------------ */

function StudioEnvironment() {
  return (
    <Environment resolution={256}>
      {/* Soft overhead strip — the classic product-film key reflection */}
      <Lightformer form="rect" intensity={6} position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[8, 2, 1]} />
      {/* Side strips for those long metal highlights */}
      <Lightformer form="rect" intensity={4} position={[-5, 1, -1]} rotation={[0, Math.PI / 2, 0]} scale={[6, 1.2, 1]} />
      <Lightformer form="rect" intensity={3} position={[5, 0.5, 1]} rotation={[0, -Math.PI / 2, 0]} scale={[6, 1, 1]} />
      {/* Cool bounce from below */}
      <Lightformer form="circle" intensity={1.6} color="#57e6ff" position={[0, -4, 2]} scale={4} />
      {/* Warm kicker */}
      <Lightformer form="circle" intensity={1.2} color="#ffb45e" position={[-3, -1, 4]} scale={3} />
    </Environment>
  );
}

/* ------------------------------------------------------------------ */
/* Post-processing — dynamic, mood-aware                               */
/* ------------------------------------------------------------------ */

function PostFx() {
  const noiseRef = useRef<any>(null);
  const vignRef = useRef<any>(null);

  useFrame((_, dt) => {
    const p = scrollState.progress;
    // Mystery peaks during the first three scenes, the hero lifts it,
    // the explosion adds agitation, and the finale settles into confidence.
    const mystery =
      win(p, 0, T.frequencies.end) * 0.55 +
      win(p, T.approach.start, T.orbit.start) * 0.25;
    const heroOpen =
      win(p, T.hero.start, T.hero.end) - win(p, T.engineering.start, T.engineering.end);
    const explosion = win(p, T.explosion.start, T.explosion.end);
    const finale = win(p, T.final.start, 1);

    if (noiseRef.current) {
      const target = 0.08 + explosion * 0.05 - finale * 0.04;
      noiseRef.current.opacity = ANIM_LERP(noiseRef.current.opacity ?? 0.08, target, dt, 2.5);
    }
    if (vignRef.current) {
      // Higher = darker corners. Mystery + finale lean in, hero opens up.
      const target = 0.85 + mystery * 0.45 - heroOpen * 0.25 + finale * 0.1;
      const cur = vignRef.current.darkness ?? 1.05;
      vignRef.current.darkness = ANIM_LERP(cur, target, dt, 2.5);
    }
  });

  return (
    <EffectComposer multisampling={0}>
      <Bloom intensity={0.9} luminanceThreshold={0.5} luminanceSmoothing={0.4} mipmapBlur />
      <ChromaticAberration offset={CHROMA_OFFSET} radialModulation={false} modulationOffset={0} />
      <Noise ref={noiseRef} opacity={0.08} />
      <Vignette ref={vignRef} eskil={false} offset={0.22} darkness={1.05} />
    </EffectComposer>
  );
}

/* ------------------------------------------------------------------ */
/* Experience                                                          */
/* ------------------------------------------------------------------ */

// Register once at module load — safe on both server and client.
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Experience() {
  const dpr = useDynamicDpr();
  const [isMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent);
  });

  // One global ScrollTrigger writes progress into the mutable store.
  // Nothing here ever calls setState while scrolling.
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas
        dpr={dpr}
        frameloop={isMobile ? "demand" : "always"}
        gl={{ antialias: !isMobile, powerPreference: "high-performance", alpha: false }}
        camera={{ position: [0, 0.15, 10.5], fov: 40 }}
        onCreated={({ gl }) => {
          ScrollTrigger.create({
            trigger: document.documentElement,
            start: "top top",
            end: "bottom bottom",
            onUpdate: (self) => {
              scrollState.progress = self.progress;
              scrollState.velocity = self.getVelocity();
              // On-demand: invalidate on scroll for mobile render-on-demand
              if (isMobile) (gl as any).invalidate?.();
            },
          });
          gl.setClearColor("#000000");
          // Render in a film-like tone curve so the highlights don't blow out.
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.1;
        }}
      >
        {/* Depth haze — the fog gives every act real atmosphere layers. */}
        <fog attach="fog" args={["#020409", 11, 34]} />

        <CameraRig />
        <Lights />
        <Suspense fallback={null}>
          <MysteryScenes />
          <PremiumEarbud />
          <StudioEnvironment />
        </Suspense>

        <PostFx />
      </Canvas>
    </div>
  );
}
