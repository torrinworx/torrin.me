import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Theme } from 'destamatic-ui';

export const isOnTouchScreen = ('ontouchstart' in window);

const models = ['cone.glb', 'cube.glb', 'sphere.glb', 'suzanne.glb', 'torus.glb'];

export default Theme.use(theme => {
	const Collision = (_, cleanup, mounted) => {
		let camera, renderer;
		const Canvas = <raw:canvas />;
		const scene = new THREE.Scene();

		const settings = {
			dpr: [1, 3],
			shadowMapSize: [1024, 1024],
			antialias: true,
			useShadows: true,
		};

		const color = theme("*").vars("color_main");
		const defaultMaterial = new THREE.MeshStandardMaterial({
			roughness: 0.8,
			metalness: 0,
			emissiveIntensity: 0.3,
			flatShading: true,
		});

		const transitionDuration = 250;
		let isTransitioning = false;
		let transitionStartTime = 0;
		const startColor = new THREE.Color();
		const targetColor = new THREE.Color();

		color.effect((newColor) => {
			startColor.copy(defaultMaterial.color);
			targetColor.set(newColor);
			transitionStartTime = performance.now();
			isTransitioning = true;
		});

		const swoopDuration = 500;
		let swoopStartTime = 0;

		let circle;
		const mouse = new THREE.Vector2();
		const mousePosition = new THREE.Vector3();
		const circlePosition = new THREE.Vector3(0, 0, 45);
		let circleRotation = 0;
		let circleCurrentScale = 1;
		const baseScale = 0.5;
		const hoverScale = 1;
		let pointerFocus = false;

		let loadedObjects = [];
		let lastSpawnTime = 0;
		const spawnInterval = 1000;
		const loader = new GLTFLoader();

		const easeInOutCubic = (t) => {
			return t < 0.5
				? 4 * t * t * t
				: 1 - Math.pow(-2 * t + 2, 3) / 2;
		};

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

		const growShrinkCurve = (x) => {
			// 0 => 0, 0.5 => 1, 1 => 0
			return x < 0.5
				? (x / 0.5)
				: 1 - ((x - 0.5) / 0.5);
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

		const handleColorTransition = () => {
			const currentTime = performance.now();
			const elapsed = currentTime - transitionStartTime;
			const t = Math.min(elapsed / transitionDuration, 1);
			const easedT = easeInOutCubic(t);

			const currentColor = new THREE.Color();
			currentColor.copy(startColor).lerp(targetColor, easedT);
			defaultMaterial.color.copy(currentColor);
			defaultMaterial.emissive.copy(currentColor);

			if (t >= 1) {
				isTransitioning = false;
				startColor.copy(targetColor);
			}
		};

		const spawnObject = () => {
			const randomModel = models[Math.floor(Math.random() * models.length)];
			loader.load(randomModel, (gltf) => {
				const mesh = gltf.scene.children.find(
					(child) => child instanceof THREE.Mesh
				);
				if (mesh) {
					// Random position, velocity, rotation
					const randomRange = 5;
					const [rx, ry, rz] = [(Math.random() - 0.5) * randomRange, (Math.random() - 0.5) * randomRange, (Math.random() - 0.5) * randomRange,];
					const [vx, vy, vz] = [(Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2,];

					mesh.position.set(rx, ry, rz);
					mesh.material = defaultMaterial;
					mesh.castShadow = settings.useShadows;
					mesh.receiveShadow = settings.useShadows;

					// Rotation axis & speed
					const rotationAxis = new THREE.Vector3(
						Math.random() - 0.5,
						Math.random() - 0.5,
						Math.random() - 0.5
					).normalize();
					const rotationSpeed = 0.01 + Math.random() * 0.02;

					// Attach custom data for animation
					mesh.userData.velocity = new THREE.Vector3(vx, vy, vz);
					mesh.userData.age = 0;
					mesh.userData.lifetime = 300 + Math.random() * 400; // frames
					mesh.userData.scale = 0; // start scale
					mesh.userData.rotationAxis = rotationAxis;
					mesh.userData.rotationSpeed = rotationSpeed;

					scene.add(mesh);
					loadedObjects.push(mesh);
				}
			});
		};

		const handleCollisions = () => {
			for (let i = 0; i < loadedObjects.length; i++) {
				const objA = loadedObjects[i];
				for (let j = i + 1; j < loadedObjects.length; j++) {
					const objB = loadedObjects[j];

					const posA = objA.position;
					const posB = objB.position;
					const delta = new THREE.Vector3().subVectors(posB, posA);
					const distSq = delta.lengthSq();

					// Approximate bounding radius
					const rA = (objA.userData.scale || 0.5) * 0.8;
					const rB = (objB.userData.scale || 0.5) * 0.8;
					const minDist = rA + rB;

					if (distSq < minDist * minDist && distSq > 0.0001) {
						// They intersect, so push them apart
						const dist = Math.sqrt(distSq);
						const overlap = minDist - dist;
						delta.normalize();

						posA.addScaledVector(delta, -overlap * 0.5);
						posB.addScaledVector(delta, overlap * 0.5);

						// Basic elastic collision approximation
						const velA = objA.userData.velocity;
						const velB = objB.userData.velocity;
						if (velA && velB) {
							const dotA = velA.dot(delta);
							const dotB = velB.dot(delta);
							const swap = dotA;
							velA.addScaledVector(delta, dotB - dotA);
							velB.addScaledVector(delta, swap - dotB);

							// Dampen to avoid infinite bounce
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

		const animate = () => {
			requestAnimationFrame(animate);

			const now = performance.now();
			if (now - lastSpawnTime > spawnInterval) {
				spawnObject();
				lastSpawnTime = now;
			}

			const swoopProgress = getSwoopProgress();
			const zStart = 45;
			const zEnd = 0;
			circlePosition.z = zStart + (zEnd - zStart) * swoopProgress;

			mousePosition.set(mouse.x, mouse.y, 0);
			mousePosition.unproject(camera);
			mousePosition.sub(camera.position).normalize();
			const distance = -camera.position.z / mousePosition.z;
			mousePosition.multiplyScalar(distance).add(camera.position);

			const followFactor = 0.15;
			circlePosition.x += (mousePosition.x - circlePosition.x) * followFactor;
			circlePosition.y += (mousePosition.y - circlePosition.y) * followFactor;

			const targetScale = pointerFocus ? hoverScale : baseScale;
			circleCurrentScale += (targetScale - circleCurrentScale) * 0.1;
			circle.scale.setScalar(circleCurrentScale);

			const rotationSpeed = pointerFocus ? 0.05 : 0.01;
			circleRotation += rotationSpeed;
			circle.rotation.z = circleRotation;
			circle.position.copy(circlePosition);

			loadedObjects.forEach((obj, index) => {
				obj.userData.age++;
				const age = obj.userData.age;
				const lifetime = obj.userData.lifetime;
				const t = Math.min(age / lifetime, 1.0);
				const scaleVal = growShrinkCurve(t);
				obj.userData.scale = scaleVal;
				obj.scale.setScalar(scaleVal);

				if (scaleVal <= 0.0 && age > lifetime) {
					scene.remove(obj);
					loadedObjects.splice(index, 1);
					return;
				}

				if (scaleVal < 0.001) return;

				const dirToCircle = new THREE.Vector3().subVectors(
					circlePosition,
					obj.position
				);
				const dist2 = dirToCircle.lengthSq();
				if (dist2 > 0.00001) {
					dirToCircle.normalize();
					if (dist2 > 4.0) {
						obj.userData.velocity.add(dirToCircle.multiplyScalar(0.01));
					} else {
						obj.userData.velocity.add(dirToCircle.multiplyScalar(-0.05));
					}
				}

				obj.userData.velocity.multiplyScalar(0.94);
				obj.position.add(obj.userData.velocity);

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
				antialias: settings.antialias,
			});
			renderer.setSize(width, height);
			renderer.setPixelRatio(
				Math.min(window.devicePixelRatio, settings.dpr[1])
			);
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

			for (let i = 0; i < 5; i++) {
				spawnObject();
			}

			const circleGeometry = createCircleGeometry(1, 10);
			const circleMaterial = new THREE.LineBasicMaterial({
				color: 0xffffff,
				depthTest: false,
			});
			circle = new THREE.LineLoop(circleGeometry, circleMaterial);
			scene.add(circle);

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
