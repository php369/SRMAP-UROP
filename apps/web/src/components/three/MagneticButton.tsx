import { useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

interface MagneticButtonProps {
  position?: [number, number, number];
  text: string;
  onClick?: () => void;
  color?: string;
  hoverColor?: string;
}

export function MagneticButton({ 
  position = [0, 0, 0], 
  text,
  onClick,
  color = '#6366f1',
  hoverColor = '#4f46e5'
}: MagneticButtonProps) {
  const buttonRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const { camera, mouse } = useThree();

  useFrame(() => {
    if (buttonRef.current && hovered) {
      // Magnetic effect - button follows mouse
      const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
      vector.unproject(camera);
      const dir = vector.sub(camera.position).normalize();
      const distance = -camera.position.z / dir.z;
      const pos = camera.position.clone().add(dir.multiplyScalar(distance));
      
      buttonRef.current.position.lerp(
        new THREE.Vector3(
          position[0] + (pos.x - position[0]) * 0.1,
          position[1] + (pos.y - position[1]) * 0.1,
          position[2]
        ),
        0.1
      );
      
      buttonRef.current.rotation.x = (pos.y - position[1]) * 0.1;
      buttonRef.current.rotation.y = (pos.x - position[0]) * 0.1;
    } else if (buttonRef.current) {
      // Return to original position
      buttonRef.current.position.lerp(new THREE.Vector3(...position), 0.1);
      buttonRef.current.rotation.x = THREE.MathUtils.lerp(buttonRef.current.rotation.x, 0, 0.1);
      buttonRef.current.rotation.y = THREE.MathUtils.lerp(buttonRef.current.rotation.y, 0, 0.1);
    }
  });

  return (
    <group
      ref={buttonRef}
      position={position}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onPointerDown={() => setClicked(true)}
      onPointerUp={() => {
        setClicked(false);
        onClick?.();
      }}
      scale={clicked ? 0.95 : hovered ? 1.05 : 1}
    >
      {/* Button background */}
      <RoundedBox args={[2.5, 0.8, 0.2]} radius={0.1}>
        <meshStandardMaterial
          color={hovered ? hoverColor : color}
          metalness={0.3}
          roughness={0.4}
          emissive={hovered ? new THREE.Color(color).multiplyScalar(0.1) : new THREE.Color(0x000000)}
        />
      </RoundedBox>

      {/* Button text */}
      <Text
        position={[0, 0, 0.11]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
        font="/fonts/Inter-Bold.woff"
      >
        {text}
      </Text>

      {/* Glow effect */}
      {hovered && (
        <RoundedBox args={[2.7, 1, 0.1]} radius={0.15}>
          <meshStandardMaterial
            color={color}
            transparent
            opacity={0.2}
            emissive={new THREE.Color(color)}
            emissiveIntensity={0.3}
          />
        </RoundedBox>
      )}
    </group>
  );
}