"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  scrollState,
  win,
  T,
  clamp01,
  easeInOut,
} from "@/lib/scrollState";

/**
 * MysteryScenes — five scroll-driven 3D atmospheric chapters
 * that build anticipation BEFORE the product reveal.
 *
 * No recognizable product silhouette. Pure abstract spectacle.
 *
 * ACT I  — Sound Sculpture: particle wave landscape
 * ACT II — Prototype Graveyard: floating broken shells
 * ACT III — Frequency Tunnel: infinite rings + energy
 * ACT IV — 1100 Iterations: particle reduction
 * ACT V  — Energy Core: metallic monolith + pulses
 */

const at = (w: { start: number; end: number }, f: number) =>
  w.start + (w.end - w.start) * f;

/* ------------------------------------------------------------------ */
/* Deterministic PRNG                                                  */
/* ------------------------------------------------------------------ */

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ 0;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ================================================================== */
/* ACT I — THE SILENCE BEFORE SOUND                                    */
/* Massive procedural sound-wave sculpture from particles + wireframe  */
/* ================================================================== */

const WAVE_COUNT = 2400;
const WAVE_LAYERS = 8;

function SoundSculpture() {
  const ref = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.PointsMaterial>(null);

  const { positions, seeds } = useMemo(() => {
    const rand = mulberry32(7777);
    const pos = new Float32Array(WAVE_COUNT * 3);
    const s: { theta: number; phi: number; r: number; speed: number; offset: number }[] = [];
    for (let i = 0; i < WAVE_COUNT; i++) {
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      const r = 2 + rand() * 6;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.cos(phi);
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      s.push({ theta, phi, r, speed: 0.3 + rand() * 0.8, offset: rand() * Math.PI * 2 });
    }
    return { positions: pos, seeds: s };
  }, []);

  // Wireframe wave rings
  const rings = useMemo(() => {
    const ringGeos: THREE.BufferGeometry[] = [];
    const segments = 128;
    for (let li = 0; li < WAVE_LAYERS; li++) {
      const arr = new Float32Array((segments + 1) * 3);
      for (let i = 0; i <= segments; i++) {
        const a = (i / segments) * Math.PI * 2;
        const r = 1.5 + li * 0.8;
        arr[i * 3] = Math.cos(a) * r;
        arr[i * 3 + 1] = 0;
        arr[i * 3 + 2] = Math.sin(a) * r;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
      ringGeos.push(geo);
    }
    return ringGeos;
  }, []);

  useFrame(({ clock }, dt) => {
    const p = scrollState.progress;
    const presence = win(p, T.silence.start, at(T.silence, 0.15)) *
      (1 - win(p, T.sonicform.start, T.sonicform.end));
    if (matRef.current) matRef.current.opacity = presence * 0.7;
    if (ref.current) ref.current.visible = presence > 0.01;

    const t = clock.elapsedTime;
    const vel = Math.min(Math.abs(scrollState.velocity) / 2000, 1);

    // Animate particle positions — waves ripple outward with scroll velocity
    const geo = particlesRef.current?.geometry as THREE.BufferGeometry | undefined;
    const attr = geo?.getAttribute("position") as THREE.BufferAttribute | undefined;
    if (attr) {
      for (let i = 0; i < WAVE_COUNT; i++) {
        const s = seeds[i];
        const wave = Math.sin(s.theta * 3 + t * s.speed + s.offset) * (0.3 + vel * 0.8);
        const r = s.r + wave;
        attr.setXYZ(
          i,
          r * Math.sin(s.phi) * Math.cos(s.theta + t * 0.05),
          r * Math.cos(s.phi) + Math.sin(t * 0.3 + s.offset) * 0.2,
          r * Math.sin(s.phi) * Math.sin(s.theta + t * 0.05)
        );
      }
      attr.needsUpdate = true;
    }

    // Rotate wireframe rings at different speeds
    if (ref.current) {
      ref.current.rotation.y = t * 0.04;
      ref.current.children.forEach((child, i) => {
        if (i > 0) {
          child.rotation.x = t * 0.02 * (i % 2 === 0 ? 1 : -1);
          child.rotation.z = t * 0.015 * (i % 3 === 0 ? 1 : -1);
        }
      });
    }
  });

  return (
    <group ref={ref} position={[0, 0, -2]}>
      {/* Particle cloud */}
      <points ref={particlesRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={matRef}
          size={0.025}
          color="#57e6ff"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Wireframe wave rings */}
      {rings.map((geo, i) => {
        const lineObj = new THREE.Line(
          geo,
          new THREE.LineBasicMaterial({
            color: "#57e6ff",
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
          })
        );
        return <primitive key={i} object={lineObj} />;
      })}
    </group>
  );
}

/* ================================================================== */
/* ACT II — A THOUSAND FAILURES                                        */
/* Prototype Graveyard: floating broken shells, debris field           */
/* ================================================================== */

const DEBRIS_COUNT = 180;

function PrototypeGraveyard() {
  const ref = useRef<THREE.Group>(null);

  const debris = useMemo(() => {
    const rand = mulberry32(3333);
    return Array.from({ length: DEBRIS_COUNT }, (_, i) => ({
      pos: [
        (rand() - 0.5) * 16,
        (rand() - 0.5) * 10,
        (rand() - 0.5) * 14,
      ] as [number, number, number],
      rot: [rand() * Math.PI, rand() * Math.PI, rand() * Math.PI] as [number, number, number],
      scale: 0.15 + rand() * 0.6,
      type: Math.floor(rand() * 4), // shell, fragment, ring, shard
      speed: 0.1 + rand() * 0.3,
      phase: rand() * Math.PI * 2,
    }));
  }, []);

  useFrame(({ clock }) => {
    const p = scrollState.progress;
    const presence = win(p, T.graveyard.start, at(T.graveyard, 0.1)) *
      (1 - win(p, T.ruins.start, T.ruins.end));
    if (ref.current) {
      ref.current.visible = presence > 0.01;
      ref.current.children.forEach((child, i) => {
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (mat) mat.opacity = presence * 0.6;
        // Slow drift
        const d = debris[i];
        if (d) {
          child.position.y = d.pos[1] + Math.sin(clock.elapsedTime * d.speed + d.phase) * 0.3;
          child.rotation.x = d.rot[0] + clock.elapsedTime * 0.02 * d.speed;
          child.rotation.y = d.rot[1] + clock.elapsedTime * 0.015 * d.speed;
        }
      });
    }
  });

  return (
    <group ref={ref}>
      {debris.map((d, i) => (
        <mesh key={i} position={d.pos} rotation={d.rot} scale={d.scale}>
          {d.type === 0 && <sphereGeometry args={[1, 16, 12, 0, Math.PI]} />}
          {d.type === 1 && <boxGeometry args={[1.2, 0.3, 0.8]} />}
          {d.type === 2 && <torusGeometry args={[0.6, 0.08, 8, 24]} />}
          {d.type === 3 && <octahedronGeometry args={[0.5, 0]} />}
          <meshStandardMaterial
            color="#1a1c22"
            metalness={0.7}
            roughness={0.4}
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>
      ))}
      {/* Dark industrial ambient light */}
      <pointLight position={[0, 3, 0]} intensity={0.4} color="#2a3040" distance={20} />
      <pointLight position={[-5, -2, 3]} intensity={0.2} color="#ff6a4d" distance={15} />
    </group>
  );
}

/* ================================================================== */
/* ACT III — INSIDE THE SOUND                                          */
/* Frequency Tunnel: infinite rings, energy lines, particles           */
/* ================================================================== */

const TUNNEL_RINGS = 60;
const TUNNEL_PARTICLES = 1200;

function FrequencyTunnel() {
  const ref = useRef<THREE.Group>(null);
  const tunnelRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);

  const particleData = useMemo(() => {
    const rand = mulberry32(5555);
    const pos = new Float32Array(TUNNEL_PARTICLES * 3);
    const s: { z: number; r: number; theta: number; speed: number }[] = [];
    for (let i = 0; i < TUNNEL_PARTICLES; i++) {
      const theta = rand() * Math.PI * 2;
      const r = 0.5 + rand() * 4;
      const z = (rand() - 0.5) * 30;
      pos[i * 3] = Math.cos(theta) * r;
      pos[i * 3 + 1] = Math.sin(theta) * r;
      pos[i * 3 + 2] = z;
      s.push({ z, r, theta, speed: 0.2 + rand() * 0.6 });
    }
    return { positions: pos, seeds: s };
  }, []);

  const rings = useMemo(() => {
    const arr: { z: number; baseR: number; phase: number }[] = [];
    for (let i = 0; i < TUNNEL_RINGS; i++) {
      arr.push({
        z: (i / TUNNEL_RINGS) * 40 - 20,
        baseR: 1.5 + Math.sin(i * 0.3) * 0.8,
        phase: i * 0.4,
      });
    }
    return arr;
  }, []);

  useFrame(({ clock }, dt) => {
    const p = scrollState.progress;
    const presence = win(p, T.tunnel.start, at(T.tunnel, 0.1)) *
      (1 - win(p, T.resonance_chamber.start, T.resonance_chamber.end));
    if (ref.current) ref.current.visible = presence > 0.01;

    const t = clock.elapsedTime;
    const vel = Math.min(Math.abs(scrollState.velocity) / 1500, 1);

    // Animate tunnel rings — pulsing with scroll velocity
    if (tunnelRef.current) {
      tunnelRef.current.children.forEach((child, i) => {
        if (i >= rings.length) return;
        const ring = rings[i];
        const pulse = Math.sin(t * 0.8 + ring.phase) * 0.15 + vel * 0.3;
        const s = ring.baseR * (1 + pulse);
        child.scale.set(s, s, 1);
        const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
        if (mat) mat.opacity = presence * (0.15 + pulse * 0.3);
      });
      tunnelRef.current.position.z = -t * 0.5;
    }

    // Animate particles — streaming through the tunnel
    const geo = particlesRef.current?.geometry as THREE.BufferGeometry | undefined;
    const attr = geo?.getAttribute("position") as THREE.BufferAttribute | undefined;
    if (attr) {
      for (let i = 0; i < TUNNEL_PARTICLES; i++) {
        const s = particleData.seeds[i];
        let z = s.z - t * s.speed * 2;
        // Wrap around
        while (z < -20) z += 40;
        while (z > 20) z -= 40;
        const pulse = Math.sin(t + s.theta) * 0.1;
        const r = s.r * (1 + pulse + vel * 0.2);
        attr.setXYZ(i, Math.cos(s.theta + t * 0.1) * r, Math.sin(s.theta + t * 0.1) * r, z);
      }
      attr.needsUpdate = true;
    }
  });

  return (
    <group ref={ref}>
      {/* Tunnel rings */}
      <group ref={tunnelRef}>
        {rings.map((ring, i) => (
          <mesh key={i} position={[0, 0, ring.z]} rotation={[0, 0, i * 0.1]}>
            <torusGeometry args={[ring.baseR, 0.015, 8, 64]} />
            <meshBasicMaterial
              color="#57e6ff"
              transparent
              opacity={0}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* Energy particles streaming through */}
      <points ref={particlesRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particleData.positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.02}
          color="#57e6ff"
          transparent
          opacity={0.5}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Central energy line */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 40, 8]} />
        <meshBasicMaterial
          color="#57e6ff"
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

/* ================================================================== */
/* ACT IV — 1100 ITERATIONS                                            */
/* Particle clusters that reduce from 1100 → 1 as user scrolls        */
/* ================================================================== */

const MAX_CLUSTERS = 400; // Visual representation (not literal 1100)

function IterationReduction() {
  const ref = useRef<THREE.Group>(null);
  const clusterRefs = useRef<THREE.Mesh[]>([]);

  const clusters = useMemo(() => {
    const rand = mulberry32(1100);
    return Array.from({ length: MAX_CLUSTERS }, () => ({
      pos: [
        (rand() - 0.5) * 18,
        (rand() - 0.5) * 12,
        (rand() - 0.5) * 14,
      ] as [number, number, number],
      scale: 0.08 + rand() * 0.15,
      speed: 0.2 + rand() * 0.5,
      phase: rand() * Math.PI * 2,
      color: rand() > 0.5 ? "#57e6ff" : "#b48cff",
    }));
  }, []);

  useFrame(({ clock }) => {
    const p = scrollState.progress;
    const presence = win(p, T.iterations.start, at(T.iterations, 0.1)) *
      (1 - win(p, T.singular.start, T.singular.end));

    if (ref.current) ref.current.visible = presence > 0.01;

    // Compute how many clusters should be visible based on scroll
    // 1100 → 500 → 100 → 50 → 10 → 1
    const progress = win(p, T.iterations.start, T.singular.end);
    const activeCount = Math.floor(MAX_CLUSTERS * Math.pow(1 - progress, 1.5));

    const t = clock.elapsedTime;

    clusterRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const visible = i < activeCount;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      const targetOpacity = visible ? 0.6 : 0;
      const targetScale = visible ? clusters[i].scale : 0;
      // Smooth fade
      mat.opacity += (targetOpacity - mat.opacity) * 0.1;
      mesh.scale.setScalar(mesh.scale.x + (targetScale - mesh.scale.x) * 0.1);
      // Floating motion
      if (visible) {
        mesh.position.y = clusters[i].pos[1] + Math.sin(t * clusters[i].speed + clusters[i].phase) * 0.15;
      }
    });
  });

  return (
    <group ref={ref}>
      {clusters.map((c, i) => (
        <mesh
          key={i}
          ref={(el) => { if (el) clusterRefs.current[i] = el; }}
          position={c.pos}
          scale={c.scale}
        >
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color={c.color}
            metalness={0.5}
            roughness={0.3}
            transparent
            opacity={0}
            emissive={c.color}
            emissiveIntensity={0.3}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ================================================================== */
/* ACT V — THE DISCOVERY                                               */
/* Abstract energy core: monolith + orange pulses + particle rings     */
/* ================================================================== */

function EnergyCore() {
  const coreRef = useRef<THREE.Mesh>(null);
  const ringsRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const spotRef = useRef<THREE.SpotLight>(null);

  const particlePos = useMemo(() => {
    const rand = mulberry32(9999);
    const pos = new Float32Array(600 * 3);
    for (let i = 0; i < 600; i++) {
      const theta = rand() * Math.PI * 2;
      const r = 2 + rand() * 4;
      const y = (rand() - 0.5) * 8;
      pos[i * 3] = Math.cos(theta) * r;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = Math.sin(theta) * r;
    }
    return pos;
  }, []);

  useFrame(({ clock }) => {
    const p = scrollState.progress;
    const presence = win(p, T.monolith.start, at(T.monolith, 0.1)) *
      (1 - win(p, at(T.awakening, 0.8), T.awakening.end));
    if (coreRef.current) {
      (coreRef.current.material as THREE.MeshStandardMaterial).opacity = presence * 0.9;
      coreRef.current.visible = presence > 0.01;
    }

    const t = clock.elapsedTime;

    // Monolith pulses with orange energy
    if (coreRef.current) {
      const pulse = Math.sin(t * 1.5) * 0.1 + 0.9;
      coreRef.current.scale.set(pulse, 1 + Math.sin(t * 0.8) * 0.03, pulse);
    }

    // Rotating particle rings
    if (ringsRef.current) {
      ringsRef.current.rotation.y = t * 0.15;
      ringsRef.current.rotation.x = Math.sin(t * 0.1) * 0.1;
    }

    // Particles orbit
    const geo = particlesRef.current?.geometry as THREE.BufferGeometry | undefined;
    const attr = geo?.getAttribute("position") as THREE.BufferAttribute | undefined;
    if (attr) {
      for (let i = 0; i < 600; i++) {
        const x = attr.getX(i);
        const z = attr.getZ(i);
        const theta = Math.atan2(z, x) + 0.002;
        const r = Math.sqrt(x * x + z * z);
        attr.setX(i, Math.cos(theta) * r);
        attr.setZ(i, Math.sin(theta) * r);
      }
      attr.needsUpdate = true;
    }

    // Spotlight follows core intensity
    if (spotRef.current) {
      spotRef.current.intensity = presence * 120;
    }
  });

  return (
    <group>
      {/* Central monolith — dark metallic slab */}
      <mesh ref={coreRef} position={[0, 0, 0]}>
        <boxGeometry args={[0.6, 3, 0.4]} />
        <meshPhysicalMaterial
          color="#1a1a2e"
          metalness={0.9}
          roughness={0.15}
          clearcoat={1}
          clearcoatRoughness={0.05}
          transparent
          opacity={0}
          emissive="#ffb45e"
          emissiveIntensity={0.15}
        />
      </mesh>

      {/* Orange energy glow behind monolith */}
      <mesh position={[0, 0, -0.5]}>
        <planeGeometry args={[4, 4]} />
        <meshBasicMaterial
          color="#ffb45e"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Rotating particle rings */}
      <group ref={ringsRef}>
        {Array.from({ length: 3 }).map((_, i) => {
          const r = 2.5 + i * 1.2;
          const segments = 96;
          const arr = new Float32Array((segments + 1) * 3);
          for (let j = 0; j <= segments; j++) {
            const a = (j / segments) * Math.PI * 2;
            arr[j * 3] = Math.cos(a) * r;
            arr[j * 3 + 1] = Math.sin(a * 3 + i) * 0.15;
            arr[j * 3 + 2] = Math.sin(a) * r;
          }
          const geo = new THREE.BufferGeometry();
          geo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
          const lineObj = new THREE.Line(
            geo,
            new THREE.LineBasicMaterial({
              color: "#ffb45e",
              transparent: true,
              opacity: 0.25,
              blending: THREE.AdditiveBlending,
            })
          );
          return <primitive key={i} object={lineObj} />;
        })}
      </group>

      {/* Orbiting particles */}
      <points ref={particlesRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particlePos, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.03}
          color="#ffb45e"
          transparent
          opacity={0.45}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Volumetric spotlight from above */}
      <spotLight
        ref={spotRef}
        position={[0, 8, 0]}
        angle={0.4}
        penumbra={1}
        intensity={0}
        color="#ffb45e"
        distance={20}
        decay={2}
      />

      {/* Ambient fill */}
      <pointLight position={[0, 0, 4]} intensity={0.3} color="#57e6ff" distance={15} />
    </group>
  );
}

/* ================================================================== */
/* Composite — all mystery scenes in one component                     */
/* ================================================================== */

export default function MysteryScenes() {
  return (
    <group>
      <SoundSculpture />
      <PrototypeGraveyard />
      <FrequencyTunnel />
      <IterationReduction />
      <EnergyCore />
    </group>
  );
}
