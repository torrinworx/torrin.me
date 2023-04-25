import React, { useRef } from 'react';

import { Box } from '@mui/system';

import * as THREE from 'three';
import { extend, Canvas, useThree, useFrame, directionalLight } from '@react-three/fiber';

extend({ Canvas });

class PBRSkin {
  constructor(mouse) {
    const shaders = {
      physical: require('./shaders/custom_meshphysical.glsl').CustomMeshPhysicalShader,
    };

    this.uniforms = THREE.UniformsUtils.clone(shaders.physical.uniforms);
    this.vertex = shaders.physical.vertexShader;
    this.fragment = shaders.physical.fragmentShader;

    this.uniforms.uTime = { value: 1.0 };
    this.uniforms.uRandom = { value: Math.random() };
    this.uniforms.uScale = { value: 0.001 };

    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: this.vertex,
      fragmentShader: this.fragment,
      lights: true,
    });
  }

  update(target) {
    this.uniforms.uTime.value += 0.01;
    this.uniforms.uScale.value = target.scale.x * Math.max(1 - scrollPercent, 0.25);

    // When the sphere goes small, reset material
    if (target.scale.x <= 0.001) {
      this.uniforms.uRandom.value = Math.random();
    }
  }
}

const WebGLRendererWrapper = () => {
  const { gl } = useThree();
  const isOnTouchScreen = 'ontouchstart' in window;

  // Renderer
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

const Spheres = ({ mouse, isOnTouchScreen }) => {
  const mesh = useRef(null);
  const instanceScaleAttribute = useRef(null);

  // ... sphere-related logic and effects ...

  useFrame(() => {
    // ... animate function content ...
  });

  return (
    <instancedMesh ref={mesh} args={[geometry, material, N]}>
      <bufferGeometry />
      <shaderMaterial />
    </instancedMesh>
  );
};

const SphereCanvas = () => {
  // Create a reference to the container div
  const container = useRef(null);

  // Check if the device has a touch screen
  const isOnTouchScreen = 'ontouchstart' in window;


  // Render the Canvas component with the WebGLRendererWrapper and your scene content
  return (
    <Box ref={container} className="canvas-container">
      <Canvas
        pixelRatio={window.devicePixelRatio}
        camera={{
          fov: 50,
          aspect: window.innerWidth / container.current.offsetHeight,
          near: 0.1,
          far: 100,
        }}
      >
        <WebGLRendererWrapper />
        <ambientLight intensity={0.2} />
        <directionalLight
          color={0xffffff}
          intensity={3}
          position={[-1, 1.75, 1]}
          castShadow={true}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-4}
          shadow-camera-right={4}
          shadow-camera-top={4}
          shadow-camera-bottom={-4}
          shadow-camera-far={8}
        />
      </Canvas>
    </Box>
  );
};

export default SphereCanvas;
