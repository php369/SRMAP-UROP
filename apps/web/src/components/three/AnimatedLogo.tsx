import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface AnimatedLogoProps {
  position?: [number, number, number];
  scale?: number;
}

export function AnimatedLogo({ position = [0, 0, 0], scale = 1 }: AnimatedLogoProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const textRef = useRef<THREE.Mesh>(null);

  // Create gradient material
  const gradientMaterial = useMemo(() => {
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#6366f1'),
      metalness: 0.8,
      roughness: 0.2,
      emissive: new THREE.Color('#4338ca'),
      emissiveIntensity: 0.1,
    });
    return material;
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8) * 0.1;
    }
    
    if (textRef.current) {
      textRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.02;
    }
  });

  return (
    <group position={position} scale={scale}>
      {/* Main logo sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <MeshDistortMaterial
          color="#6366f1"
          attach="material"
          distort={0.3}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Orbiting rings */}
      <group>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.5, 0.05, 8, 32]} />
          <meshStandardMaterial color="#14b8a6" transparent opacity={0.6} />
        </mesh>
        <mesh rotation={[0, Math.PI / 2, Math.PI / 4]}>
          <torusGeometry args={[1.8, 0.03, 8, 32]} />
          <meshStandardMaterial color="#f59e0b" transparent opacity={0.4} />
        </mesh>
      </group>

      {/* SRM Text */}
      <Text
        ref={textRef}
        position={[0, -2.5, 0]}
        fontSize={0.8}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        font="/fonts/Inter-Bold.woff"
        material={gradientMaterial}
      >
        SRM
      </Text>
      
      <Text
        position={[0, -3.2, 0]}
        fontSize={0.3}
        color="#94a3b8"
        anchorX="center"
        anchorY="middle"
        font="/fonts/Inter-Regular.woff"
      >
        RESEARCH PORTAL
      </Text>
    </group>
  );
}