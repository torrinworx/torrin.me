import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Theme } from 'destamatic-ui';

export const isOnTouchScreen = ('ontouchstart' in window);

const models = ['models/cone.glb', 'models/cube.glb', 'models/sphere.glb', 'models/suzanne.glb', 'models/torus.glb',];

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

		const color = theme('*').vars('color_main');
		const defaultMaterial = new THREE.MeshStandardMaterial({
			roughness: 0.8,
			metalness: 0,
			emissiveIntensity: 0.1,
			flatShading: true,
		});

		// Smooth color transitions (used when theme color changes).
		const transitionDuration = 250;
		let isTransitioning = false;
		let transitionStartTime = 0;
		const startColor = new THREE.Color();
		const targetColor = new THREE.Color();

		const easeInOutCubic = (t) => {
			// A standard cubic ease in/out for color transitions and other effects.
			return t < 0.5
				? 4 * t * t * t
				: 1 - Math.pow(-2 * t + 2, 3) / 2;
		};

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

		function createCircleGeometry(radius, segments) {
			const geometry = new THREE.BufferGeometry();
			const vertices = [];

			for (let i = 0; i <= segments; i++) {
				const segment = (i * Math.PI * 2) / segments;
				vertices.push(radius * Math.cos(segment), radius * Math.sin(segment), 0);
			}

			geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
			return geometry;
		}

		// For the “swoop in” effect from behind the camera.
		const swoopDuration = 500;
		let swoopStartTime = 0;
		const getSwoopProgress = () => {
			const elapsed = performance.now() - swoopStartTime;
			const t = Math.min(elapsed / swoopDuration, 1);
			return easeInOutCubic(t);
		};

		// Variables for spinning & scaling the circle on pointer focus.
		let circleRotation = 0;       // track the overall rotation angle
		let circleCurrentScale = 1;   // current scale factor
		const baseScale = .5;
		const hoverScale = 1;       // scale when pointerFocus is true
		let pointerFocus = false;     // true if mouse is over clickable element

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

			// Load several models in a row
			const loader = new GLTFLoader();
			const spacing = 4;
			const startX = -(models.length - 1) * spacing * 0.5;

			models.forEach((modelPath, i) => {
				loader.load(modelPath, (gltf) => {
					const mesh = gltf.scene.children.find(child => child instanceof THREE.Mesh);
					if (mesh) {
						mesh.scale.set(1, 1, 1);
						mesh.material = defaultMaterial;
						mesh.position.set(startX + i * spacing, 0, 0);
						mesh.castShadow = settings.useShadows;
						mesh.receiveShadow = settings.useShadows;
						scene.add(mesh);
					}
				});
			});

			// Create the circle geometry that follows the mouse.
			const circleGeometry = createCircleGeometry(1, 10);
			const circleMaterial = new THREE.LineBasicMaterial({
				color: 0xffffff,
				depthTest: false,
			});
			const circle = new THREE.LineLoop(circleGeometry, circleMaterial);
			scene.add(circle);

			// We'll track the mouse in clip space, then unproject to world space.
			const mouse = new THREE.Vector2();
			const mousePosition = new THREE.Vector3();
			// We'll store the circle's world position here so we can do a smooth 2D lerp.
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
						nodeName === 'a' ||
						nodeName === 'button' ||
						computedStyle.cursor === 'pointer'
					) {
						pointerFocus = true;
					} else {
						pointerFocus = false;
					}
				}

				// Update our mouse.x / mouse.y for unprojection.
				mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
				mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
			};

			window.addEventListener('pointermove', handlePointerMove);

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

				// Have the circle “swoop in” from z=45 to z=0
				const swoopProgress = getSwoopProgress();
				const zStart = 45;
				const zEnd = 0;
				circlePosition.z = zStart + (zEnd - zStart) * swoopProgress;

				// Grow/spin the circle if pointerFocus = true
				// Otherwise, gently revert back to normal scale & slower spin.
				const targetScale = pointerFocus ? hoverScale : baseScale;
				circleCurrentScale += (targetScale - circleCurrentScale) * 0.1;  // Lerp scale
				circle.scale.setScalar(circleCurrentScale);

				// Spin
				const rotationSpeed = pointerFocus ? 0.05 : 0.01; // Faster spin when “hover”
				circleRotation += rotationSpeed;
				circle.rotation.z = circleRotation;

				circle.position.copy(circlePosition);

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
			window.addEventListener('resize', updateCamera);
		});

		cleanup(() => {
			if (renderer) {
				renderer.dispose();
			}
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
