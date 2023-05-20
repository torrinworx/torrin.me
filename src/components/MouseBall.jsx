import React, { useState, useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useSphere } from "@react-three/cannon";
import { isOnTouchScreen } from "./InteractiveSpheres";

// Create a circle geometry with a given radius and number of segments
const createCircleGeometry = (radius, segments) => {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];

  for (let i = 0; i <= segments; i++) {
    const segment = (i * Math.PI * 2) / segments;
    vertices.push(radius * Math.cos(segment), radius * Math.sin(segment), 0);
  }

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3)
  );

  return geometry;
};

// Get the value of a CSS color variable as a string
const getCssColor = (variable) => {
  if (typeof window === "undefined") return "#ffffff";
  return getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();
};

export const useIsHovered = () => {
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const mouseEnterHandler = (event) => {
      if (event.target.tagName === 'A' || event.target.tagName === 'BUTTON') {
        setIsHovered(true);
      }
    };

    const mouseLeaveHandler = (event) => {
      if (event.target.tagName === 'A' || event.target.tagName === 'BUTTON') {
        setIsHovered(false);
      }
    };

    document.addEventListener('mouseenter', mouseEnterHandler, true);
    document.addEventListener('mouseleave', mouseLeaveHandler, true);

    return () => {
      document.removeEventListener('mouseenter', mouseEnterHandler, true);
      document.removeEventListener('mouseleave', mouseLeaveHandler, true);
    };
  }, []);

  return isHovered;
};

export const MouseBall = () => {
  // Get viewport and clock from Three.js context
  const { viewport, clock } = useThree();
  const mesh = useRef();
  const mouse3D = useRef(new THREE.Vector3());
  const mouseTarget = useRef(new THREE.Vector3());
  const mouseScaleTarget = useRef(new THREE.Vector3(1, 1, 1));
  const meshPosition = useRef(new THREE.Vector3());

  const mouseInteractionSphereRadius = 2

  const mouseHover = useIsHovered();

  // Create a sphere using cannon physics engine
  const [, api] = useSphere(() => ({
    type: "Kinematic",
    args: [mouseInteractionSphereRadius],
    position: [0, 0, 0],
  }));

  const mousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const updateMousePos = (event) => {
      // Convert to normalized device coordinates
      mousePos.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mousePos.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', updateMousePos);

    // Remove the event listener on unmount
    return () => window.removeEventListener('mousemove', updateMousePos);
  }, []);

  useFrame((state, delta) => {
    mouse3D.current.set(
      (mousePos.current.x * viewport.width) / 2,
      (mousePos.current.y * viewport.height) / 2,
      0
    );

    api.position.set(
      (mousePos.current.x * viewport.width) / 2,
      (mousePos.current.y * viewport.height) / 2,
      0
    );

    // If the device has touch capability, set the mouseTarget ref to a value that changes over time
    // Otherwise, set mouseTarget ref to match the current mouse position in Three.js coordinates
    if (isOnTouchScreen) {
      meshPosition.current.set(
        Math.cos(clock.getElapsedTime() * Math.PI) * 1.5,
        Math.cos(clock.getElapsedTime()) * 1,
        0
      );
    } else {
      mouseTarget.current.copy(mouse3D.current);
    }

    // Use lerp to gradually move the mesh towards the mouse position
    meshPosition.current.lerp(mouse3D.current, 10 * delta);

    mesh.current.position.copy(meshPosition.current);

    // Set the scale of the mesh based on the mouseOverLink value and the distance between the current and target mouse positions
    mouseScaleTarget.current.setScalar(
      mouseHover
        ? 0.25 + mouse3D.current.distanceToSquared(mouseTarget.current) * 0.5
        : 0.1
    );

    // Rotate the mesh around the Z-axis and use lerp to gradually scale the mesh toward the mouseScaleTarget value
    mesh.current.rotateZ(-0.2 * mesh.current.scale.x);
    mesh.current.scale.lerp(mouseScaleTarget.current, 0.6);

    // Update the position of the meshPosition ref to match the current position of the mesh.current object
    mesh.current.updateMatrixWorld();
    mesh.current.getWorldPosition(meshPosition.current);

    // Set the position of the sphere to match the current position of the mesh.current object
    api.position.copy(meshPosition.current);
  });

  // Return a line loop with a circle geometry and a line basic material with a color based on a CSS variable
  return (
    <lineLoop ref={mesh}>
      {isOnTouchScreen ? "none" : <primitive object={createCircleGeometry(3, 6)} />}
      <lineBasicMaterial color={getCssColor('--c-primary')} depthTest={false} transparent opacity={1} renderOrder={1} />
    </lineLoop>
  );
};

export default MouseBall;
