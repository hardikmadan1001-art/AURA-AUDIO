"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { scrollState, computeCaseOpen, win, T } from "@/lib/scrollState";

/**
 * The vessel. A premium charging case, procedurally modelled:
 * Stage 1  APPROACH   — closed case only, ascending into the key light
 * Stage 2             — the camera travels in (see Experience)
 * Stage 3  MATERIAL   — a lighting sweep crosses the body, revealing
 *                       the quality of the surface
 * Stage 4  GLIMPSE    — lid cracks open, a sliver of light escapes
 * Stage 5  FIRST LIGHT— hold, then open fully. Anticipation.
 *
 * After the earbuds rise (ACT III) the case descends back into darkness,
 * then returns for the ACT IX bookend.
 */

const BODY_W = 2.2;
const BODY_H = 0.85;
const BODY_D = 1.6;
const LID_H = 0.42;
const HINGE_Z = -BODY_D / 2;

export default function ChargingCase() {
  const root = useRef<THREE.Group>(null);
  const lidPivot = useRef<THREE.Group>(null);
  const glow = useRef<THREE.PointLight>(null);
  const ledMat = useRef<THREE.MeshStandardMaterial>(null);
  const seamMat = useRef<THREE.MeshStandardMaterial>(null);
  const sweepBand = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const p = scrollState.progress;
    const open = computeCaseOpen(p);

    // Lid rotates backwards around the rear hinge.
    if (lidPivot.current) {
      lidPivot.current.rotation.x = -open * 1.95;
    }

    // Interior glow leaks out as the seam opens — the "glimpse" beat.
    if (glow.current) {
      glow.current.intensity =
        open * (2.4 + Math.sin(clock.elapsedTime * 2.2) * 0.5);
    }
    if (ledMat.current) {
      ledMat.current.emissiveIntensity = 0.6 + open * 2.6;
    }
    // The seam catches light only once the vessel has arrived and
    // through the material sweep.
    if (seamMat.current) {
      seamMat.current.emissiveIntensity =
        win(p, T.orbit.start, T.material.end) * 0.8;
    }

    // Material-quality sweep: a bright band travels across the body
    // during ACT II's MATERIAL scene.
    if (sweepBand.current) {
      const s = win(p, T.material.start, T.material.end);
      sweepBand.current.position.x = -BODY_W + s * BODY_W * 2;
      const bandMat = sweepBand.current.material as THREE.MeshStandardMaterial;
      bandMat.opacity = s > 0.001 && s < 0.999 ? 0.85 : 0;
    }

    // ACT III aftermath: the vessel sinks away, then returns for ACT IX.
    const rLen = T.reassembly.end - T.reassembly.start;
    const drop =
      win(p, T.separation.end, T.waves.end) *
      (1 - win(p, T.reassembly.start, T.reassembly.start + rLen * 0.5));
    if (root.current) {
      root.current.position.y = -drop * 3.2;
    }
  });

  return (
    <group ref={root}>
      {/* ---------- Body ---------- */}
      <RoundedBox args={[BODY_W, BODY_H, BODY_D]} radius={0.16} smoothness={6}>
        <meshPhysicalMaterial
          color="#0d0e11"
          metalness={0.85}
          roughness={0.18}
          clearcoat={1}
          clearcoatRoughness={0.08}
          envMapIntensity={1.3}
        />
      </RoundedBox>

      {/* Metallic trim ring where lid meets body */}
      <mesh position={[0, BODY_H / 2, 0]}>
        <boxGeometry args={[BODY_W + 0.015, 0.02, BODY_D + 0.015]} />
        <meshStandardMaterial
          ref={seamMat}
          color="#9ba0aa"
          metalness={1}
          roughness={0.28}
          emissive="#57e6ff"
          emissiveIntensity={0}
        />
      </mesh>

      {/* Status LED — front face */}
      <mesh position={[0, 0.05, BODY_D / 2 + 0.005]}>
        <boxGeometry args={[0.34, 0.03, 0.01]} />
        <meshStandardMaterial
          ref={ledMat}
          color="#0a1417"
          emissive="#57e6ff"
          emissiveIntensity={0.6}
          toneMapped={false}
        />
      </mesh>

      {/* ---------- Twin wells (earbud seats) ---------- */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.52, BODY_H / 2 - 0.08, 0]}>
          <mesh>
            <cylinderGeometry args={[0.4, 0.44, 0.16, 40]} />
            <meshStandardMaterial color="#08090c" metalness={0.6} roughness={0.45} />
          </mesh>
          {/* Charging contact pucks at the well floor */}
          <mesh position={[side * 0.12, 0.06, 0.18]}>
            <circleGeometry args={[0.07, 24]} />
            <meshStandardMaterial color="#d8dade" metalness={1} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* ---------- Material sweep band (ACT II) ---------- */}
      <mesh ref={sweepBand} position={[0, 0, BODY_D / 2 + 0.02]}>
        <planeGeometry args={[0.12, BODY_H * 1.4]} />
        <meshBasicMaterial
          color="#dff6ff"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* ---------- Lid on its rear hinge ---------- */}
      <group ref={lidPivot} position={[0, BODY_H / 2, HINGE_Z]}>
        <RoundedBox
          args={[BODY_W, LID_H, BODY_D]}
          radius={0.14}
          smoothness={6}
          position={[0, LID_H / 2 - 0.02, -HINGE_Z]}
        >
          <meshPhysicalMaterial
            color="#0b0c0f"
            metalness={0.85}
            roughness={0.16}
            clearcoat={1}
            clearcoatRoughness={0.06}
            envMapIntensity={1.35}
          />
        </RoundedBox>
        {/* Aura wordmark plate on the lid */}
        <mesh position={[0, LID_H / 2 - 0.02, -HINGE_Z + BODY_D / 2 + 0.004]}>
          <torusGeometry args={[0.16, 0.012, 10, 48]} />
          <meshStandardMaterial color="#c9ccd4" metalness={1} roughness={0.25} />
        </mesh>
      </group>

      {/* ---------- Interior light — leaks through the opening seam ---------- */}
      <pointLight
        ref={glow}
        position={[0, 0.55, 0]}
        intensity={0}
        distance={4}
        color="#7ee9ff"
      />
    </group>
  );
}
