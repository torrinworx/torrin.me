import React, { useRef } from 'react';
import { extend, Canvas, useFrame } from '@react-three/fiber';

extend({ Canvas });

const Main = () => {
  const meshRef = useRef();

  useFrame(() => {
    meshRef.current.rotation.x += 0.01;
    meshRef.current.rotation.y += 0.01;
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronBufferGeometry args={[1, 0]} />
      <meshBasicMaterial color={0x00ff00} />
    </mesh>
  );
};

// Wrapper to resolve issue with Canvas usage in sup components:
const SphereCanvas = () => {
  return (
    <Canvas>
      <Main />
    </Canvas>
  );
};

export default SphereCanvas;