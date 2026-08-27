"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  scrollState,
  win,
  T,
  computeExplode,
  computeBudLift,
  computeSeparation,
  computeStageRise,
  computeProductVisibility,
  computeMysteryIntensity,
} from "@/lib/scrollState";
import { finishState, type FinishType } from "@/components/ui/FinishSwitcher";
import ChargingCase from "./ChargingCase";
import {
  Dust,
  SoundWaves,
  NoiseField,
  PowerSystem,
  SpatialHalo,
  SignalRings,
  WaveLines,
  HazePlanes,
  GridFloor,
  GrapheneLattice,
  ResonanceRings,
  AssemblySparks,
  CaseGlow,
  HarmonicVis,
  OriginEmbers,
  CeramicShimmer,
  OvertonesViz,
  CertificationSeal,
  FinalBloom,
} from "./Atmospheres";

/* ------------------------------------------------------------------ */
/* Material presets — shared between all earbud instances               */
/* ------------------------------------------------------------------ */

type FinishPreset = {
  shellColor: string;
  metalness: number;
  roughness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  envMapIntensity: number;
  brandColor: string;
};

const FINISHES: Record<FinishType, FinishPreset> = {
  obsidian: {
    shellColor: "#0b0b0e",
    metalness: 0.85,
    roughness: 0.16,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.4,
    brandColor: "#c9ccd4",
  },
  silver: {
    shellColor: "#b8bcc4",
    metalness: 0.92,
    roughness: 0.12,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    envMapIntensity: 1.6,
    brandColor: "#ffffff",
  },
};

/* ------------------------------------------------------------------ */
/* ExplodePart — a component with a home position and an escape vector */
/* ------------------------------------------------------------------ */

type Vec3 = [number, number, number];

function ExplodePart({
  base,
  dir,
  spin = 0.35,
  children,
}: {
  base: Vec3;
  dir: Vec3;
  spin?: number;
  children: React.ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const e = scrollState.explode;
    g.position.set(base[0] + dir[0] * e, base[1] + dir[1] * e, base[2] + dir[2] * e);
    // Parts tumble gently along their escape axis while floating.
    g.rotation.x = dir[2] * spin * e + Math.sin(clock.elapsedTime * 0.7) * 0.02;
    g.rotation.y = -dir[0] * spin * e;
    g.rotation.z = dir[1] * spin * e * 0.6 + Math.cos(clock.elapsedTime * 0.55) * 0.02;
  });

  return <group ref={ref}>{children}</group>;
}

/* ------------------------------------------------------------------ */
/* EarbudModel — one earbud, assembled from its component chapters     */
/* ------------------------------------------------------------------ */

