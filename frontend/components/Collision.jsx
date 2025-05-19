import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Theme } from 'destamatic-ui';

export const isOnTouchScreen = ('ontouchstart' in window);

const models = ['cone.glb', 'cube.glb', 'sphere.glb', 'suzanne.glb', 'torus.glb',];

export default Theme.use(theme => {
	const Collision = (_, cleanup, mounted) => {
		const Canvas = <raw:canvas />;

		const scene = new THREE.Scene();
		let camera;
		let renderer;

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
			emissiveIntensity: 0.1,
			flatShading: true,
		});

		const transitionDuration = 250;
		let isTransitioning = false;
		let transitionStartTime = 0;
		const startColor = new THREE.Color();
		const targetColor = new THREE.Color();

		// Simple easing function
		const easeInOutCubic = (t) => {
			return t < 0.5
				? 4 * t * t * t
				: 1 - Math.pow(-2 * t + 2, 3) / 2;
		};

		// Handle theme color transitions
		color.effect((newColor) => {
			startColor.copy(defaultMaterial.color);
			targetColor.set(newColor);
			transitionStartTime = performance.now();
			isTransitioning = true;
		});

		const updateCamera = () => {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(window.innerWidth, window.innerHeight);
		};

		// Create geometry for the pointer circle
		function createCircleGeometry(radius, segments) {
			const geometry = new THREE.BufferGeometry();
			const vertices = [];

			for (let i = 0; i <= segments; i++) {
				const segment = (i * Math.PI * 2) / segments;
				vertices.push(radius * Math.cos(segment), radius * Math.sin(segment), 0);
			}

			geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
			return geometry;
		}

		// "Swoop in" effect's duration & timing
		const swoopDuration = 500;
		let swoopStartTime = 0;
		const getSwoopProgress = () => {
			const elapsed = performance.now() - swoopStartTime;
			const t = Math.min(elapsed / swoopDuration, 1);
			return easeInOutCubic(t);
		};

		// Track rotation & scaling for pointer circle
		let circleRotation = 0;
		let circleCurrentScale = 1;
		const baseScale = 0.5;
		const hoverScale = 1;
		let pointerFocus = false;

		// CHANGED/ADDED: We'll store each loaded model along with a velocity vector
		let loadedObjects = []; // for storing each model mesh
		const models = ["cone.glb", "cube.glb", "sphere.glb", "suzanne.glb", "torus.glb"];

		mounted(() => {
			const width = Canvas.clientWidth;
			const height = Canvas.clientHeight;

			renderer = new THREE.WebGLRenderer({
				canvas: Canvas,
				alpha: true,
				antialias: settings.antialias,
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

			// CHANGED: Instead of placing models in a row, spawn randomly near (0,0,0)
			const loader = new GLTFLoader();
			models.forEach((modelPath) => {
				loader.load(modelPath, (gltf) => {
					const mesh = gltf.scene.children.find((child) => child instanceof THREE.Mesh);
					if (mesh) {
						mesh.scale.set(1, 1, 1);
						mesh.material = defaultMaterial;

						// Place them randomly near (0, 0, 0); e.g. within a 5-unit cube
						const randomRange = 5;
						const randomX = (Math.random() - 0.5) * randomRange;
						const randomY = (Math.random() - 0.5) * randomRange;
						const randomZ = (Math.random() - 0.5) * randomRange;
						mesh.position.set(randomX, randomY, randomZ);

						// Store a small velocity in userData for each
						mesh.userData.velocity = new THREE.Vector3(
							(Math.random() - 0.5) * 0.05,
							(Math.random() - 0.5) * 0.05,
							(Math.random() - 0.5) * 0.05
						);

						mesh.castShadow = settings.useShadows;
						mesh.receiveShadow = settings.useShadows;
						scene.add(mesh);

						loadedObjects.push(mesh);
					}
				});
			});

			// Create the circle geometry that follows the mouse
			const circleGeometry = createCircleGeometry(1, 10);
			const circleMaterial = new THREE.LineBasicMaterial({
				color: 0xffffff,
				depthTest: false,
			});
			const circle = new THREE.LineLoop(circleGeometry, circleMaterial);
			scene.add(circle);

			// We'll track the mouse in clip space, then unproject to world space
			const mouse = new THREE.Vector2();
			const mousePosition = new THREE.Vector3();
			const circlePosition = new THREE.Vector3(0, 0, 45); // Start behind camera at z=45

			swoopStartTime = performance.now(); // Start the swoop timer

			const handlePointerMove = (event) => {
				// Basic detection for pointerFocus
				const targetElement = event.target;
				if (!targetElement) {
					pointerFocus = false;
				} else {
					const nodeName = targetElement.nodeName.toLowerCase();
					const computedStyle = window.getComputedStyle(targetElement);

					if (
						nodeName === "a" ||
						nodeName === "button" ||
						computedStyle.cursor === "pointer"
					) {
						pointerFocus = true;
					} else {
						pointerFocus = false;
					}
				}

				// Update our mouse.x / mouse.y for unprojection
				mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
				mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
			};

			window.addEventListener("pointermove", handlePointerMove);

			// ANIMATE
			const animate = () => {
				requestAnimationFrame(animate);

				// Unproject the mouse into world space
				mousePosition.set(mouse.x, mouse.y, 0);
				mousePosition.unproject(camera);
				mousePosition.sub(camera.position).normalize();
				const distance = -camera.position.z / mousePosition.z;
				mousePosition.multiplyScalar(distance).add(camera.position);

				// Smoothly move circlePosition.x/y to the mouse's unprojected location
				const followFactor = 0.15;
				circlePosition.x += (mousePosition.x - circlePosition.x) * followFactor;
				circlePosition.y += (mousePosition.y - circlePosition.y) * followFactor;

				// Have the circle "swoop in" from z=45 to z=0
				const swoopProgress = getSwoopProgress();
				const zStart = 45;
				const zEnd = 0;
				circlePosition.z = zStart + (zEnd - zStart) * swoopProgress;

				// Grow/spin the circle if pointerFocus = true
				// Otherwise, gently revert back to normal scale & slower spin
				const targetScale = pointerFocus ? hoverScale : baseScale;
				circleCurrentScale += (targetScale - circleCurrentScale) * 0.1; // Lerp scale
				circle.scale.setScalar(circleCurrentScale);

				// Spin
				const rotationSpeed = pointerFocus ? 0.05 : 0.01; // Faster spin when "hover"
				circleRotation += rotationSpeed;
				circle.rotation.z = circleRotation;

				circle.position.copy(circlePosition);

				// ADDED: Attract each loaded object to circlePosition
				loadedObjects.forEach((obj) => {
					// Basic gravitational-like attraction
					const direction = circlePosition.clone().sub(obj.position);
					const distSq = direction.lengthSq();
					if (distSq > 0.001) {
						// Force that falls off with distance
						const forceMag = 0.01; // tune this to adjust "gravity" strength
						direction.normalize();
						// Add force to object velocity
						obj.userData.velocity.add(direction.multiplyScalar(forceMag));
					}

					// Add a little damping so they don't fly off too aggressively
					obj.userData.velocity.multiplyScalar(0.98);
					obj.position.add(obj.userData.velocity);
				});

				// Handle color transition
				if (isTransitioning) {
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
				}

				renderer.render(scene, camera);
			};

			animate();
			window.addEventListener("resize", updateCamera);
		});

		cleanup(() => {
			if (renderer) {
				renderer.dispose();
			}
			window.removeEventListener("resize", updateCamera);
		});

		return (
			<Canvas
				style={{
					position: "fixed",
					top: 0,
					left: 0,
					width: "100%",
					height: "100%",
					pointerEvents: "none",
				}}
			/>
		);
	};

	return Collision;
});
