import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Theme } from 'destamatic-ui';

export const isOnTouchScreen = ('ontouchstart' in window);

const models = ['cone.glb', 'cube.glb', 'sphere.glb', 'suzanne.glb', 'torus.glb'];

const random = (min = 1, max) => {
	if (max === undefined) {
		max = min;
		min = 0;
	}
	return (Math.random() * (max - min) + min);
};

const smoothstep = (min, max, value) => {
	const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
	return x * x * (3 - 2 * x);
};

// Resets and randomizes an object's state
const resetObject = (obj, circlePosition) => {
	const range = 20; // spawn range
	obj.position.set(
		random(-range, range),
		random(-range, range),
		random(-range, range)
	);

	// Calculate direction from circle to object
	const direction = new THREE.Vector3().subVectors(obj.position, circlePosition).normalize();

	// Calculate tangential vector (perpendicular to direction)
	let tangential = new THREE.Vector3(0, 0, 1).cross(direction).normalize();
	if (tangential.length() === 0) {
		tangential = new THREE.Vector3(1, 0, 0).cross(direction).normalize();
	}

	// Assign velocity with both radial and tangential components
	const radialSpeed = random(-0.2, 0.2);
	const tangentialSpeed = random(0.3, 0.6);
	obj.userData.velocity.set(
		direction.x * radialSpeed + tangential.x * tangentialSpeed,
		direction.y * radialSpeed + tangential.y * tangentialSpeed,
		direction.z * radialSpeed + tangential.z * tangentialSpeed
	);

	// Random rotation axis + speed
	obj.userData.rotationAxis.set(
		random(-1, 1),
		random(-1, 1),
		random(-1, 1)
	).normalize();
	obj.userData.rotationSpeed = random(0.01, 0.03);

	// Age / life
	obj.userData.age = 0;
	obj.userData.lifetime = random(300, 600);

	// Start scale almost zero
	obj.userData.scale = 0.001;
	obj.scale.setScalar(obj.userData.scale);
};

