import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface GradientMeshProps {
  position?: [number, number, number];
  scale?: number;
  color1?: string;
  color2?: string;
}

export function GradientMesh({ 
  position = [0, 0, -5], 
  scale = 1,
  color1 = '#6366f1',
  color2 = '#14b8a6'
}: GradientMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Create gradient material
  const gradientMaterial = useMemo(() => {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color1: { value: new THREE.Color(color1) },
        color2: { value: new THREE.Color(color2) },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        uniform float time;
        
        void main() {
          vUv = uv;
          vPosition = position;
          
          vec3 pos = position;
          pos.x += sin(pos.y * 4.0 + time) * 0.1;
          pos.y += cos(pos.x * 4.0 + time) * 0.1;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color1;
        uniform vec3 color2;
        uniform float time;
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
          vec2 uv = vUv;
          
          float noise = sin(uv.x * 10.0 + time) * cos(uv.y * 10.0 + time) * 0.1;
          float gradient = uv.y + noise;
          
          vec3 color = mix(color1, color2, gradient);
          
          float alpha = 1.0 - length(uv - 0.5) * 1.5;
          alpha = clamp(alpha, 0.0, 0.8);
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
    });
    return material;
  }, [color1, color2]);

  useFrame((state) => {
    if (meshRef.current && meshRef.current.material) {
      (meshRef.current.material as any).uniforms.time.value = state.clock.elapsedTime * 0.5;
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      <planeGeometry args={[8, 8, 32, 32]} />
      <primitive object={gradientMaterial} attach="material" />
    </mesh>
  );
}