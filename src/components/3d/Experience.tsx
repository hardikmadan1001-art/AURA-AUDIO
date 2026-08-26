"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, PerspectiveCamera } from "@react-three/drei";
import { Suspense, useRef } from "react";
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
import { scrollState, win, T, at } from "@/lib/scrollState";

const CHROMA_OFFSET = new THREE.Vector2(0.0007, 0.0009);
const ANIM_LERP = (a: number, b: number, dt: number, rate = 3.5) =>
  a + (b - a) * (1 - Math.exp(-rate * Math.min(dt, 0.05)));

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
  // ---------- ACT I — the question ----------
  { p: 0.0, pos: [0, 0.15, 10.5], look: [0, -0.6, 0], fov: 40 }, // VOID
  { p: T.manifesto.start, pos: [-1.6, 0.5, 8.8], look: [0, -0.5, 0], fov: 38 }, // mystery drift
  { p: T.frequencies.end, pos: [0.6, 0.4, 7.4], look: [0, -0.3, 0], fov: 36 }, // awaiting the vessel

  // ---------- ACT II — genesis ----------
  { p: T.origin.mid, pos: [-1.2, 0.3, 8.0], look: [0, -0.2, 0], fov: 37 }, // origin drift
  { p: T.philosophy.mid, pos: [0.8, 0.6, 7.2], look: [0, 0.1, 0], fov: 36 }, // philosophy settle
  { p: T.obsession.mid, pos: [-0.5, 0.4, 7.8], look: [0, 0.0, 0], fov: 37 }, // obsession

  // ---------- ACT III — the vessel (stages 1–3) ----------
  { p: at(T.approach, 0.45), pos: [1.8, 0.85, 5.6], look: [0, 0.1, 0], fov: 36 }, // slow approach
  { p: T.orbit.start, pos: [-0.9, 0.7, 4.4], look: [0, 0.1, 0], fov: 35 }, // arrive alongside
  { p: at(T.orbit, 0.4), pos: [2.6, 1.1, 4.6], look: [0, 0.1, 0], fov: 34 }, // orbit begins
  { p: T.material.start, pos: [-2.4, 0.9, 3.8], look: [0, 0.1, 0], fov: 34 }, // far side of orbit
  { p: at(T.material, 0.55), pos: [-2.2, 0.6, 3.0], look: [0, 0.12, 0], fov: 36 }, // sweep crossing
  { p: T.craft.mid, pos: [-0.5, 0.85, 3.2], look: [0, 0.15, 0], fov: 36 }, // front-top settle

  // ---------- ACT IV — material world ----------
  { p: T.graphene.mid, pos: [1.4, 0.5, 4.2], look: [0, 0.3, 0], fov: 38 }, // graphene lattice
  { p: T.ceramic.mid, pos: [-1.8, 0.3, 3.6], look: [0, 0.3, 0], fov: 40 }, // ceramic close
  { p: T.aluminium.mid, pos: [0.6, 0.6, 4.0], look: [0, 0.25, 0], fov: 37 }, // aluminium billet

  // ---------- ACT V — EMERGENCE: enhanced case reveal (stages 4–8) ----------
  // Glimpse: ultra-intimate push into the seam crack, low angle.
  { p: at(T.glimpse, 0.15), pos: [0, 0.35, 2.8], look: [0, 0.4, 0], fov: 48 }, // approach the seam
  { p: at(T.glimpse, 0.55), pos: [0.3, 0.52, 1.8], look: [0, 0.5, 0], fov: 56 }, // INTO the seam — extreme close
  { p: at(T.glimpse, 0.88), pos: [0, 0.58, 1.6], look: [0, 0.52, 0], fov: 58 }, // hold the crack — tension peak
  // Firstlight: dramatic slow ascent as lid opens, camera rises with it.
  { p: at(T.firstlight, 0.1), pos: [0, 0.4, 1.9], look: [0, 0.55, 0], fov: 54 }, // intimate — first glow
  { p: at(T.firstlight, 0.5), pos: [-0.4, 0.7, 2.4], look: [0, 0.55, 0], fov: 48 }, // rising — lid opening
  { p: at(T.firstlight, 0.9), pos: [-0.6, 0.9, 3.0], look: [0, 0.55, 0], fov: 44 }, // tall — lid almost full
  // Rise: sweeping dramatic pull-back as buds emerge one at a time.
  { p: at(T.rise, 0.15), pos: [-0.3, 1.0, 3.4], look: [0, 0.6, 0], fov: 42 }, // first bud lifts
  { p: at(T.rise, 0.5), pos: [0.6, 1.15, 4.5], look: [0, 0.55, 0], fov: 38 }, // pull back — both rising
  { p: at(T.rise, 0.9), pos: [0.3, 0.8, 5.2], look: [0, 0.5, 0], fov: 36 }, // settling into formation
  // Separation: wide frame showing two distinct objects.
  { p: at(T.separation, 0.3), pos: [0, 0.6, 5.8], look: [0, 0.48, 0], fov: 36 }, // objects apart
  { p: T.separation.end, pos: [0, 0.55, 6.6], look: [0, 0.45, 0], fov: 35 }, // two distinct objects

  // ---------- ACT V.5 — graphene / ceramic / aluminium world ----------
  { p: T.hero.start, pos: [0, 0.5, 7.2], look: [0, 0.4, 0], fov: 37 }, // hero approach
  { p: T.hero.end, pos: [0, 0.45, 6.2], look: [0, 0.4, 0], fov: 36 }, // HERO duo framing
  { p: T.waves.mid, pos: [1.7, 0.3, 4.5], look: [0, 0.4, 0], fov: 40 }, // audio waves
  { p: T.driver.mid, pos: [-1.6, -0.1, 3.2], look: [0, 0.35, 0], fov: 44 }, // driver macro
  { p: T.interlude.mid, pos: [0, 0.3, 8.2], look: [0, 0.3, 0], fov: 38 }, // interlude breath

  // ---------- ACT VII — internal components ----------
  { p: T.engineering.mid, pos: [0.5, 0.4, 6.0], look: [0, 0.3, 0], fov: 40 },
  { p: at(T.explosion, 0.15), pos: [0, 0.6, 7.0], look: [0, 0.3, 0], fov: 38 }, // explosion begins
  { p: at(T.explosion, 0.35), pos: [0.8, 0.55, 6.8], look: [0, 0.3, 0], fov: 38 }, // fully exploded
  { p: at(T.explosion, 0.65), pos: [1.4, 0.35, 6.0], look: [0, 0.3, 0], fov: 40 }, // inspecting parts
  { p: T.shell.mid, pos: [-0.8, 0.3, 5.5], look: [0, 0.3, 0], fov: 40 }, // shell layer
  { p: T.processor.mid, pos: [-1.1, 0.2, 5.8], look: [0, 0.25, 0], fov: 40 }, // processor chip

  // ---------- ACT VIII — sound engineering ----------
  { p: T.cell.mid, pos: [0.8, 0.4, 5.2], look: [0, 0.3, 0], fov: 38 },
  { p: T.anc.mid, pos: [-1.8, -0.25, 3.7], look: [0, 0.35, 0], fov: 42 }, // ANC low angle
  { p: T.power.mid, pos: [0.9, 0.5, 3.5], look: [0, 0.4, 0], fov: 40 }, // power closeup
  { p: T.connect.mid, pos: [0, 0.05, 2.9], look: [0, 0.45, 0], fov: 50 }, // connectivity close

  // ---------- ACT IX — resonance ----------
  { p: T.resonance.mid, pos: [0, 0.4, 4.8], look: [0, 0.45, 0], fov: 38 }, // resonance orbit
  { p: T.harmonics.mid, pos: [-1.5, 0.3, 4.2], look: [0, 0.4, 0], fov: 40 }, // harmonics close
  { p: T.overtones.mid, pos: [0.8, 0.5, 5.0], look: [0, 0.4, 0], fov: 37 }, // overtones drift

  // ---------- ACT X — experience ----------
  { p: T.spatial.mid, pos: [0, 0.25, 5.4], look: [0, 0.45, 0], fov: 38 }, // spatial wide
  { p: T.touch.mid, pos: [-0.9, 0.35, 2.9], look: [0, 0.4, 0], fov: 46 }, // materials macro

  // ---------- ACT XI — ecosystem ----------
  { p: T.family.mid, pos: [0, 0.5, 6.2], look: [0, 0.3, 0], fov: 36 }, // trio wide
  { p: T.versus.mid, pos: [0, 0.4, 6.6], look: [0, 0.3, 0], fov: 36 },

  // ---------- ACT XII — precision assembly ----------
  { p: T.assembly.mid, pos: [0, 1.2, 4.5], look: [0, 0.3, 0], fov: 36 }, // overhead clinical
  { p: T.calibration.mid, pos: [-0.6, 0.5, 3.8], look: [0, 0.35, 0], fov: 40 }, // calibration close
  { p: T.certification.mid, pos: [0.4, 0.6, 5.0], look: [0, 0.3, 0], fov: 37 }, // certification

  // ---------- ACT XIII — future of listening ----------
  { p: T.reassembly.mid, pos: [0, 0.5, 5.5], look: [0, 0.35, 0], fov: 38 }, // parts converge
  { p: at(T.reassembly, 0.9), pos: [0, 0.4, 6.0], look: [0, 0.35, 0], fov: 36 }, // settle
  { p: 1.0, pos: [0, 0.3, 9.0], look: [0, 0.3, 0], fov: 32 }, // FINAL HERO pull-back — grand
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
    const arrival = win(p, T.approach.start, T.material.start);
    const sweepW = win(p, T.material.start, T.material.end);
    const glimpse = win(p, T.glimpse.start, T.glimpse.end);
    const firstlight = win(p, T.firstlight.start, T.firstlight.end);
    const opened = win(p, T.firstlight.start, T.rise.start);
    const hero = win(p, T.hero.start, T.hero.end);
    const sound = win(p, T.waves.start, T.waves.end);
    const anc = win(p, T.anc.start, T.anc.end);
    const power = win(p, T.power.start, T.power.end);
    const spatial = win(p, T.spatial.start, T.spatial.end);
    const eng = win(p, T.explosion.start, T.cell.end);
    const resonance = win(p, T.resonance.start, T.overtones.end);
    const assembly = win(p, T.assembly.start, T.certification.end);
    const finale = win(p, T.final.start, 1);

    // Key light — ramps up through the vessel reveal, peaks at hero.
    if (key.current)
      key.current.intensity =
        (22 +
          arrival * 130 +
          opened * 80 +
          hero * 140 +
          power * 60 +
          eng * 70 +
          glimpse * 20 +
          assembly * 35) *
        (1 - finale * 0.55);
    if (sweep.current) {
      sweep.current.intensity = sweepW * 260;
      const x = -6 + sweepW * 13;
      sweep.current.position.set(x, 4.2, 4);
    }
    if (cyanRim.current)
      cyanRim.current.intensity =
        (6 +
          arrival * 12 +
          sound * 30 +
          anc * 18 +
          eng * 42 +
          glimpse * 14 +
          resonance * 18) *
        (1 - finale * 0.5);
    if (amberFill.current)
      amberFill.current.intensity = 2 + power * 46 + hero * 24 + arrival * 4 - finale * 3;
    if (violetFill.current)
      violetFill.current.intensity = (spatial * 30 + resonance * 22) * (1 - finale * 0.5);
    if (top.current)
      top.current.intensity = 0.7 + arrival * 1.4 + eng * 1.2 + assembly * 0.8 - finale * 0.6;

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
/* Experience                                                          */
/* ------------------------------------------------------------------ */

// Register once at module load — safe on both server and client.
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

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

export default function Experience() {
  // One global ScrollTrigger writes progress into the mutable store.
  // Nothing here ever calls setState while scrolling.
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas
        dpr={[1, typeof window !== "undefined" && window.innerWidth < 768 ? 1.5 : 1.75]}
        gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
        camera={{ position: [0, 0.15, 10.5], fov: 40 }}
        onCreated={({ gl }) => {
          ScrollTrigger.create({
            trigger: document.documentElement,
            start: "top top",
            end: "bottom bottom",
            onUpdate: (self) => {
              scrollState.progress = self.progress;
              scrollState.velocity = self.getVelocity();
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
          <PremiumEarbud />
          <StudioEnvironment />
        </Suspense>

        <PostFx />
      </Canvas>
    </div>
  );
}
