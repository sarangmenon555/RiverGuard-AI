"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

export interface FloodStoryFrameData {
  intensity: number; // 0..1 rain intensity for the current chapter
  pageProgress: number; // 0..1 fractional progress through the current chapter
  waterLevel: number; // 0..1 how high the water plane sits (peaks mid-story)
  tint: string; // hex color, shifts with the story's emotional arc
}

type DataRef = React.RefObject<FloodStoryFrameData>;

function RainField({ dataRef }: { dataRef: DataRef }) {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 600;
  const tintColor = useMemo(() => new THREE.Color(), []);

  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 24;
      positions[i * 3 + 1] = Math.random() * 20 - 6;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 14;
      speeds[i] = 0.15 + Math.random() * 0.25;
    }
    return { positions, speeds };
  }, []);

  useFrame(() => {
    if (!pointsRef.current) return;
    const intensity = dataRef.current?.intensity ?? 0.2;
    const attr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      let y = attr.getY(i) - speeds[i] * (0.3 + intensity * 1.6);
      if (y < -8) y = 12;
      attr.setY(i, y);
    }
    attr.needsUpdate = true;
    const mat = pointsRef.current.material as THREE.PointsMaterial;
    mat.opacity = 0.15 + intensity * 0.55;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.045} color="#5eead4" transparent opacity={0.3} sizeAttenuation />
    </points>
  );
}

function PageTurn({ dataRef }: { dataRef: DataRef }) {
  const hingeRef = useRef<THREE.Group>(null);
  const leftMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const rightMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const colorObj = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    const progress = dataRef.current?.pageProgress ?? 0;
    const tint = dataRef.current?.tint ?? "#2dd4bf";
    if (hingeRef.current) {
      const angle = -Math.PI * 0.14 * Math.sin(progress * Math.PI);
      hingeRef.current.rotation.y = angle;
    }
    colorObj.set(tint);
    leftMatRef.current?.color.set(colorObj);
    rightMatRef.current?.color.set(colorObj);
  });

  return (
    <group position={[0, 0, -6]}>
      <group ref={hingeRef} position={[3.2, 0, 0]}>
        <mesh position={[1.6, 0, 0]}>
          <planeGeometry args={[3.2, 9, 1, 1]} />
          <meshStandardMaterial
            ref={rightMatRef}
            transparent
            opacity={0.06}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
      <mesh position={[-1.6, 0, 0]}>
        <planeGeometry args={[3.2, 9, 1, 1]} />
        <meshStandardMaterial ref={leftMatRef} transparent opacity={0.06} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function WaterRise({ dataRef }: { dataRef: DataRef }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const geomRef = useRef<THREE.PlaneGeometry>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const colorObj = useMemo(() => new THREE.Color(), []);

  useFrame((state) => {
    const level = dataRef.current?.waterLevel ?? 0;
    const tint = dataRef.current?.tint ?? "#2dd4bf";

    if (geomRef.current) {
      const pos = geomRef.current.attributes.position;
      const t = state.clock.elapsedTime;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = Math.sin(x * 0.4 + t * 0.5) * 0.25 + Math.cos(y * 0.4 + t * 0.35) * 0.25;
        pos.setZ(i, z);
      }
      pos.needsUpdate = true;
    }
    if (meshRef.current) {
      meshRef.current.position.y = -7 + level * 6.5;
    }
    if (matRef.current) {
      matRef.current.opacity = 0.15 + level * 0.35;
      colorObj.set(tint);
      matRef.current.color.set(colorObj);
      matRef.current.emissive.set(colorObj);
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2.4, 0, 0]} position={[0, -7, -8]}>
      <planeGeometry ref={geomRef} args={[40, 24, 50, 30]} />
      <meshStandardMaterial
        ref={matRef}
        wireframe
        transparent
        opacity={0.2}
        emissiveIntensity={0.2}
      />
    </mesh>
  );
}

function Scene({ dataRef }: { dataRef: DataRef }) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[4, 6, 4]} intensity={0.5} color="#5eead4" />
      <RainField dataRef={dataRef} />
      <PageTurn dataRef={dataRef} />
      <WaterRise dataRef={dataRef} />
    </>
  );
}

export default function FloodStoryCanvas({ dataRef }: { dataRef: DataRef }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <Canvas camera={{ position: [0, 1, 11], fov: 55 }}>
        <Scene dataRef={dataRef} />
      </Canvas>
    </div>
  );
}
