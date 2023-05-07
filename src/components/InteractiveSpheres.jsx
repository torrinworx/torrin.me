import React, { useEffect, useState, useRef } from "react"
import * as THREE from "three"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Physics, useSphere } from "@react-three/cannon"
import { useTexture, Html } from "@react-three/drei"

import MouseBall from "./MouseBall"

export const isOnTouchScreen = "ontouchstart" in window;


const Camera = () => {
  const { set, size } = useThree();

  useEffect(() => {
    let camera = new THREE.PerspectiveCamera(10, size.width / size.height, 10, 50);
    camera.position.z = 50;
    set({ camera });
  }, [size, set]);
  return null;
};

const Spheres = () => {
  const sphereGeometry = new THREE.SphereGeometry(1, 32, 32)
  const sphereMaterial = new THREE.MeshStandardMaterial({ color: "red", roughness: 0, envMapIntensity: 0.2, emissive: "#370037" })
  const texture = useTexture("./cross.jpg");

  const rfs = THREE.MathUtils.randFloatSpread

  // Utility function to map a value from one range to another
  const mapAndRound = (
    value,
    min1,
    max1,
    min2,
    max2
  ) => {
    return Math.round(min2 + ((value - min1) * (max2 - min2)) / (max1 - min1));
  };

  // Calculate the number of spheres based on the screen width
  const numberOfSpheres = mapAndRound(window.innerWidth, 300, 2000, 10, 30);

  const [ref, api] = useSphere((index) => ({
    args: [1],
    mass: 0.8,
    angularDamping: 0.1,
    linearDamping: 0.65,
    position: [rfs(20), rfs(20), rfs(20)],
  }));

  const mat = useRef(new THREE.Matrix4());
  const vec = useRef(new THREE.Vector3());

  const mouse = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((state) => {
    mouse.current.set(
      (state.mouse.x * state.viewport.width) / 2,
      (state.mouse.y * state.viewport.height) / 2,
      0
    );

    for (let i = 0; i < numberOfSpheres; i++) {
      ref.current.getMatrixAt(i, mat.current);
      const direction = new THREE.Vector3().subVectors(mouse.current, vec.current.setFromMatrixPosition(mat.current)).normalize();
      api.at(i).applyForce(direction.multiplyScalar(10).toArray(), [0, 0, 0]);
    }
  });

  return (
    <instancedMesh
      ref={ref}
      castShadow
      receiveShadow
      args={[null, null, numberOfSpheres]} // Use numberOfSpheres to set the number of instances
      geometry={sphereGeometry}
      material={sphereMaterial}
      material-map={texture}
    />
  );
};

export const InteractiveSpheres = () => {
  return <Canvas gl={{ alpha: true }} shadows dpr={[1, 2]} style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh" }}>
    <ambientLight intensity={0.25} />
    <spotLight intensity={1} angle={0.2} penumbra={1} position={[30, 30, 30]} castShadow shadow-mapSize={[512, 512]} />
    <Camera />
    <Physics gravity={[0, 2, 0]} iterations={10}>
      <MouseBall />
      <Spheres />
    </Physics>
  </Canvas>
};

export default InteractiveSpheres;
