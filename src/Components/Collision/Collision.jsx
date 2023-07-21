import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";

import Objects from "./Objects";
import GetRenderingSettings from "./BenchMark";
import { Typography } from "@mui/material";

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

const Collision = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const container = useRef();
  const domContent = useRef();

  // If the benchmark data is not on the window object, it means the benchmark hasn't been run yet
  if (!window.globalDeviceSettingsAndInfo) {
    window.globalDeviceSettingsAndInfo = GetRenderingSettings();

    // Logs will appear only when the benchmark runs
    console.log("Device Information:", window.globalDeviceSettingsAndInfo.deviceInfo);
    console.log("Rendering Settings:", window.globalDeviceSettingsAndInfo.renderingSettings);
  }

  const { renderingSettings } = window.globalDeviceSettingsAndInfo;

  // Callback to set isLoaded to true, indicating that the canvas has loaded.
  const onCanvasLoaded = () => {
    setIsLoaded(true);
  };

  const LoadingScreen = (
    <Typography variant="h2" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
      Loading...
    </Typography>
  );

  return (
    <div ref={container} style={{ position: "relative", width: "100%", height: "100%" }}>
      {!isLoaded && LoadingScreen}
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", overflow: "hidden" }} ref={domContent} />
      <Canvas
        gl={{ alpha: true, antialias: renderingSettings.antialias }}
        shadows={renderingSettings.useShadows}
        dpr={renderingSettings.dpr}
        style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", visibility: isLoaded ? 'visible' : 'hidden' }}
        eventSource={container}
        eventPrefix="page"
        onCreated={onCanvasLoaded}
      >
        <ambientLight intensity={0.25} />
        <spotLight intensity={1} angle={0.2} penumbra={1} position={[30, 30, 30]} castShadow={renderingSettings.useShadows} shadow-mapSize={renderingSettings.shadowMapSize} />
        <Camera />
        <Objects textureQuality={renderingSettings.textureQuality} />
      </Canvas>
      {children}
    </div>
  );
};

export default Collision;
