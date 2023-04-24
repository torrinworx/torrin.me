import React, { useRef } from 'react';

import * as THREE from 'three';
import { extend, Canvas, useThree, useFrame } from '@react-three/fiber';

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

const Sphere = ({ mouse, isOnTouchScreen }) => {
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
  const isOnTouchScreen = 'ontouchstart' in window;
  const mouse = new THREE.Vector2(0, -2);

  const onMove = (e) => {
    if (isOnTouchScreen) {
      mouseTarget.set(0, 0);
      return e;
    } else {
      mosueOverLink = !!(e.target.nodeName.toLowerCase() === 'a');
      mouseTarget.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        (-(e.clientY / container.offsetHeight) * 2 + 1)
      );
    }
  };

  useEffect(() => {
    if (window.PointerEvent) {
      document.addEventListener('pointermove', onMove, false);
    } else {
      document.addEventListener('mousemove', onMove, false);
    }
    return () => {
      document.removeEventListener('pointermove', onMove, false);
      document.removeEventListener('mousemove', onMove, false);
    };
  }, []);

  const onResize = () => {
    const windowAspect = window.innerWidth / container.offsetHeight;
    cachedClientHeight = doc.clientHeight;
    cachedScrollHeight = doc.scrollHeight;
    camera.aspect = windowAspect;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, container.offsetHeight);
  };

  useEffect(() => {
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <Canvas pixelRatio={window.devicePixelRatio}>
      <WebGLRendererWrapper />
      <Sphere mouse={mouse} isOnTouchScreen={isOnTouchScreen} />
      {/* your scene content */}
    </Canvas>
  );
};

export default SphereCanvas;