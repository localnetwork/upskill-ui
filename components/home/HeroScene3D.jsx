import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import usePrefersReducedMotion from "./usePrefersReducedMotion";

function FloatingObjects({ reduceMotion }) {
  const groupRef = useRef(null);
  const particlesRef = useRef(null);
  const networkRef = useRef(null);
  const scrollProgressRef = useRef(0);

  const particlePositions = useMemo(() => {
    const total = 180;
    const positions = new Float32Array(total * 3);
    for (let i = 0; i < total; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 5.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 5;
    }
    return positions;
  }, []);

  const networkGeometry = useMemo(() => {
    const points = [];
    for (let i = 0; i < 8; i += 1) {
      const angle = (Math.PI * 2 * i) / 8;
      points.push(new THREE.Vector3(Math.cos(angle) * 2.8, Math.sin(angle) * 1.5, -0.8));
    }
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    return lineGeometry;
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    let trigger;

    const init = async () => {
      const gsapModule = await import("gsap");
      const scrollTriggerModule = await import("gsap/ScrollTrigger");
      const gsap = gsapModule.gsap || gsapModule.default || gsapModule;
      const ScrollTrigger =
        scrollTriggerModule.ScrollTrigger ||
        scrollTriggerModule.default ||
        scrollTriggerModule;

      gsap.registerPlugin(ScrollTrigger);
      trigger = ScrollTrigger.create({
        trigger: "#home-hero",
        start: "top top",
        end: "bottom top",
        scrub: 1,
        onUpdate: (self) => {
          scrollProgressRef.current = self.progress;
        },
      });
    };

    init();
    return () => trigger && trigger.kill();
  }, [reduceMotion]);

  useFrame((state) => {
    if (!groupRef.current) return;

    const targetX = reduceMotion ? 0 : state.pointer.y * 0.12;
    const targetY = reduceMotion ? 0 : state.pointer.x * 0.16;
    const progress = scrollProgressRef.current;

    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      targetX + progress * 0.08,
      0.05,
    );
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetY + progress * 0.14,
      0.05,
    );
    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y,
      -progress * 0.4,
      0.03,
    );

    if (particlesRef.current && !reduceMotion) {
      particlesRef.current.rotation.y += 0.0009;
      particlesRef.current.rotation.x += 0.0004;
    }
    if (networkRef.current) {
      networkRef.current.rotation.z += reduceMotion ? 0 : 0.002;
    }
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 3, 2]} intensity={1.1} color="#e6f0ff" />
      <pointLight position={[-4, 2, 2]} intensity={0.8} color="#4ca6ff" />

      <Float speed={reduceMotion ? 0 : 1.2} rotationIntensity={0.35} floatIntensity={0.5}>
        <mesh position={[-1.8, 0.4, 0.5]}>
          <boxGeometry args={[1.1, 0.8, 0.25]} />
          <meshStandardMaterial color="#dce9ff" metalness={0.35} roughness={0.25} />
        </mesh>
      </Float>

      <Float speed={reduceMotion ? 0 : 1.4} rotationIntensity={0.45} floatIntensity={0.65}>
        <mesh position={[1.7, 0.8, -0.2]}>
          <icosahedronGeometry args={[0.68, 0]} />
          <MeshDistortMaterial
            color="#70a8ff"
            metalness={0.22}
            roughness={0.2}
            distort={reduceMotion ? 0 : 0.2}
            speed={reduceMotion ? 0 : 1.8}
          />
        </mesh>
      </Float>

      <Float speed={reduceMotion ? 0 : 1} rotationIntensity={0.3} floatIntensity={0.4}>
        <mesh position={[0, -0.9, 0.15]}>
          <cylinderGeometry args={[0.92, 0.92, 0.12, 28]} />
          <meshStandardMaterial color="#f4f8ff" metalness={0.2} roughness={0.32} />
        </mesh>
      </Float>

      <lineLoop ref={networkRef} geometry={networkGeometry}>
        <lineBasicMaterial color="#8bb5ff" transparent opacity={0.55} />
      </lineLoop>

      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={particlePositions}
            count={particlePositions.length / 3}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial size={0.03} color="#8ab4ff" transparent opacity={0.75} />
      </points>
    </group>
  );
}

export default function HeroScene3D() {
  const reduceMotion = usePrefersReducedMotion();

  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 5.8], fov: 48 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      className="h-full w-full"
    >
      <Suspense fallback={null}>
        <FloatingObjects reduceMotion={reduceMotion} />
        <OrbitControls enablePan={false} enableZoom={false} enableRotate={false} />
      </Suspense>
    </Canvas>
  );
}
