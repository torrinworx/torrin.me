import React, { useState, useRef, useEffect, useContext } from "react";
import * as THREE from "three";
import { ThemeContext } from "../../Theme";

// Helper function to create a circle geometry
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

// Custom hook to determine if an element is hovered
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
	const canvasRef = {};
	const scene = useRef(new THREE.Scene());
	const camera = useRef(new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000));
	const renderer = useRef(new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true }));

	const mesh = {};
	const mousePos = { x: 0, y: 0 };


	const speed = 2;
	const scale = 8;
	
	mount(() => {
		camera.current.position.z = 50;
		renderer.current.setSize(window.innerWidth, window.innerHeight);
		renderer.current.setPixelRatio(window.devicePixelRatio);

		const geometry = createCircleGeometry(3, 6);
		const material = new THREE.LineBasicMaterial({ color: 'white', depthTest: false, transparent: true, opacity: 1 });
		mesh.current = new THREE.LineLoop(geometry, material);
		scene.current.add(mesh.current);

		const onWindowResize = () => {
			camera.current.aspect = window.innerWidth / window.innerHeight;
			camera.current.updateProjectionMatrix();
			renderer.current.setSize(window.innerWidth, window.innerHeight);
		};

		window.addEventListener('resize', onWindowResize);

		const onMouseMove = (event) => {
			mousePos.current.x = (event.clientX / window.innerWidth) * 2 - 1;
			mousePos.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
		};

		window.addEventListener('mousemove', onMouseMove);

		const animate = () => {
			requestAnimationFrame(animate);

			const t = performance.now() * 0.001 * speed;
			const infinityX = scale * Math.sin(t) / (1 + Math.pow(Math.cos(t), 2));
			const infinityY = scale * Math.sin(t) * Math.cos(t) / (1 + Math.pow(Math.cos(t), 2));

			const combinedX = (mousePos.current.x * window.innerWidth) / 2 + infinityX;
			const combinedY = (mousePos.current.y * window.innerHeight) / 2 + infinityY;

			if (mesh.current) mesh.current.position.set(combinedX, combinedY, 0);

			renderer.current.render(scene.current, camera.current);
		};

		animate();
	});

	cleanup(() => {
		window.removeEventListener('resize', onWindowResize);

		window.removeEventListener('mousemove', onMouseMove);

	})
};

export default MouseBall;
