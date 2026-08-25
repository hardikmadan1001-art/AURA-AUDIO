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
import { scrollState, win } from "@/lib/scrollState";

/* ------------------------------------------------------------------ */
/* Cinematic camera: keyframed dolly, scrubbed by scroll               */
/* ------------------------------------------------------------------ */

type CamKey = {
  p: number;
  pos: [number, number, number];
  look: [number, number, number];
  fov: number;
};

const CAM_KEYS: CamKey[] = [
  { p: 0.0, pos: [0, 0.1, 9.5], look: [0, -0.5, 0], fov: 42 }, // SILENCE — distant darkness
  { p: 0.1, pos: [0, 0.1, 6.4], look: [0, 0, 0], fov: 38 }, // product lands
  { p: 0.2, pos: [1.7, 0.9, 4.3], look: [0, 0, 0], fov: 36 }, // FIRST CONTACT drift-in
  { p: 0.3, pos: [-2.3, 0.5, 3.8], look: [0, 0, 0], fov: 36 }, // orbit during REVEAL
  { p: 0.42, pos: [0.4, 0.5, 7.6], look: [0, 0, 0], fov: 40 }, // wide — explosion stage
  { p: 0.52, pos: [1.2, 0.35, 6.4], look: [0, 0, 0], fov: 40 },
  { p: 0.62, pos: [0, 0, 2.1], look: [0.45, 0.05, 0.15], fov: 58 }, // INSIDE THE SOUND
  { p: 0.72, pos: [-1.5, -0.5, 3.2], look: [0, -0.1, 0], fov: 42 }, // ANC wide
  { p: 0.81, pos: [0.9, 0.7, 3.7], look: [-0.1, -0.15, 0], fov: 40 }, // POWER closeup
  { p: 0.91, pos: [0, 0.4, 5.6], look: [0, 0, 0], fov: 38 }, // reassembly settle
  { p: 1.0, pos: [0, 0.25, 8.0], look: [0, 0, 0], fov: 36 }, // FINAL HERO pull-back
];

const smooth = (t: number) => t * t * (3 - 2 * t);
const vA = new THREE.Vector3();
const vB = new THREE.Vector3();

function CameraRig() {
  const camRef = useRef<THREE.PerspectiveCamera>(null);
  const lookAt = useRef(new THREE.Vector3(0, -0.5, 0));

  useFrame((_, dt) => {
    const cam = camRef.current;
    if (!cam) return;
    const p = scrollState.progress;

    // Locate the segment.
    let i = 0;
    while (i < CAM_KEYS.length - 2 && p > CAM_KEYS[i + 1].p) i++;
    const a = CAM_KEYS[i];
    const b = CAM_KEYS[i + 1];
    const t = smooth(Math.min(1, Math.max(0, (p - a.p) / (b.p - a.p))));

    vA.set(...a.pos).lerp(vB.set(...b.pos), t);
    const targetLook = vB.set(...a.look).lerp(new THREE.Vector3(...b.look), t);
    const targetFov = a.fov + (b.fov - a.fov) * t;

    // Frame-rate independent damping — the "operator" hand.
    const k = 1 - Math.exp(-4.5 * Math.min(dt, 0.05));
    cam.position.lerp(vA, k);
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
/* Lighting console — every scene has its own lighting cue             */
/* ------------------------------------------------------------------ */

function Lights() {
  const key = useRef<THREE.SpotLight>(null);
  const cyanRim = useRef<THREE.PointLight>(null);
  const amberFill = useRef<THREE.PointLight>(null);
  const top = useRef<THREE.DirectionalLight>(null);

  useFrame(() => {
    const p = scrollState.progress;
    const reveal = win(p, 0.24, 0.38); // ENGINEERING REVEAL
    const sound = win(p, 0.54, 0.66); // INSIDE THE SOUND
    const anc = win(p, 0.64, 0.76); // ANC
    const power = win(p, 0.74, 0.86); // POWER
    const finale = win(p, 0.92, 1); // FINAL HERO dims to confidence

    if (key.current)
      key.current.intensity = (140 + reveal * 160 + power * 80) * (1 - finale * 0.55);
    if (cyanRim.current)
      cyanRim.current.intensity =
        (12 + reveal * 40 + sound * 30 + anc * 20) * (1 - finale * 0.5);
    if (amberFill.current)
      amberFill.current.intensity = 4 + power * 46 + reveal * 10 - finale * 4;
    if (top.current) top.current.intensity = 1.2 + reveal * 1.6 - finale * 0.9;
  });

  return (
    <>
      <ambientLight intensity={0.12} />
      <spotLight
        ref={key}
        position={[6, 7, 6]}
        angle={0.45}
        penumbra={1}
        intensity={140}
        color="#ffffff"
      />
      {/* Cyan rim — the engineering-reveal signature */}
      <pointLight ref={cyanRim} position={[-7, 2, -4]} intensity={12} color="#57e6ff" />
      {/* Amber fill — the power-system warmth */}
      <pointLight ref={amberFill} position={[4, -4, 3]} intensity={4} color="#ffb45e" />
      <directionalLight ref={top} position={[0, 8, -2]} intensity={1.2} color="#dfe8ff" />
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

export default function Experience() {
  // One global ScrollTrigger writes progress into the mutable store.
  // Nothing here ever calls setState while scrolling.
  const registered = useRef(false);
  if (!registered.current && typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
    registered.current = true;
  }

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas
        dpr={[1, typeof window !== "undefined" && window.innerWidth < 768 ? 1.5 : 1.75]}
        gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
        camera={{ position: [0, 0.1, 9.5], fov: 42 }}
        onCreated={({ gl }) => {
          ScrollTrigger.create({
            trigger: document.documentElement,
            start: "top top",
            end: "bottom bottom",
            onUpdate: (self) => {
              scrollState.progress = self.progress;
            },
          });
          gl.setClearColor("#000000");
        }}
      >
        <CameraRig />
        <Lights />
        <Suspense fallback={null}>
          <PremiumEarbud />
          <StudioEnvironment />
        </Suspense>

        <EffectComposer multisampling={0}>
          <Bloom intensity={0.85} luminanceThreshold={0.55} luminanceSmoothing={0.4} mipmapBlur />
          <ChromaticAberration offset={new THREE.Vector2(0.0007, 0.0009)} radialModulation={false} modulationOffset={0} />
          <Noise opacity={0.04} />
          <Vignette eskil={false} offset={0.18} darkness={1.05} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
