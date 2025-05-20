import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Theme } from 'destamatic-ui';

export const isOnTouchScreen = ('ontouchstart' in window);

const models = ['cone.glb', 'cube.glb', 'sphere.glb', 'suzanne.glb', 'torus.glb'];

// Simple random utility
const random = (min = 1, max) => {
	if (max === undefined) {
		max = min;
		min = 0;
	}
	return (Math.random() * (max - min) + min);
};

// Smoothstep function
const smoothstep = (min, max, value) => {
	const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
	return x * x * (3 - 2 * x);
};

// A curve to quickly grow up to about ~0.15 in time, then slowly shrink
const customCurve = (x) => {
	return smoothstep(0.0, 0.15, x) * (1.0 - Math.pow(Math.max(0.0, Math.abs(x) * 2.0 - 1.0), 10.0));
};

// Resets and randomizes an object's state
const resetObject = (obj) => {
	const range = 10; // spawn range
	obj.position.set(
		random(-range, range),
		random(-range, range),
		random(-range, range)
	);

	// Give a random velocity "impulse"
	const vx = random(-0.8, 0.8);
	const vy = random(-0.8, 0.8);
	const vz = random(-0.8, 0.8);
	obj.userData.velocity.set(vx, vy, vz);

	// Random rotation axis + speed
	obj.userData.rotationAxis.set(
		random(-1, 1),
		random(-1, 1),
		random(-1, 1)
	).normalize();
	obj.userData.rotationSpeed = random(0.01, 0.03);

	// Age / life
	obj.userData.age = 0;
	obj.userData.lifetime = random(200, 500);

	// Start scale almost zero
	obj.userData.scale = 0.001;
	obj.scale.setScalar(obj.userData.scale);
};

