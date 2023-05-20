import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { Physics } from "@react-three/cannon";
// import { Html, Mask, useMask } from "@react-three/drei";
import { BrowserRouter as useRoutesMatch } from "react-router-dom";

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

export const InteractiveSpheres = ({ children }) => {
  const container = useRef();
  const domContent = useRef();
  const match = useRoutesMatch("/");

  // Not working??
  if (!match) {
    return children;
  } else {
    return (
      <div ref={container} style={{ position: "relative", width: "100%", height: "100%" }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", overflow: "hidden" }} ref={domContent} />
        <Canvas
          gl={{ alpha: true }}
          shadows
          dpr={[1, 2]}
          style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%" }}
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
          {/* <Plane children={children} /> */}
        </Canvas>
        {children}
      </div>
    );
  }
};

export default InteractiveSpheres;

/*
This is a good start however I need to reconsider how I'm handline passing in the background
from theme.

Also we need to find out why the hover on link isn't working
for the mouse ball.

Also there is now an issue where if you try to resize the window applyForce repleats infinitely for
some reason
*/
