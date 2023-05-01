import React, { useEffect, useState, useRef } from "react"
import * as THREE from "three"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Physics, useSphere } from "@react-three/cannon"
import { useTexture } from "@react-three/drei"

const rfs = THREE.MathUtils.randFloatSpread
const sphereGeometry = new THREE.SphereGeometry(1, 32, 32)
const baubleMaterial = new THREE.MeshStandardMaterial({ color: "red", roughness: 0, envMapIntensity: 0.2, emissive: "#370037" })

const Camera = () => {
  const { set, size } = useThree();

  useEffect(() => {
    let camera = new THREE.PerspectiveCamera(10, size.width / size.height, 10, 50);
    camera.position.z = 50;
    set({ camera });
  }, [size, set]);
  return null;
};

const MouseBall = () => {
  const { mouse, viewport, clock } = useThree();
  const mesh = useRef();
  const mouse3D = useRef(new THREE.Vector3());

  const mouseTarget = useRef(new THREE.Vector3());
  const mouseScaleTarget = useRef(new THREE.Vector3(1, 1, 1));

  const mouseOverLink = false;

  useFrame((state) => {
    if (mesh.current) {
      mouse3D.current.set(
        (state.mouse.x * viewport.width) / 2,
        (state.mouse.y * viewport.height) / 2,
        0
      );

      if ('ontouchstart' in window) {
        mouseTarget.current.set(
          Math.cos(clock.getElapsedTime() * Math.PI) * 0.25,
          Math.cos(clock.getElapsedTime()) * 0.5,
          0
        );
      } else {
        mouseTarget.current.copy(mouse3D.current);
      }

      // Increase the lerp factor to make the MouseBall follow the cursor more closely
      // or decrease it to make the MouseBall lag more.
      mouse3D.current.lerp(mouseTarget.current, 0.3);

      mesh.current.position.copy(mouse3D.current);

      mouseScaleTarget.current.setScalar(
        mouseOverLink
          ? 0.25 + mouse3D.current.distanceToSquared(mouseTarget.current) * 0.5
          : 0.1
      );

      mesh.current.rotateZ(-0.2 * mesh.current.scale.x);

      mesh.current.scale.lerp(mouseScaleTarget.current, 0.06);
    }
  });

  const createCircleGeometry = (radius, segments) => {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];

    for (let i = 0; i <= segments; i++) {
      const segment = (i * Math.PI * 2) / segments;
      vertices.push(radius * Math.cos(segment), radius * Math.sin(segment), 0);
    }

    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(vertices, 3)
    );

    return geometry;
  };

  // Function to get the color from CSS variable
  const getCssColor = (variable) => {
    if (typeof window === 'undefined') return '#ffffff'
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim()
  }

  return (
    <lineLoop ref={mesh}>
      <primitive object={createCircleGeometry(2, 10)} />
      <lineBasicMaterial color={getCssColor('--c-primary')} />
    </lineLoop>
  );
};

const Clump = () => {
  const texture = useTexture("./cross.jpg");
  const [ref, api] = useSphere(() => ({ args: [1], mass: 0.8, angularDamping: 0.1, linearDamping: 0.65, position: [rfs(20), rfs(20), rfs(20)] }));
  const mat = useRef(new THREE.Matrix4());
  const vec = useRef(new THREE.Vector3());

  const mouse = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((state) => {
    mouse.current.set(
      (state.mouse.x * state.viewport.width) / 2,
      (state.mouse.y * state.viewport.height) / 2,
      0
    );

    for (let i = 0; i < 40; i++) {
      ref.current.getMatrixAt(i, mat.current);
      const direction = new THREE.Vector3().subVectors(mouse.current, vec.current.setFromMatrixPosition(mat.current)).normalize();
      api.at(i).applyForce(direction.multiplyScalar(10).toArray(), [0, 0, 0]);
    }
  });

  return <instancedMesh ref={ref} castShadow receiveShadow args={[null, null, 40]} geometry={sphereGeometry} material={baubleMaterial} material-map={texture} />;
};


const Pointer = () => {
  const viewport = useThree((state) => state.viewport)
  const [, api] = useSphere(() => ({ type: "Kinematic", args: [3], position: [0, 0, 0] }))
  return useFrame((state) => api.position.set((state.mouse.x * viewport.width) / 2, (state.mouse.y * viewport.height) / 2, 0))
}

export const SphereTest = () => (
  <Canvas shadows dpr={[1, 2]} style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: "0" }}>
    <ambientLight intensity={0.25} />
    <spotLight intensity={1} angle={0.2} penumbra={1} position={[30, 30, 30]} castShadow shadow-mapSize={[512, 512]} />
    <Physics gravity={[0, 2, 0]} iterations={10}>
      <Pointer />
      <MouseBall />
      <Clump />
    </Physics>
    <Camera />
  </Canvas>
)

export default SphereTest;