export default Theme.use(theme => {
	const Collision = (_, cleanup, mounted) => {
		const Canvas = <raw:canvas />;
		const scene = new THREE.Scene();
		const settings = {
			dpr: [1, 3],
			shadowMapSize: [1024, 1024],
			antialias: true,
			useShadows: true,
		};

		let camera, renderer;
		const defaultMaterial = new THREE.MeshStandardMaterial({
			roughness: 0.8,
			metalness: 0.0,
			emissiveIntensity: 0.3,
			flatShading: false,    // Show facets a bit more
			// wireframe: false      // Turn off wireframe, but facets remain visible
		});

		// Handle dynamic color changes for theming
		const transitionDuration = 250;
		let isTransitioning = false;
		let transitionStartTime = 0;
		const startColor = new THREE.Color();
		const targetColor = new THREE.Color();

		const color = theme("*").vars("color_main");
		color.effect(newColor => {
			console.log(newColor);
			startColor.copy(defaultMaterial.color);
			targetColor.set(newColor);
			transitionStartTime = performance.now();
			isTransitioning = true;
		});

		const easeInOutCubic = (t) => {
			return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
		};

		const handleColorTransition = () => {
			const currentTime = performance.now();
			const elapsed = currentTime - transitionStartTime;
			const t = Math.min(elapsed / transitionDuration, 1);
			const easedT = easeInOutCubic(t);

			const currentColor = new THREE.Color().copy(startColor).lerp(targetColor, easedT);
			defaultMaterial.color.copy(currentColor);
			// Optionally tie emissive to the same color so it "pops" slightly

			if (t >= 1) {
				isTransitioning = false;
				startColor.copy(targetColor);
			}
		};

		// Mouse circle geometry
		let circle;
		const mouse = new THREE.Vector2();
		const mousePosition = new THREE.Vector3();
		const circlePosition = new THREE.Vector3(0, 0, 45);
		let pointerFocus = false;
		let circleRotation = 0;
		let circleCurrentScale = 1;
		const baseCircleScale = 0.5;
		const hoverCircleScale = 1;
		let circlePreviousPosition = new THREE.Vector3().copy(circlePosition);
		let circleVelocity = new THREE.Vector3();

		const swoopDuration = 500;
		let swoopStartTime = 0;

		const createCircleGeometry = (radius, segments) => {
			const geometry = new THREE.BufferGeometry();
			const vertices = [];
			for (let i = 0; i <= segments; i++) {
				const segment = (i * Math.PI * 2) / segments;
				vertices.push(
					radius * Math.cos(segment),
					radius * Math.sin(segment),
					0
				);
			}
			geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
			return geometry;
		};

		// Increase the count for a fuller effect
		const MAX_OBJECTS = 30;
		const loadedObjects = [];
		const loader = new GLTFLoader();

		const spawnAllObjects = () => {
			for (let i = 0; i < MAX_OBJECTS; i++) {
				const modelPath = models[Math.floor(Math.random() * models.length)];
				loader.load(modelPath, (gltf) => {
					const mesh = gltf.scene.children.find(child => child instanceof THREE.Mesh);
					if (mesh) {
						const mat = defaultMaterial.clone();
						mesh.material = mat;
						mesh.castShadow = settings.useShadows;
						mesh.receiveShadow = settings.useShadows;

						mesh.userData.velocity = new THREE.Vector3();
						mesh.userData.rotationAxis = new THREE.Vector3();
						mesh.userData.rotationSpeed = 0.01;
						mesh.userData.age = 0;
						mesh.userData.lifetime = 300;
						mesh.userData.scale = 0.001;

						resetObject(mesh);
						scene.add(mesh);
						loadedObjects.push(mesh);
					}
				});
			}
		};

		// Basic bounding-sphere collisions
		const handleCollisions = () => {
			for (let i = 0; i < loadedObjects.length; i++) {
				const objA = loadedObjects[i];
				if (!objA || !objA.userData) continue;

				for (let j = i + 1; j < loadedObjects.length; j++) {
					const objB = loadedObjects[j];
					if (!objB || !objB.userData) continue;

					const posA = objA.position;
					const posB = objB.position;

					const delta = new THREE.Vector3().subVectors(posB, posA);
					const distSq = delta.lengthSq();

					const rA = (objA.userData.scale || 0.5) * 0.9;
					const rB = (objB.userData.scale || 0.5) * 0.9;
					const minDist = rA + rB;

					if (distSq < minDist * minDist && distSq > 0.0001) {
						const dist = Math.sqrt(distSq);
						const overlap = minDist - dist;
						delta.normalize();

						// Separate them
						posA.addScaledVector(delta, -overlap * 0.5);
						posB.addScaledVector(delta, overlap * 0.5);

						// Basic bounce
						const velA = objA.userData.velocity;
						const velB = objB.userData.velocity;
						if (velA && velB) {
							const dotA = velA.dot(delta);
							const dotB = velB.dot(delta);
							velA.addScaledVector(delta, dotB - dotA);
							velB.addScaledVector(delta, dotA - dotB);

							// Slight damping
							velA.multiplyScalar(0.9);
							velB.multiplyScalar(0.9);
						}
					}
				}
			}
		};

		const handlePointerMove = (event) => {
			const targetElement = event.target;
			if (!targetElement) {
				pointerFocus = false;
			} else {
				const nodeName = targetElement.nodeName.toLowerCase();
				const computedStyle = window.getComputedStyle(targetElement);
				if (
					nodeName === 'a' ||
					nodeName === 'button' ||
					computedStyle.cursor === 'pointer'
				) {
					pointerFocus = true;
				} else {
					pointerFocus = false;
				}
			}
			mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
			mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
		};

		const updateCamera = () => {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(window.innerWidth, window.innerHeight);
		};

		const getSwoopProgress = () => {
			const elapsed = performance.now() - swoopStartTime;
			const t = Math.min(elapsed / swoopDuration, 1);
			return easeInOutCubic(t);
		};

		const animate = () => {
			requestAnimationFrame(animate);

			// Circle swoop from z=45
			const swoopProgress = getSwoopProgress();
			const zStart = 45;
			const zEnd = 0;
			circlePosition.z = zStart + (zEnd - zStart) * swoopProgress;

			// Circle follows mouse
			mousePosition.set(mouse.x, mouse.y, 0);
			mousePosition.unproject(camera);
			mousePosition.sub(camera.position).normalize();
			const distance = -camera.position.z / mousePosition.z;
			mousePosition.multiplyScalar(distance).add(camera.position);

			const followFactor = 0.15;
			circlePosition.x += (mousePosition.x - circlePosition.x) * followFactor;
			circlePosition.y += (mousePosition.y - circlePosition.y) * followFactor;

			// Circle scale
			const targetScale = pointerFocus ? hoverCircleScale : baseCircleScale;
			circleCurrentScale += (targetScale - circleCurrentScale) * 0.1;
			circle.scale.setScalar(circleCurrentScale);

			// Circle rotate
			const rotationSpeed = pointerFocus ? 0.05 : 0.01;
			circleRotation += rotationSpeed;
			circle.rotation.z = circleRotation;
			circle.position.copy(circlePosition);

			// Circle velocity
			circleVelocity.copy(circlePosition).sub(circlePreviousPosition);
			const circleSpeed = circleVelocity.length();
			circlePreviousPosition.copy(circlePosition);

			// Update all objects
			loadedObjects.forEach((obj) => {
				if (!obj.userData) return;

				obj.userData.age++;
				const age = obj.userData.age;
				const life = obj.userData.lifetime;
				const t = age / life;

				// Make objects bigger overall
				let scl = customCurve(t) * 1.4;
				if (scl < 0.001) scl = 0.001;
				obj.userData.scale = scl;
				obj.scale.setScalar(scl);

				if (age > life) {
					// Instead of removing, reset 
					resetObject(obj);
				}

				// Reduce attraction so they're more airy
				if (obj.userData.scale > 0.002) {
					const forceDir = new THREE.Vector3().subVectors(circlePosition, obj.position);
					const dist2 = forceDir.lengthSq();
					// Lower multiplier than before
					const attractionMultiplier = 400.0;
					if (dist2 > 0.00001) {
						forceDir.normalize();
						// slightly smaller factor => less "weight"
						obj.userData.velocity.addScaledVector(forceDir, attractionMultiplier * 0.000015);
					}

					// Fling away if circle is moving quickly
					const circleRadius = circleCurrentScale;
					const objectRadius = obj.userData.scale * 1.1;
					const padDistance = circleRadius + objectRadius;
					const dist = obj.position.distanceTo(circlePosition);

					if (circleSpeed > 0.25 && dist < padDistance) {
						const normal = new THREE.Vector3()
							.subVectors(obj.position, circlePosition)
							.normalize();
						if (obj.userData.velocity.dot(normal) < 0) {
							obj.userData.velocity.reflect(normal);
							// Boost the bounce a bit
							obj.userData.velocity.multiplyScalar(1.2);
						}
					}
				}

				// Slightly lower damping => more floaty
				obj.userData.velocity.multiplyScalar(0.97);
				obj.position.add(obj.userData.velocity);

				// Rotate about random axis
				if (obj.userData.rotationAxis) {
					obj.rotateOnAxis(obj.userData.rotationAxis, obj.userData.rotationSpeed);
				}
			});

			handleCollisions();

			if (isTransitioning) handleColorTransition();

			renderer.render(scene, camera);
		};

		mounted(() => {
			const width = Canvas.clientWidth;
			const height = Canvas.clientHeight;

			renderer = new THREE.WebGLRenderer({
				canvas: Canvas,
				alpha: true,
				antialias: settings.antialias
			});
			renderer.setSize(width, height);
			renderer.setPixelRatio(Math.min(window.devicePixelRatio, settings.dpr[1]));
			renderer.shadowMap.enabled = settings.useShadows;
			renderer.shadowMap.type = THREE.PCFSoftShadowMap;

			camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
			camera.position.set(0, 0, 30);
			scene.add(camera);

			const spotLight = new THREE.SpotLight(0xffffff, 100);
			spotLight.position.set(0, 10, 0);
			spotLight.castShadow = settings.useShadows;
			spotLight.shadow.mapSize.width = settings.shadowMapSize[0];
			spotLight.shadow.mapSize.height = settings.shadowMapSize[1];
			scene.add(spotLight);

			// Mouse circle
			const circleGeometry = createCircleGeometry(1, 12);
			const circleMaterial = new THREE.LineBasicMaterial({
				color: 0xffffff,
				depthTest: false
			});
			circle = new THREE.LineLoop(circleGeometry, circleMaterial);
			scene.add(circle);

			// Spawn objects
			spawnAllObjects();
			swoopStartTime = performance.now();

			// Events
			window.addEventListener('pointermove', handlePointerMove);
			window.addEventListener('resize', updateCamera);

			animate();
		});

		cleanup(() => {
			if (renderer) renderer.dispose();
			window.removeEventListener('pointermove', handlePointerMove);
			window.removeEventListener('resize', updateCamera);
		});

		return <Canvas
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				width: '100%',
				height: '100%',
				pointerEvents: 'none',
			}}
		/>;
	};

	return Collision;
});