export default Theme.use(theme => {
	const Collision = (_, cleanup, mounted) => {
		const Canvas = <raw:canvas />;
		const scene = new THREE.Scene();

		const settings = {
			// 1) Lower the shadowMapSize to [512, 512].
			// 2) Disable anti-aliasing (antialias: false).
			// 3) We'll further restrict pixel ratio to 1, below in mounted().
			dpr: [1, 3],
			shadowMapSize: [512, 512],
			antialias: false,
			useShadows: true,
		};

		let camera, renderer;

		const defaultMaterial = new THREE.MeshStandardMaterial({
			roughness: 1,
			metalness: 0,
			emissiveIntensity: 0.3,
			flatShading: false,
		});

		const secondaryMaterial = new THREE.MeshStandardMaterial({
			roughness: 1,
			metalness: 0,
			emissiveIntensity: 0.3,
			flatShading: false,
		});

		const transitionDuration = 250;
		let isTransitioning = false;
		let transitionStartTime = 0;
		const startColor = new THREE.Color();
		const targetColor = new THREE.Color();

		let isSecondaryTransitioning = false;
		let secondaryTransitionStartTime = 0;
		const secondaryStartColor = new THREE.Color();
		const secondaryTargetColor = new THREE.Color();

		const colorMain = theme("*").vars("color_main");
		colorMain.effect(newColor => {
			startColor.copy(defaultMaterial.color);
			targetColor.set(newColor);
			transitionStartTime = performance.now();
			isTransitioning = true;
		});

		const colorSecond = theme("*").vars('color_grad_tr');
		colorSecond.effect(newColor => {
			secondaryStartColor.copy(secondaryMaterial.color);
			secondaryTargetColor.set(newColor);
			secondaryTransitionStartTime = performance.now();
			isSecondaryTransitioning = true;
		});

		const easeInOutCubic = (t) => {
			return t < 0.5
				? 4 * t * t * t
				: 1 - Math.pow(-2 * t + 2, 3) / 2;
		};

		const handleColorTransition = () => {
			const currentTime = performance.now();
			const elapsed = currentTime - transitionStartTime;
			const t = Math.min(elapsed / transitionDuration, 1);
			const easedT = easeInOutCubic(t);

			defaultMaterial.color.copy(startColor).lerp(targetColor, easedT);
			defaultMaterial.emissive.copy(startColor).lerp(targetColor, easedT);

			if (t >= 1) {
				isTransitioning = false;
				startColor.copy(targetColor);
			}
		};

		const handleSecondaryColorTransition = () => {
			const currentTime = performance.now();
			const elapsed = currentTime - secondaryTransitionStartTime;
			const t = Math.min(elapsed / transitionDuration, 1);
			const easedT = easeInOutCubic(t);

			secondaryMaterial.color.copy(secondaryStartColor).lerp(secondaryTargetColor, easedT);
			secondaryMaterial.emissive.copy(secondaryStartColor).lerp(secondaryTargetColor, easedT);

			if (t >= 1) {
				isSecondaryTransitioning = false;
				secondaryStartColor.copy(secondaryTargetColor);
			}
		};

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

		const MAX_OBJECTS = 10;
		const loadedObjects = [];
		const loader = new GLTFLoader();

		const objectsByType = {};
		const spawnAllObjects = () => {
			for (let i = 0; i < MAX_OBJECTS; i++) {
				const modelPath = models[Math.floor(Math.random() * models.length)];
				loader.load(modelPath, (gltf) => {
					const mesh = gltf.scene.children.find(child => child instanceof THREE.Mesh);
					if (mesh) {
						mesh.material = defaultMaterial;
						mesh.castShadow = settings.useShadows;
						mesh.receiveShadow = settings.useShadows;

						// 6) Ensure objects can be frustum-culled by default:
						mesh.frustumCulled = true;

						mesh.userData.modelPath = modelPath;
						mesh.userData.velocity = new THREE.Vector3();
						mesh.userData.rotationAxis = new THREE.Vector3();
						mesh.userData.rotationSpeed = 0.01;
						mesh.userData.age = 0;
						mesh.userData.lifetime = 300;
						mesh.userData.scale = 0.001;

						resetObject(mesh, circlePosition);
						scene.add(mesh);
						loadedObjects.push(mesh);

						if (!objectsByType[modelPath]) {
							objectsByType[modelPath] = [];
						}
						objectsByType[modelPath].push(mesh);

						const objs = objectsByType[modelPath];
						const n = objs.length;
						const half = Math.floor(n / 2);

						for (let j = 0; j < n; j++) {
							objs[j].material = (j < half) ? secondaryMaterial : defaultMaterial;
						}
					}
				});
			}
		};

		// Partitioning the space in a grid to reduce pairwise checks.
		// For each object, place it in a cell based on its position, then only 
		// check collisions among objects in the same or neighboring cells.
		const cellSize = 10;
		const getCellIndex = (pos) => {
			const x = Math.floor(pos.x / cellSize);
			const y = Math.floor(pos.y / cellSize);
			const z = Math.floor(pos.z / cellSize);
			return `${x},${y},${z}`;
		};

		// Return the cell keys for the 26 neighboring cells (including the cell itself):
		const getNeighborCells = (x, y, z) => {
			const neighbors = [];
			for (let dx = -1; dx <= 1; dx++) {
				for (let dy = -1; dy <= 1; dy++) {
					for (let dz = -1; dz <= 1; dz++) {
						neighbors.push(`${x + dx},${y + dy},${z + dz}`);
					}
				}
			}
			return neighbors;
		};

		const handleCollisions = () => {
			// Build dictionary of objects by cell
			const grid = {};
			for (const obj of loadedObjects) {
				// Skip invisible or frustum-culled objects
				if (!obj.visible) continue;

				const cellKey = getCellIndex(obj.position);
				if (!grid[cellKey]) grid[cellKey] = [];
				grid[cellKey].push(obj);
			}

			// For each occupied cell, check collisions among objects in that cell and neighbors
			for (const cellKey in grid) {
				const [cx, cy, cz] = cellKey.split(',').map(Number);
				const neighborKeys = getNeighborCells(cx, cy, cz);

				for (const neighborKey of neighborKeys) {
					if (!grid[neighborKey]) continue;
					// Compare all objects in cellKey with those in neighborKey
					const objectsA = grid[cellKey];
					const objectsB = grid[neighborKey];

					for (let i = 0; i < objectsA.length; i++) {
						const objA = objectsA[i];
						if (!objA.userData) continue;

						for (let j = 0; j < objectsB.length; j++) {
							// Avoid double-check or checking same object
							if (cellKey === neighborKey && j <= i) continue;

							const objB = objectsB[j];
							if (!objB.userData) continue;

							const posA = objA.position;
							const posB = objB.position;

							// 1) Skip collisions if objects are far apart
							const delta = new THREE.Vector3().subVectors(posB, posA);
							const distSq = delta.lengthSq();
							// E.g. skip if further than 200 units away (tweak to your liking)
							if (distSq > 200 * 200) continue;

							const rA = (objA.userData.scale || 0.5) * 0.9;
							const rB = (objB.userData.scale || 0.5) * 0.9;
							const minDist = rA + rB;

							if (distSq < minDist * minDist && distSq > 0.0001) {
								const dist = Math.sqrt(distSq);
								const overlap = minDist - dist;
								delta.normalize();

								posA.addScaledVector(delta, -overlap * 0.5);
								posB.addScaledVector(delta, overlap * 0.5);

								const velA = objA.userData.velocity;
								const velB = objB.userData.velocity;
								if (velA && velB) {
									const dotA = velA.dot(delta);
									const dotB = velB.dot(delta);
									velA.addScaledVector(delta, dotB - dotA);
									velB.addScaledVector(delta, dotA - dotB);

									velA.multiplyScalar(0.9);
									velB.multiplyScalar(0.9);
								}
							}
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
				if (nodeName === 'a' || nodeName === 'button' || computedStyle.cursor === 'pointer') {
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

			// Frustum for culling checks
			camera.updateMatrixWorld();
			const frustum = new THREE.Frustum();
			const cameraViewProjectionMatrix = new THREE.Matrix4();
			cameraViewProjectionMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
			frustum.setFromProjectionMatrix(cameraViewProjectionMatrix);

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

			// Circle rotation
			const rotationSpeed = pointerFocus ? 0.05 : 0.01;
			circleRotation += rotationSpeed;
			circle.rotation.z = circleRotation;
			circle.position.copy(circlePosition);

			// Circle velocity
			circleVelocity.copy(circlePosition).sub(circlePreviousPosition);
			const circleSpeed = circleVelocity.length();
			circlePreviousPosition.copy(circlePosition);

			loadedObjects.forEach((obj) => {
				if (!obj.userData) return;

				// Hide objects that are not in the camera frustum
				// they won't be rendered, and we skip collisions for them
				obj.visible = frustum.intersectsObject(obj);

				obj.userData.age++;
				const age = obj.userData.age;
				const life = obj.userData.lifetime;
				const t = age / life;

				// Update scale
				let scl = smoothstep(0.0, 0.15, t) * (1.0 - Math.pow(Math.max(0.0, Math.abs(t) * 2.0 - 1.0), 10.0)) * 1.4;
				if (scl < 0.001) scl = 0.001;
				obj.userData.scale = scl;
				obj.scale.setScalar(scl);

				if (age > life) {
					resetObject(obj, circlePosition);
				}

				if (obj.userData.scale > 0.002) {
					const forceDir = new THREE.Vector3().subVectors(circlePosition, obj.position);
					const dist2 = forceDir.lengthSq();
					const attractionMultiplier = 300.0;

					if (dist2 > 0.00001) {
						forceDir.normalize();
						obj.userData.velocity.addScaledVector(forceDir, attractionMultiplier * 0.000015);
					}

					// Calculate and apply tangential force
					const tangentialForce = new THREE.Vector3().crossVectors(forceDir, new THREE.Vector3(0, 0, 1))
						.normalize()
						.multiplyScalar(0.00002);
					obj.userData.velocity.add(tangentialForce);

					// Fling away if circle is moving quickly
					const circleRadius = circleCurrentScale;
					const objectRadius = obj.userData.scale * 1.1;
					const padDistance = circleRadius + objectRadius;
					const dist = obj.position.distanceTo(circlePosition);

					if (circleSpeed > 0.25 && dist < padDistance) {
						const normal = new THREE.Vector3().subVectors(obj.position, circlePosition).normalize();
						if (obj.userData.velocity.dot(normal) < 0) {
							obj.userData.velocity.reflect(normal);
							obj.userData.velocity.multiplyScalar(1.2);
						}
					}
				}

				// Increased damping
				obj.userData.velocity.multiplyScalar(0.99);

				// Clamp small velocities to zero
				['x', 'y', 'z'].forEach(axis => {
					if (Math.abs(obj.userData.velocity[axis]) < 0.0001) {
						obj.userData.velocity[axis] = 0;
					}
				});

				// Limit maximum velocity
				const maxVelocity = 2.0;
				if (obj.userData.velocity.length() > maxVelocity) {
					obj.userData.velocity.setLength(maxVelocity);
				}

				obj.position.add(obj.userData.velocity);

				if (obj.userData.rotationAxis) {
					obj.rotateOnAxis(obj.userData.rotationAxis, obj.userData.rotationSpeed);
				}
			});

			// Handle collision detection among objects
			handleCollisions();

			if (isTransitioning) handleColorTransition();
			if (isSecondaryTransitioning) handleSecondaryColorTransition();

			renderer.render(scene, camera);
		};

		mounted(() => {
			const width = Canvas.clientWidth;
			const height = Canvas.clientHeight;

			// Create renderer with no AA, alpha for transparency
			renderer = new THREE.WebGLRenderer({
				canvas: Canvas,
				alpha: true,
				antialias: settings.antialias
			});
			renderer.setSize(width, height);

			// Restrict pixel ratio to 1 to avoid excessive rendering load:
			renderer.setPixelRatio(1);

			renderer.shadowMap.enabled = settings.useShadows;
			renderer.shadowMap.type = THREE.PCFSoftShadowMap;

			camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
			camera.position.set(0, 0, 30);
			scene.add(camera);

			// Light with lower shadow resolution
			const spotLight = new THREE.SpotLight(0xffffff, 2000, 100.0);
			spotLight.position.set(0, 30, 10);

			const targetObject = new THREE.Object3D();
			scene.add(targetObject);
			targetObject.position.set(0, 0, 0);

			spotLight.target = targetObject;
			spotLight.castShadow = settings.useShadows;
			spotLight.shadow.mapSize.width = settings.shadowMapSize[0];
			spotLight.shadow.mapSize.height = settings.shadowMapSize[1];
			scene.add(spotLight);

			const circleGeometry = createCircleGeometry(1, 12);
			const circleMaterial = new THREE.LineBasicMaterial({
				color: 0xffffff,
				depthTest: false,
				depthWrite: false,
			});
			circle = new THREE.LineLoop(circleGeometry, circleMaterial);
			scene.add(circle);

			spawnAllObjects();
			swoopStartTime = performance.now();

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
