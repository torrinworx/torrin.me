import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { Physics } from "@react-three/cannon";
import { Html, Mask, useMask } from "@react-three/drei";

import MouseBall from "./MouseBall";
import Spheres from "./Spheres";

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

const Plane = ({ children }) => {
  const plane = useRef();
  const stencil = useMask(1, true);
  const { camera } = useThree();

  useFrame((state) => {
    plane.current.position.copy(state.camera.position);
    plane.current.position.z -= 25;
    plane.current.lookAt(state.camera.position);
  });

  const fovInRadians = (camera.fov * Math.PI) / 180;
  const distanceToPlane = 25;
  const planeHeight = 2 * Math.tan(fovInRadians / 2) * distanceToPlane;
  const planeWidth = planeHeight * camera.aspect;

  return (
    <>
      <Mask id={1} ref={plane}>
        <Html fullscreen>{children}</Html>
      </Mask>
      <mesh ref={plane} geometry={new THREE.PlaneGeometry(planeWidth, planeHeight)} material={stencil} />
    </>
  );
};

export const InteractiveSpheres = ({ children }) => {
  const container = useRef();
  const domContent = useRef();

  return (
    <div ref={container} style={{ position: "relative", width: "100%", height: "100%" }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", overflow: "hidden" }} ref={domContent} />
      <Canvas
        gl={{ alpha: true }}
        shadows
        dpr={[1, 2]}
        style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh" }}
        eventSource={container}
        eventPrefix="page"
      >
        <ambientLight intensity={0.25} />
        <spotLight intensity={1} angle={0.2} penumbra={1} position={[30, 30, 30]} castShadow shadow-mapSize={[512, 512]} />
        <Camera />
        <Physics gravity={[0, 2, 0]} iterations={10}>
          <MouseBall />
          <Spheres />
        </Physics>
        <Plane children={children} />
      </Canvas>
    </div>
  );
};

export default InteractiveSpheres;

/*
This is a good start however I need to reconsider how I'm handline passing in the background
from theme, the Header/Footer, and the content into the Plane component. Will the plane just
contain everything? Will there be a seperate plane for the background?

Also we need to find out and stop the scrolling interfearing
with the MouseBalls position. 

Also we need to find out why the hover on link isn't working
for the mouse ball.
*/
