import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { BrowserRouter as useRoutesMatch } from "react-router-dom";

import Objects from "./Objects";

export const isOnTouchScreen = "ontouchstart" in window;

const Camera = () => {
  const { set, size } = useThree();

  useEffect(() => {
    let camera = new THREE.PerspectiveCamera(10, size.width / size.height, 10, 60);
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
          <Objects />
        </Canvas>
        {children}
      </div>
    );
  }
};

export default InteractiveSpheres;
