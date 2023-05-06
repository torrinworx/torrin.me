import React, { useEffect, useRef } from "react"
import * as THREE from "three"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Physics, useSphere } from "@react-three/cannon"
import { useTexture } from "@react-three/drei"

const rfs = THREE.MathUtils.randFloatSpread
const sphereGeometry = new THREE.SphereGeometry(1, 32, 32)
const sphereMaterial = new THREE.MeshStandardMaterial({ color: "red", roughness: 0, envMapIntensity: 0.2, emissive: "#370037" })

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

const numberOfSpheres = mapAndRound(window.innerWidth, 300, 2000, 5, 30);

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
  // Get viewport and clock from Three.js context
  const { viewport, clock } = useThree();

  // Create refs for mesh, mouse3D, mouseTarget, and mouseScaleTarget
  const mesh = useRef();
  const mouse3D = useRef(new THREE.Vector3());
  const mouseTarget = useRef(new THREE.Vector3());
  const mouseScaleTarget = useRef(new THREE.Vector3(1, 1, 1));

  const mouseInteractionSphereRadius = 1

  // Create a sphere using cannon physics engine
  const [, api] = useSphere(() => ({ type: "Kinematic", args: [mouseInteractionSphereRadius], position: [0, 0, 0] }));

  // Set mouseOverLink to false
  const mouseOverLink = false;

  // On each frame, update the position and rotation of the mesh based on mouse position and other factors
  useFrame((state) => {
    // Set mouse3D ref to the current mouse position in Three.js coordinates
    mouse3D.current.set(
      (state.mouse.x * viewport.width) / 2,
      (state.mouse.y * viewport.height) / 2,
      0
    );

    // Set the position of the sphere to match the current mouse position in Three.js coordinates
    api.position.set((state.mouse.x * viewport.width) / 2, (state.mouse.y * viewport.height) / 2, 0);

    // If the device has touch capability, set the mouseTarget ref to a value that changes over time
    // Otherwise, set mouseTarget ref to match the current mouse position in Three.js coordinates
    if ('ontouchstart' in window) {
      mouseTarget.current.set(
        Math.cos(clock.getElapsedTime() * Math.PI) * 0.25,
        Math.cos(clock.getElapsedTime()) * 0.5,
        0
      );
    } else {
      mouseTarget.current.copy(mouse3D.current);
    }

    // Use linear interpolation (lerp) to gradually move the mesh toward the mouseTarget position
    mouse3D.current.lerp(mouseTarget.current, 0.3);
    mesh.current.position.copy(mouse3D.current);

    // Set the scale of the mesh based on the mouseOverLink value and the distance between the current and target mouse positions
    mouseScaleTarget.current.setScalar(
      mouseOverLink
        ? 0.25 + mouse3D.current.distanceToSquared(mouseTarget.current) * 0.5
        : 0.1
    );

    // Rotate the mesh around the Z-axis and use lerp to gradually scale the mesh toward the mouseScaleTarget value
    mesh.current.rotateZ(-0.2 * mesh.current.scale.x);
    mesh.current.scale.lerp(mouseScaleTarget.current, 0.6);
  });

  // Create a circle geometry with a given radius and number of segments
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

  // Get the value of a CSS color variable as a string
  const getCssColor = (variable) => {
    if (typeof window === 'undefined') return '#ffffff'
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim()
  }

  // Return a line loop with a circle geometry and a line basic material with a color based on a CSS variable
  return (
    <lineLoop ref={mesh}>
      <primitive object={createCircleGeometry(2, 10)} />
      <lineBasicMaterial color={getCssColor('--c-primary')} />
    </lineLoop>
  );
};

const Spheres = () => {
  const texture = useTexture("./cross.jpg");

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

export const SphereTest = () => {
  return <Canvas shadows dpr={[1, 2]} style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: "0" }}>
    <ambientLight intensity={0.25} />
    <spotLight intensity={1} angle={0.2} penumbra={1} position={[30, 30, 30]} castShadow shadow-mapSize={[512, 512]} />
    <Camera />
    <Physics gravity={[0, 2, 0]} iterations={10}>
      <MouseBall />
      <Spheres />
    </Physics>
  </Canvas>
};

export default SphereTest;
