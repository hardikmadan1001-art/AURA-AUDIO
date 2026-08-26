"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Grid } from "@react-three/drei";
import * as THREE from "three";
import { scrollState, win, T } from "@/lib/scrollState";

/**
 * Atmospheric systems — every act has its own weather.
 *
 * All instruments are scrub-driven via scrollState windows; nothing runs
 * on its own clock except idle motion. WaveLines additionally reacts to
 * live scroll velocity — the closest a silent page gets to audio.
 */

type Vec3 = [number, number, number];

/** Deterministic PRNG — keeps render pure while still looking organic. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ 0;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const at = (w: { start: number; end: number }, f: number) =>
  w.start + (w.end - w.start) * f;

/* ------------------------------------------------------------------ */
/* Ambient dust — ACT I: "invisible sound becoming visible"            */
/* ------------------------------------------------------------------ */

export function Dust() {
  const ref = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.PointsMaterial>(null);

  const positions = useMemo(() => {
    const count = 900;
    const rand = mulberry32(1337);
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (rand() - 0.5) * 18;
      arr[i * 3 + 1] = (rand() - 0.5) * 12;
      arr[i * 3 + 2] = (rand() - 0.5) * 12;
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.01;
    // Heaviest presence through ACT I, thins out as the vessel arrives.
    if (matRef.current) {
      matRef.current.opacity =
        0.45 * (1 - win(scrollState.progress, T.approach.start, T.orbit.end)) +
        0.12 * (1 - win(scrollState.progress, T.final.start, 1));
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
/* WaveLines — audio-reactive sine field                               */
/*                                                                     */
/* Five horizontal lines of interference, always faintly alive in ACT I */
/* and echoing back for the waves film. Amplitude breathes with scroll */
/* velocity — the page literally reacts to how hard you scroll.         */
/* ------------------------------------------------------------------ */

const WAVE_LINES = 5;
const WAVE_SEGMENTS = 140;

export function WaveLines() {
  const group = useRef<THREE.Group>(null);
  const vel = useRef(0);

  // All line objects are created once, owned locally by this component.
  const { lines, mats, geos } = useMemo(() => {
    const lines: THREE.Line[] = [];
    const mats: THREE.LineBasicMaterial[] = [];
    const geos: THREE.BufferGeometry[] = [];
    for (let li = 0; li < WAVE_LINES; li++) {
      const arr = new Float32Array((WAVE_SEGMENTS + 1) * 3);
      for (let i = 0; i <= WAVE_SEGMENTS; i++) {
        arr[i * 3] = -8 + (i / WAVE_SEGMENTS) * 16;
        arr[i * 3 + 1] = 0;
        arr[i * 3 + 2] = li * 0.55;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
      const m = new THREE.LineBasicMaterial({
        color: "#57e6ff",
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const l = new THREE.Line(g, m);
      lines.push(l);
      mats.push(m);
      geos.push(g);
    }
    return { lines, mats, geos };
  }, []);

  useFrame(({ clock }, dt) => {
    const p = scrollState.progress;

    // Presence: dominant through ACT I, an echo during the waves film.
    const presence =
      0.95 * (1 - win(p, T.approach.start, T.approach.end)) +
      0.7 *
        win(p, T.waves.start, T.waves.end) *
        (1 - win(p, T.driver.start, T.driver.end));
    if (group.current) group.current.visible = presence > 0.01;

    // Smoothed scroll velocity -> amplitude.
    const targetVel = Math.min(Math.abs(scrollState.velocity) / 2200, 1);
    vel.current += (targetVel - vel.current) * Math.min(1, dt * 4);
    const amp = 0.14 + vel.current * 0.55 + Math.sin(clock.elapsedTime * 0.9) * 0.02;

    geos.forEach((geo, li) => {
      const attr = geo.getAttribute("position") as THREE.BufferAttribute | undefined;
      if (!attr) return;
      const freq = 0.85 + li * 0.22;
      const speed = 0.7 + li * 0.18;
      for (let i = 0; i <= WAVE_SEGMENTS; i++) {
        const x = -8 + (i / WAVE_SEGMENTS) * 16;
        attr.setY(
          i,
          Math.sin(x * freq + clock.elapsedTime * speed + li * 1.7) *
            amp *
            (0.5 + 0.5 * Math.sin(x * 0.35 + li))
        );
      }
      attr.needsUpdate = true;
      const m = mats[li];
      if (m) m.opacity = presence * (0.32 - li * 0.04);
    });
  });

  return (
    <group ref={group} position={[0, -0.2, -2.2]}>
      {lines.map((l, i) => (
        <primitive key={i} object={l} />
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Frequency rings — the waves film                                    */
/* ------------------------------------------------------------------ */

export function SoundWaves() {
  const group = useRef<THREE.Group>(null);
  const mats = useRef<THREE.MeshBasicMaterial[]>([]);

  useFrame(({ clock }) => {
    const p = scrollState.progress;
    const visibility =
      win(p, T.waves.start, at(T.waves, 0.25)) *
      (1 - win(p, T.driver.start, T.driver.end));
    const t = clock.elapsedTime;
    group.current?.children.forEach((child, i) => {
      const phase = (t * 0.45 + i / 3) % 1;
      child.scale.setScalar(0.35 + phase * 2.1);
      const m = mats.current[i];
      if (m) m.opacity = visibility * (1 - phase) * 0.85;
    });
  });

  return (
    <group ref={group} position={[0, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
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
/* ANC noise field — chaos collapsing to silence                       */
/* ------------------------------------------------------------------ */

const NOISE_COUNT = 380;

export function NoiseField() {
  const ref = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.PointsMaterial>(null);
  const seeds = useMemo(
    () => {
      const rand = mulberry32(4242);
      return Array.from({ length: NOISE_COUNT }, () => ({
        theta: rand() * Math.PI * 2,
        phi: Math.acos(2 * rand() - 1),
        r: 2.2 + rand() * 5,
        speed: 1.4 + rand() * 1.6,
      }));
    },
    []
  );
  const positions = useMemo(() => new Float32Array(NOISE_COUNT * 3), []);

  useFrame((_, dt) => {
    const p = scrollState.progress;
    const active =
      win(p, T.anc.start, at(T.anc, 0.3)) *
      (1 - win(p, at(T.anc, 0.75), T.anc.end));
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
    <points ref={ref} frustumCulled={false} position={[0, 0.5, 0]}>
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
/* Power pathways — energy made visible                                */
/* ------------------------------------------------------------------ */

const PATHS: Vec3[][] = [
  [
    [-0.55, -0.12, 0.15],
    [-0.2, 0.15, 0.1],
    [0.15, 0.5, 0],
    [0.32, 0.85, 0.05],
  ],
  [
    [-0.55, -0.12, 0.15],
    [-0.15, 0.25, -0.25],
    [0.2, 0.45, -0.3],
    [0.38, 0.82, -0.2],
  ],
  [
    [-0.55, -0.12, 0.15],
    [-0.65, 0.3, 0.3],
    [-0.5, 0.75, 0.25],
    [-0.3, 1.05, 0.1],
  ],
];

export function PowerSystem() {
  const tubes = useRef<THREE.Mesh[]>([]);
  const tubeMats = useRef<THREE.MeshStandardMaterial[]>([]);
  const orbs = useRef<THREE.Mesh[]>([]);
  const curves = useMemo(
    () => PATHS.map((pts) => new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)))),
    []
  );

  useFrame(({ clock }) => {
    const p = scrollState.progress;
    const energy =
      win(p, T.power.start, at(T.power, 0.25)) *
      (1 - win(p, at(T.power, 0.78), T.power.end));
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
/* Spatial halo — sound orbiting the listener                          */
/* ------------------------------------------------------------------ */

const HALO_SATS = 6;

export function SpatialHalo() {
  const group = useRef<THREE.Group>(null);
  const ringMats = useRef<THREE.MeshBasicMaterial[]>([]);
  const sats = useRef<THREE.Mesh[]>([]);

  useFrame(({ clock }) => {
    const p = scrollState.progress;
    const visibility =
      win(p, T.spatial.start, at(T.spatial, 0.22)) *
      (1 - win(p, at(T.spatial, 0.72), T.spatial.end));
    const t = clock.elapsedTime;

    if (group.current) {
      group.current.rotation.y = t * 0.22;
      group.current.rotation.x = Math.sin(t * 0.3) * 0.18 + 0.35;
    }
    ringMats.current.forEach((m) => {
      if (m) m.opacity = visibility * 0.5;
    });
    sats.current.forEach((sat, i) => {
      if (!sat) return;
      const a = t * 0.7 + (i / HALO_SATS) * Math.PI * 2;
      sat.position.set(Math.cos(a) * 1.7, Math.sin(a * 1.3) * 0.35, Math.sin(a) * 1.7);
      sat.scale.setScalar(Math.max(visibility * (0.6 + Math.sin(t * 3 + i) * 0.25), 0.0001));
    });
  });

  return (
    <group ref={group} position={[0, 0.55, 0]}>
      {[0.9, 1.3].map((r, i) => (
        <mesh key={r} rotation={[i === 0 ? Math.PI / 2 : Math.PI / 2.4, 0, i * 0.5]}>
          <torusGeometry args={[r, 0.006, 8, 96]} />
          <meshBasicMaterial
            ref={(m) => {
              if (m) ringMats.current[i] = m;
            }}
            color="#b48cff"
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
      {Array.from({ length: HALO_SATS }).map((_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            if (m) sats.current[i] = m;
          }}
        >
          <sphereGeometry args={[0.03, 10, 10]} />
          <meshBasicMaterial color="#d9c6ff" toneMapped={false} transparent opacity={0.95} />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Signal rings — connectivity made visible                            */
/* ------------------------------------------------------------------ */

export function SignalRings() {
  const group = useRef<THREE.Group>(null);
  const mats = useRef<THREE.MeshBasicMaterial[]>([]);

  useFrame(({ clock }) => {
    const p = scrollState.progress;
    const visibility =
      win(p, T.connect.start, at(T.connect, 0.25)) *
      (1 - win(p, at(T.connect, 0.75), T.connect.end));
    const t = clock.elapsedTime;
    group.current?.children.forEach((child, i) => {
      const phase = (t * 0.32 + i / 4) % 1;
      child.scale.setScalar(0.3 + phase * 2.6);
      const m = mats.current[i];
      if (m) m.opacity = visibility * (1 - phase) * 0.7;
    });
  });

  return (
    <group ref={group} position={[0, 0.55, 0]} rotation={[Math.PI / 2.15, 0, 0]}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i}>
          <torusGeometry args={[1, 0.006, 8, 96]} />
          <meshBasicMaterial
            ref={(m) => {
              if (m) mats.current[i] = m;
            }}
            color="#57e6ff"
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
/* HazePlanes — atmospheric depth                                      */
/*                                                                      */
/* Soft radial glows drifting far behind the product. Strongest in the  */
/* dark acts (I–III) where they give the void actual depth layers.      */
/* ------------------------------------------------------------------ */

function useRadialTexture(inner: string) {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, inner);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }, [inner]);
}

const HAZE_DEFS: { color: string; pos: Vec3; scale: number; drift: number }[] = [
  { color: "rgba(87,230,255,0.55)", pos: [-4.5, 1.5, -6], scale: 11, drift: 0.4 },
  { color: "rgba(180,140,255,0.4)", pos: [4.8, -1.2, -7], scale: 13, drift: -0.3 },
  { color: "rgba(255,180,94,0.28)", pos: [1.5, 3.2, -8], scale: 9, drift: 0.24 },
];

export function HazePlanes() {
  const group = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const p = scrollState.progress;
    // Depth haze lives mostly in the dark acts; recedes once the set is lit.
    const presence =
      0.85 * (1 - win(p, T.orbit.end, T.hero.end)) +
      0.35 * (1 - win(p, T.family.start, T.final.end));
    if (!group.current) return;
    group.current.visible = presence > 0.01;
    const t = clock.elapsedTime;
    group.current.children.forEach((child, i) => {
      const def = HAZE_DEFS[i];
      child.position.x = def.pos[0] + Math.sin(t * def.drift + i * 2.1) * 1.2;
      child.position.y = def.pos[1] + Math.cos(t * def.drift * 0.8 + i) * 0.6;
      const m = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      m.opacity = presence * (0.16 - i * 0.03);
    });
  });

  return (
    <group ref={group}>
      {HAZE_DEFS.map((def, i) => (
        <HazePlane key={i} def={def} />
      ))}
    </group>
  );
}

function HazePlane({ def }: { def: (typeof HAZE_DEFS)[number] }) {
  const tex = useRadialTexture(def.color);
  return (
    <mesh position={def.pos} scale={def.scale}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={tex}
        transparent
        opacity={0.1}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/* GridFloor — the technical substrate                                 */
/*                                                                      */
/* A calm measurement grid beneath the product. Fades up out of the     */
/* void as the vessel arrives and stays through the engineering acts.   */
/* ------------------------------------------------------------------ */

export function GridFloor() {
  const g = useRef<THREE.Group>(null);

  useFrame(() => {
    const p = scrollState.progress;
    const presence =
      win(p, T.approach.start, T.orbit.end) *
      (1 - win(p, T.reassembly.start, T.final.start));
    if (!g.current) return;
    g.current.visible = presence > 0.01;
    // Slides up from the abyss, sinks back when not needed.
    g.current.position.y = -2.4 - (1 - presence) * 3.5;
  });

  return (
    <group ref={g}>
      <Grid
        args={[40, 40]}
        cellSize={0.6}
        cellThickness={0.6}
        cellColor="#16262e"
        sectionSize={3}
        sectionThickness={1}
        sectionColor="#1f4a56"
        fadeDistance={17}
        fadeStrength={2.5}
        infiniteGrid
      />
    </group>
  );
}
