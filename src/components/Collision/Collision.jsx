import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";

import Objects from "./Objects";
import GetRenderingSettings from "./BenchMark";

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

export const Collision = ({ children }) => {
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

  return (
    <div ref={container} style={{ position: "relative", width: "100%", height: "100%" }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", overflow: "hidden" }} ref={domContent} />
      <Canvas
        gl={{ alpha: true, antialias: renderingSettings.antialias }}
        shadows={renderingSettings.useShadows}
        dpr={renderingSettings.dpr}
        style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%" }}
        eventSource={container}
        eventPrefix="page"
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
