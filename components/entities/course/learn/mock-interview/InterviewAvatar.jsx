"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";

const SKIN = "#e8b894";
const HAIR = "#2b1d14";
const SUIT = "#1f2a44";

function Interviewer({ speaking, listening }) {
  const group = useRef();
  const mouth = useRef();
  const lidL = useRef();
  const lidR = useRef();
  const browL = useRef();
  const browR = useRef();
  const blinkAt = useRef(2);
  const mouthOpen = useRef(0);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Mouth flutters while the voice plays; no phoneme data is available from speechSynthesis.
    const target = speaking
      ? 0.2 + 0.8 * Math.abs(Math.sin(t * 11)) * (0.55 + 0.45 * Math.sin(t * 4.7))
      : 0;
    mouthOpen.current += (target - mouthOpen.current) * 0.35;
    if (mouth.current) {
      mouth.current.scale.set(1 - mouthOpen.current * 0.15, 0.12 + mouthOpen.current * 0.9, 1);
    }

    if (t > blinkAt.current) {
      blinkAt.current = t + 2.5 + Math.random() * 3;
      lidL.current && (lidL.current.userData.blinkUntil = t + 0.14);
    }
    const blinking = (lidL.current?.userData.blinkUntil || 0) > t;
    const lidScale = blinking ? 1 : 0.02;
    [lidL, lidR].forEach((lid) => {
      if (lid.current) lid.current.scale.y += (lidScale - lid.current.scale.y) * 0.6;
    });

    const browLift = listening ? 0.03 : 0;
    [browL, browR].forEach((brow) => {
      if (brow.current) brow.current.position.y += (0.27 + browLift - brow.current.position.y) * 0.1;
    });

    if (group.current) {
      group.current.rotation.y = Math.sin(t * 0.6) * 0.12;
      group.current.rotation.x = (listening ? 0.06 : 0) + Math.sin(t * 0.9) * 0.02 + mouthOpen.current * 0.03;
      group.current.position.y = Math.sin(t * 1.4) * 0.015;
    }
  });

  return (
    <group position={[0, -0.2, 0]}>
      <mesh position={[0, -1.35, 0]}>
        <capsuleGeometry args={[0.85, 0.7, 8, 24]} />
        <meshStandardMaterial color={SUIT} roughness={0.7} />
      </mesh>
      <mesh position={[0, -0.78, 0.35]} rotation={[0.1, 0, 0]}>
        <coneGeometry args={[0.18, 0.5, 3]} />
        <meshStandardMaterial color="#f4f4f4" />
      </mesh>
      <mesh position={[0, -0.62, 0]}>
        <cylinderGeometry args={[0.2, 0.24, 0.35, 24]} />
        <meshStandardMaterial color={SKIN} roughness={0.6} />
      </mesh>

      <group ref={group}>
        <mesh>
          <sphereGeometry args={[0.62, 48, 48]} />
          <meshStandardMaterial color={SKIN} roughness={0.55} />
        </mesh>
        <mesh position={[0, 0.12, -0.06]} scale={[1.02, 0.95, 1]}>
          <sphereGeometry args={[0.64, 48, 48, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <meshStandardMaterial color={HAIR} roughness={0.8} />
        </mesh>
        <mesh position={[-0.62, -0.02, 0]} scale={[0.5, 1, 0.8]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color={SKIN} />
        </mesh>
        <mesh position={[0.62, -0.02, 0]} scale={[0.5, 1, 0.8]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color={SKIN} />
        </mesh>

        {[-1, 1].map((side) => (
          <group key={side} position={[side * 0.23, 0.08, 0.5]}>
            <mesh>
              <sphereGeometry args={[0.1, 24, 24]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
            <mesh position={[0, 0, 0.065]}>
              <sphereGeometry args={[0.05, 20, 20]} />
              <meshStandardMaterial color="#3a2a1d" />
            </mesh>
            <mesh ref={side < 0 ? lidL : lidR} position={[0, 0.0, 0.03]} scale={[1, 0.02, 1]}>
              <sphereGeometry args={[0.108, 24, 24]} />
              <meshStandardMaterial color={SKIN} />
            </mesh>
            <mesh ref={side < 0 ? browL : browR} position={[0, 0.27, 0.02]} rotation={[0, 0, side * -0.08]}>
              <boxGeometry args={[0.2, 0.035, 0.04]} />
              <meshStandardMaterial color={HAIR} />
            </mesh>
          </group>
        ))}

        <mesh position={[0, -0.04, 0.6]} rotation={[0.3, 0, 0]}>
          <coneGeometry args={[0.06, 0.18, 16]} />
          <meshStandardMaterial color={SKIN} roughness={0.6} />
        </mesh>

        <mesh ref={mouth} position={[0, -0.28, 0.54]} scale={[1, 0.12, 1]}>
          <sphereGeometry args={[0.1, 24, 24]} />
          <meshStandardMaterial color="#5a1f24" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

export default function InterviewAvatar({ speaking, listening }) {
  return (
    <Canvas camera={{ position: [0, 0.1, 3.1], fov: 38 }} dpr={[1, 2]}>
      <color attach="background" args={["#0f172a"]} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[2, 3, 4]} intensity={1.6} />
      <directionalLight position={[-3, 1, 2]} intensity={0.5} color="#7aa2ff" />
      <Interviewer speaking={speaking} listening={listening} />
    </Canvas>
  );
}
