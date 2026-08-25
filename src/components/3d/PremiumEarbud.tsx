"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  scrollState,
  win,
  computeExplode,
  clamp01,
} from "@/lib/scrollState";

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
/* Ambient dust — the "invisible sound becoming visible" atmosphere    */
/* ------------------------------------------------------------------ */

function Dust() {
  const ref = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.PointsMaterial>(null);

  const positions = useMemo(() => {
    const count = 700;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 16;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 10;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.01;
    // Heaviest presence during SILENCE, thins out once the product lands.
    if (matRef.current) {
      matRef.current.opacity =
        0.4 * (1 - win(scrollState.progress, 0.1, 0.25)) +
        0.12 * (1 - win(scrollState.progress, 0.25, 1));
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={matRef}
        size={0.018}
        color="#9fb8c8"
        transparent
        opacity={0.4}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/* Frequency rings — Scene 5, sound made physical                      */
/* ------------------------------------------------------------------ */

function SoundWaves() {
  const group = useRef<THREE.Group>(null);
  const mats = useRef<THREE.MeshBasicMaterial[]>([]);

  useFrame(({ clock }) => {
    const p = scrollState.progress;
    const visibility = win(p, 0.52, 0.58) * (1 - win(p, 0.66, 0.72));
    const t = clock.elapsedTime;
    group.current?.children.forEach((child, i) => {
      const phase = (t * 0.45 + i / 3) % 1;
      child.scale.setScalar(0.35 + phase * 2.1);
      const m = mats.current[i];
      if (m) m.opacity = visibility * (1 - phase) * 0.85;
    });
  });

  return (
    <group ref={group} rotation={[0, 0, Math.PI / 2]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i}>
          <torusGeometry args={[1, 0.008, 8, 96]} />
          <meshBasicMaterial
            ref={(m) => {
              if (m) mats.current[i] = m;
            }}
            color="#5ee6ff"
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* ANC noise field — Scene 6, chaos collapsing to silence              */
/* ------------------------------------------------------------------ */

const NOISE_COUNT = 380;

function NoiseField() {
  const ref = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.PointsMaterial>(null);
  const seeds = useMemo(
    () =>
      Array.from({ length: NOISE_COUNT }, () => ({
        theta: Math.random() * Math.PI * 2,
        phi: Math.acos(2 * Math.random() - 1),
        r: 2.2 + Math.random() * 5,
        speed: 1.4 + Math.random() * 1.6,
      })),
    []
  );
  const positions = useMemo(() => new Float32Array(NOISE_COUNT * 3), []);

  useFrame((_, dt) => {
    const p = scrollState.progress;
    const active = win(p, 0.62, 0.68) * (1 - win(p, 0.76, 0.82));
    if (matRef.current) matRef.current.opacity = active * 0.7;
    const geo = ref.current?.geometry as THREE.BufferGeometry | undefined;
    const attr = geo?.getAttribute("position") as THREE.BufferAttribute | undefined;
    if (!attr || active <= 0) return;

    const d = Math.min(dt, 0.05);
    seeds.forEach((s, i) => {
      s.r -= d * s.speed;
      if (s.r < 1.15) {
        // The point reached the microphone shell — cancelled.
        s.r = 6.5 + Math.random() * 1.5;
      }
      positions[i * 3] = s.r * Math.sin(s.phi) * Math.cos(s.theta);
      positions[i * 3 + 1] = s.r * Math.cos(s.phi);
      positions[i * 3 + 2] = s.r * Math.sin(s.phi) * Math.sin(s.theta);
    });
    attr.needsUpdate = true;
  });

  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={matRef}
        size={0.03}
        color="#ff6a4d"
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/* Power pathways — Scene 7, energy made visible                       */
/* ------------------------------------------------------------------ */

const PATHS: Vec3[][] = [
  [
    [-0.55, -0.62, 0.15],
    [-0.2, -0.3, 0.1],
    [0.15, 0.1, 0],
    [0.32, 0.42, 0.05],
  ],
  [
    [-0.55, -0.62, 0.15],
    [-0.15, -0.15, -0.25],
    [0.2, 0.05, -0.3],
    [0.38, 0.38, -0.2],
  ],
  [
    [-0.55, -0.62, 0.15],
    [-0.65, -0.1, 0.3],
    [-0.5, 0.35, 0.25],
    [-0.3, 0.62, 0.1],
  ],
];

function PowerSystem() {
  const tubes = useRef<THREE.Mesh[]>([]);
  const tubeMats = useRef<THREE.MeshStandardMaterial[]>([]);
  const orbs = useRef<THREE.Mesh[]>([]);
  const curves = useMemo(
    () => PATHS.map((pts) => new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)))),
    []
  );

  useFrame(({ clock }) => {
    const p = scrollState.progress;
    const energy = win(p, 0.74, 0.79) * (1 - win(p, 0.86, 0.92));
    const pulse = 1.6 + Math.sin(clock.elapsedTime * 7) * 0.9;
    tubeMats.current.forEach((m) => {
      if (m) m.emissiveIntensity = energy * pulse;
    });
    orbs.current.forEach((orb, i) => {
      if (!orb) return;
      const curve = curves[i % curves.length];
      const tt = (clock.elapsedTime * 0.3 + i * 0.37) % 1;
      orb.position.copy(curve.getPoint(tt));
      const s = energy * (0.5 + Math.sin(tt * Math.PI) * 0.8);
      orb.scale.setScalar(Math.max(s, 0.0001));
    });
  });

  return (
    <group>
      {curves.map((_, i) => (
        <group key={i}>
          <mesh
            ref={(m) => {
              if (m) tubes.current[i] = m;
            }}
          >
            <tubeGeometry args={[curves[i], 40, 0.014, 8, false]} />
            <meshStandardMaterial
              ref={(m) => {
                if (m) tubeMats.current[i] = m;
              }}
              color="#1a1206"
              emissive="#ffb45e"
              emissiveIntensity={0}
              toneMapped={false}
            />
          </mesh>
          <mesh
            ref={(m) => {
              if (m) orbs.current[i * 2] = m;
            }}
          >
            <sphereGeometry args={[0.035, 12, 12]} />
            <meshBasicMaterial color="#ffd9a0" toneMapped={false} />
          </mesh>
          <mesh
            ref={(m) => {
              if (m) orbs.current[i * 2 + 1] = m;
            }}
          >
            <sphereGeometry args={[0.028, 12, 12]} />
            <meshBasicMaterial color="#fff3e0" toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* The earbud                                                          */
/* ------------------------------------------------------------------ */

export default function PremiumEarbud() {
  const root = useRef<THREE.Group>(null);

  useFrame(({ clock }, dt) => {
    const p = scrollState.progress;
    scrollState.explode = computeExplode(p);

    const g = root.current;
    if (!g) return;

    // SCENE 1 — emerge from the darkness below.
    g.position.y = -2.6 * (1 - win(p, 0.02, 0.13));

    // Scroll-linked rotation choreography; freezes naturally because it
    // is scrub-driven, plus a slow idle sway so it never feels dead.
    const revealSpin = win(p, 0.24, 0.38) * Math.PI * 0.9;
    const explodeSpin = scrollState.explode * 0.55;
    g.rotation.y = p * Math.PI * 1.5 + revealSpin + explodeSpin;
    g.rotation.z = Math.sin(clock.elapsedTime * 0.4) * 0.04;
    g.rotation.x = Math.sin(clock.elapsedTime * 0.31) * 0.03;
    g.position.y += Math.sin(clock.elapsedTime * 0.8) * 0.06;

    void dt;
  });

  return (
    <group ref={root}>
      {/* ---------- Outer shells ---------- */}
      <ExplodePart base={[0, 0, 0]} dir={[2.1, 0.28, 0.15]} spin={0.5}>
        {/* Front shell — gloss black ceramic */}
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <sphereGeometry args={[1, 64, 48, 0, Math.PI]} />
          <meshPhysicalMaterial
            color="#0b0b0e"
            metalness={0.85}
            roughness={0.16}
            clearcoat={1}
            clearcoatRoughness={0.08}
            envMapIntensity={1.4}
          />
        </mesh>
        {/* Brand ring on the face */}
        <mesh position={[0.985, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <torusGeometry args={[0.34, 0.012, 12, 64]} />
          <meshStandardMaterial color="#c9ccd4" metalness={1} roughness={0.25} />
        </mesh>
      </ExplodePart>

      <ExplodePart base={[0, 0, 0]} dir={[-2.1, -0.22, -0.1]} spin={0.5}>
        {/* Rear shell */}
        <mesh rotation={[0, -Math.PI / 2, 0]}>
          <sphereGeometry args={[1, 64, 48, 0, Math.PI]} />
          <meshPhysicalMaterial
            color="#0b0b0e"
            metalness={0.85}
            roughness={0.16}
            clearcoat={1}
            clearcoatRoughness={0.08}
            envMapIntensity={1.4}
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

      <ExplodePart base={[0, 0, 0]} dir={[0.15, 0.05, 1.05]} spin={0.3}>
        {/* Equator chassis ring — the structural spine */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.995, 0.05, 20, 96]} />
          <meshStandardMaterial color="#8f939c" metalness={1} roughness={0.3} />
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

      {/* ---------- Atmospheric systems ---------- */}
      <Dust />
      <SoundWaves />
      <NoiseField />
      <PowerSystem />
    </group>
  );
}
