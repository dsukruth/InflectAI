import { useRef, useMemo, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const PARTICLE_COUNT = 2000;

function Particles() {
  const mesh = useRef<THREE.Points>(null);
  const mouse = useRef(new THREE.Vector2(0, 0));
  const { viewport } = useThree();

  const [positions, basePositions] = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const base = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const x = (Math.random() - 0.5) * 20;
      const y = (Math.random() - 0.5) * 14;
      const z = (Math.random() - 0.5) * 6;
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      base[i * 3] = x;
      base[i * 3 + 1] = y;
      base[i * 3 + 2] = z;
    }
    return [pos, base];
  }, []);

  const colors = useMemo(() => {
    const c = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const isCyan = Math.random() > 0.6;
      c[i * 3] = isCyan ? 0 : 1;
      c[i * 3 + 1] = isCyan ? 0.78 : 1;
      c[i * 3 + 2] = isCyan ? 1 : 1;
    }
    return c;
  }, []);

  const handlePointerMove = useCallback(
    (e: { clientX: number; clientY: number }) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    },
    []
  );

  useFrame((_, delta) => {
    if (!mesh.current) return;
    const geo = mesh.current.geometry;
    const posAttr = geo.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    const mx = mouse.current.x * viewport.width * 0.5;
    const my = mouse.current.y * viewport.height * 0.5;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const ix = i * 3;
      // drift upward
      arr[ix + 1] += delta * 0.15;
      if (arr[ix + 1] > 7) arr[ix + 1] = -7;

      // mouse repel
      const dx = arr[ix] - mx;
      const dy = arr[ix + 1] - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 2.5) {
        const force = (2.5 - dist) * 0.3 * delta;
        arr[ix] += (dx / dist) * force;
        arr[ix + 1] += (dy / dist) * force;
      } else {
        // return to base slowly
        arr[ix] += (basePositions[ix] - arr[ix]) * delta * 0.3;
        arr[ix + 1] += (basePositions[ix + 1] - arr[ix + 1]) * delta * 0.1;
      }
    }
    posAttr.needsUpdate = true;
  });

  // attach window event for mouse
  useMemo(() => {
    if (typeof window !== "undefined") {
      window.addEventListener("mousemove", handlePointerMove, { passive: true });
    }
    return () => window.removeEventListener("mousemove", handlePointerMove);
  }, [handlePointerMove]);

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={PARTICLE_COUNT}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.03} vertexColors transparent opacity={0.7} sizeAttenuation />
    </points>
  );
}

function Orb({ position, color }: { position: [number, number, number]; color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    ref.current.scale.setScalar(1 + Math.sin(t * 0.5) * 0.1);
    ref.current.position.x = position[0] + Math.sin(t * 0.2) * 0.5;
    ref.current.position.y = position[1] + Math.cos(t * 0.3) * 0.3;
  });

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[1.8, 32, 32]} />
      <meshBasicMaterial color={color} transparent opacity={0.08} />
    </mesh>
  );
}

const ParticleCanvas = () => (
  <div className="absolute inset-0 w-full h-full">
    <Canvas
      camera={{ position: [0, 0, 6], fov: 60 }}
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: true }}
      style={{ background: "transparent" }}
    >
      <Particles />
      <Orb position={[-4, 0, -2]} color="#00D68F" />
      <Orb position={[4, 0, -2]} color="#E05555" />
    </Canvas>
  </div>
);

export default ParticleCanvas;
