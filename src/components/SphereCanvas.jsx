import React from 'react';

import * as THREE from 'three';
import { extend, Canvas } from '@react-three/fiber';

extend({ Canvas });

const WebGLRendererWrapper = () => {
  const { gl } = useThree();

  React.useLayoutEffect(() => {
    const renderer = new WebGLRenderer({
      alpha: true,
      premultipliedAlpha: false,
      powerPreference: "high-performance",
      precision: "lowp",
      depth: false,
      antialias: true,
      canvas: gl.domElement,
    });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap;
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 3;
    renderer.physicallyCorrectLights = true;

    return () => {
      renderer.dispose();
    };
  }, [gl]);

  return null;
};

const SphereCanvas = () => {
  return (
    <Canvas pixelRatio={window.devicePixelRatio}>
      <WebGLRendererWrapper />
      {/* your scene content */}
    </Canvas>
  );
};


export default SphereCanvas;