function EarbudModel() {
  const [finish, setFinish] = useState<FinishType>(finishState.current);

  useEffect(() => {
    const unsub = finishState.subscribe(setFinish);
    return () => { unsub(); };
  }, []);

  const mat = FINISHES[finish];

  return (
    <>
      {/* ---------- Outer shells ---------- */}
      <ExplodePart base={[0, 0, 0]} dir={[2.1, 0.28, 0.15]} spin={0.5}>
        {/* Front shell — the primary material showcase */}
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <sphereGeometry args={[1, 64, 48, 0, Math.PI]} />
          <meshPhysicalMaterial
            color={mat.shellColor}
            metalness={mat.metalness}
            roughness={mat.roughness}
            clearcoat={mat.clearcoat}
            clearcoatRoughness={mat.clearcoatRoughness}
            envMapIntensity={mat.envMapIntensity}
          />
        </mesh>
        {/* Brand ring on the face */}
        <mesh position={[0.985, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <torusGeometry args={[0.34, 0.012, 12, 64]} />
          <meshStandardMaterial color={mat.brandColor} metalness={1} roughness={0.25} />
        </mesh>
      </ExplodePart>

      <ExplodePart base={[0, 0, 0]} dir={[-2.1, -0.22, -0.1]} spin={0.5}>
        {/* Rear shell — same material as front */}
        <mesh rotation={[0, -Math.PI / 2, 0]}>
          <sphereGeometry args={[1, 64, 48, 0, Math.PI]} />
          <meshPhysicalMaterial
            color={mat.shellColor}
            metalness={mat.metalness}
            roughness={mat.roughness}
            clearcoat={mat.clearcoat}
            clearcoatRoughness={mat.clearcoatRoughness}
            envMapIntensity={mat.envMapIntensity}
          />
        </mesh>
        {/* Charging contact disc */}
        <mesh position={[-0.97, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <circleGeometry args={[0.42, 48]} />
          <meshStandardMaterial
            color="#d8dade"
            metalness={1}
            roughness={0.2}
            emissive="#ffb45e"
            emissiveIntensity={0}
          />
        </mesh>
      </ExplodePart>

      {/* ---------- Acoustic nozzle + silicone tip ---------- */}
      <ExplodePart base={[0, -0.15, 0.78]} dir={[0.25, -0.35, 1.75]} spin={0.45}>
        <mesh rotation={[Math.PI / 2.35, 0, 0]}>
          <cylinderGeometry args={[0.26, 0.36, 0.55, 40]} />
          <meshStandardMaterial color="#14161a" metalness={0.9} roughness={0.25} />
        </mesh>
        {/* Mesh grille */}
        <mesh position={[0, -0.13, 0.32]} rotation={[Math.PI / 2.35, 0, 0]}>
          <cylinderGeometry args={[0.24, 0.24, 0.03, 32]} />
          <meshStandardMaterial color="#3a3f47" metalness={0.8} roughness={0.6} />
        </mesh>
        {/* Silicone tip */}
        <mesh position={[0, -0.24, 0.44]} scale={[1, 1, 0.8]}>
          <sphereGeometry args={[0.27, 32, 32]} />
          <meshPhysicalMaterial
            color="#191b1f"
            roughness={0.9}
            metalness={0}
            sheen={0.6}
            sheenColor="#3a3f47"
          />
        </mesh>
      </ExplodePart>

      {/* ---------- Driver stack: magnet -> coil -> diaphragm ---------- */}
      <ExplodePart base={[-0.1, -0.05, 0.25]} dir={[0.55, -0.6, 0.1]} spin={0.4}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.42, 0.42, 0.16, 40]} />
          <meshStandardMaterial color="#2a2c31" metalness={1} roughness={0.35} />
        </mesh>
        {/* Copper pole plate */}
        <mesh position={[0.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.3, 0.3, 0.03, 40]} />
          <meshStandardMaterial color="#c98a2e" metalness={1} roughness={0.25} />
        </mesh>
      </ExplodePart>

      <ExplodePart base={[0, 0, 0.2]} dir={[1.05, -0.1, 0.4]} spin={0.5}>
        {/* Voice coil */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.3, 0.045, 16, 64]} />
          <meshStandardMaterial color="#d4a24a" metalness={1} roughness={0.18} />
        </mesh>
      </ExplodePart>

      <ExplodePart base={[0.08, 0.05, 0.12]} dir={[1.5, 0.3, 0.15]} spin={0.55}>
        {/* Diaphragm — the soul of the driver */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <sphereGeometry args={[0.42, 48, 32, 0, Math.PI * 2, 0, Math.PI / 2.6]} />
          <meshPhysicalMaterial
            color="#101317"
            metalness={0.4}
            roughness={0.15}
            clearcoat={1}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Suspended gold surround */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.41, 0.02, 10, 64]} />
          <meshStandardMaterial color="#c9a227" metalness={1} roughness={0.2} />
        </mesh>
      </ExplodePart>

      {/* ---------- Chipset PCB ---------- */}
      <ExplodePart base={[0, 0.45, -0.1]} dir={[-0.15, 1.5, 0.3]} spin={0.4}>
        <mesh>
          <boxGeometry args={[0.72, 0.5, 0.045]} />
          <meshStandardMaterial color="#0b0e12" metalness={0.5} roughness={0.5} />
        </mesh>
        <mesh position={[0.08, 0.04, 0.045]}>
          <boxGeometry args={[0.26, 0.26, 0.035]} />
          <meshStandardMaterial color="#1c1f24" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[-0.22, -0.1, 0.045]}>
          <boxGeometry args={[0.16, 0.12, 0.03]} />
          <meshStandardMaterial color="#1c1f24" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Trace details */}
        <mesh position={[0.08, 0.04, 0.065]}>
          <boxGeometry args={[0.1, 0.1, 0.005]} />
          <meshStandardMaterial color="#57e6ff" emissive="#57e6ff" emissiveIntensity={0.6} toneMapped={false} />
        </mesh>
      </ExplodePart>

      {/* ---------- Battery cell ---------- */}
      <ExplodePart base={[-0.5, -0.5, 0]} dir={[-1.25, -0.85, 0.35]} spin={0.45}>
        <mesh rotation={[0, 0, Math.PI / 4]}>
          <capsuleGeometry args={[0.26, 0.34, 8, 24]} />
          <meshPhysicalMaterial color="#0d0f13" metalness={0.7} roughness={0.3} clearcoat={0.8} />
        </mesh>
        {/* Charge-level glow band */}
        <mesh rotation={[0, 0, Math.PI / 4]}>
          <torusGeometry args={[0.265, 0.012, 8, 48]} />
          <meshStandardMaterial
            color="#57e6ff"
            emissive="#57e6ff"
            emissiveIntensity={2.2}
            toneMapped={false}
          />
        </mesh>
      </ExplodePart>

      {/* ---------- Antenna ring ---------- */}
      <ExplodePart base={[0, -0.35, -0.45]} dir={[0, -1.55, -0.35]} spin={0.35}>
        <mesh rotation={[Math.PI / 2.6, 0, 0]}>
          <torusGeometry args={[0.5, 0.016, 10, 72]} />
          <meshStandardMaterial color="#c9ccd4" metalness={1} roughness={0.3} />
        </mesh>
      </ExplodePart>

      {/* ---------- ANC microphones ---------- */}
      <ExplodePart base={[0.3, 0.62, 0.45]} dir={[0.5, 1.1, 1.0]} spin={0.6}>
        <mesh>
          <cylinderGeometry args={[0.075, 0.09, 0.09, 24]} />
          <meshStandardMaterial color="#c9a227" metalness={1} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.05, 0]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color="#111318" roughness={0.7} />
        </mesh>
      </ExplodePart>
      <ExplodePart base={[-0.42, 0.3, -0.5]} dir={[-0.9, 0.95, -0.95]} spin={0.6}>
        <mesh>
          <cylinderGeometry args={[0.075, 0.09, 0.09, 24]} />
          <meshStandardMaterial color="#c9a227" metalness={1} roughness={0.25} />
        </mesh>
        <mesh position={[0, -0.05, 0]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color="#111318" roughness={0.7} />
        </mesh>
      </ExplodePart>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* BudRig — one earbud's journey through the whole film                */
/* ------------------------------------------------------------------ */

const SEAT_X = 0.52; // matches the case wells
const SEAT_Y = 0.78;
/* Formation geometry: bud radius is ~1 at full scale, so ±1.35 puts a
 * clear gap between the shells; the later separation beat widens it
 * further to ±1.85. Two objects, never one merged silhouette. */
const FORM_X = 1.35;
const FORM_Y = 1.02;
const SEP_EXTRA = 0.5;

function BudRig({ side }: { side: 1 | -1 }) {
  const g = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const grp = g.current;
    if (!grp) return;
    const p = scrollState.progress;
    const t = clock.elapsedTime;

    // Each bud owns its clock: staggered lift, then a shared but
    // independent separation drift.
    const lift = computeBudLift(p, side);
    const sep = computeSeparation(p);
    const phase = side === 1 ? 0 : 1.9; // de-sync every idle motion

    // Position: well -> formation on its own schedule, plus the extra
    // outward drift and a slight z offset so paths never coincide.
    const x = side * (THREE.MathUtils.lerp(SEAT_X, FORM_X, lift) + sep * SEP_EXTRA);
    const y =
      THREE.MathUtils.lerp(SEAT_Y, FORM_Y, lift) +
      lift * Math.sin(t * 0.8 + phase) * 0.05;
    const z = side * 0.09;
    grp.position.set(x, y, z);

    // Grow from case-scale to hero-scale per bud — the cinematic
    // "small object becomes monumental" trick, now individual.
    grp.scale.setScalar(THREE.MathUtils.lerp(0.34, 1, lift));

    // Rotation: mirrored scroll-linked turn (opposite directions), an
    // individual reveal flourish, mirrored explode tumble and de-phased
    // idle sway. The two buds never move in lockstep.
    const explodeSpin = scrollState.explode * 0.55;
    grp.rotation.y =
      side * 0.5 +
      p * Math.PI * (side === 1 ? 1.6 : -1.25) +
      lift * Math.PI * 0.85 * side +
      explodeSpin * side +
      Math.sin(t * 0.31 + phase) * 0.04;
    grp.rotation.x = Math.sin(t * 0.29 + phase) * 0.03;
    grp.rotation.z = Math.sin(t * 0.41 + phase * 0.5) * 0.04;
  });

  return (
    <group ref={g}>
      <EarbudModel />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* ProductStage — case + earbuds + every atmospheric instrument        */
/* ------------------------------------------------------------------ */

export default function PremiumEarbud() {
  const root = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const p = scrollState.progress;
    scrollState.explode = computeExplode(p);
    scrollState.productVisibility = computeProductVisibility(p);
    scrollState.mysteryIntensity = computeMysteryIntensity(p);

    const g = root.current;
    if (!g) return;

    // Product stays hidden through mystery acts (visibility = 0)
    const vis = scrollState.productVisibility;
    g.visible = vis > 0.01;
    if (!g.visible) return;

    // Smooth fade-in at reveal
    g.traverse((child) => {
      if ((child as THREE.Mesh).material) {
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (mat.opacity !== undefined) {
          // Don't override materials that manage their own opacity
        }
      }
    });

    // Case emergence from the void below.
    const emerged = computeStageRise(p);
    // After separation — the composition settles.
    const sink = win(p, T.separation.start, T.separation.end) * 0.5;

    g.position.y = -6.5 * (1 - emerged) - sink;
    g.position.y += Math.sin(clock.elapsedTime * 0.8) * 0.05;
    g.rotation.y = Math.sin(clock.elapsedTime * 0.12) * 0.06;
  });

  return (
    <group ref={root}>
      <ChargingCase />
      <BudRig side={1} />
      <BudRig side={-1} />

      {/* Atmospheric instruments */}
      <Dust />
      <WaveLines />
      <HazePlanes />
      <GridFloor />
      <SoundWaves />
      <NoiseField />
      <PowerSystem />
      <SpatialHalo />
      <SignalRings />
      {/* New atmospheric systems */}
      <GrapheneLattice />
      <ResonanceRings />
      <AssemblySparks />
      <CaseGlow />
      <HarmonicVis />
      <OriginEmbers />
      <CeramicShimmer />
      <OvertonesViz />
      <CertificationSeal />
      <FinalBloom />
    </group>
  );
}
