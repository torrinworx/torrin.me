import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Theme } from 'destamatic-ui';

export const isOnTouchScreen = ('ontouchstart' in window);

const models = [
	'models/cone.glb',
	'models/cube.glb',
	'models/sphere.glb',
	'models/suzanne.glb',
	'models/torus.glb',
];

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

		const transitionDuration = 250;
		let isTransitioning = false;
		let transitionStartTime = 0;
		let startColor = new THREE.Color();
		let targetColor = new THREE.Color();

		// ease in-out
		const easeInOutCubic = (t) => {
			return t < 0.5
				? 4 * t * t * t
				: 1 - Math.pow(-2 * t + 2, 3) / 2;
		};

		color.effect(newColor => {
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

			// Load models
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

			const animate = () => {
				requestAnimationFrame(animate);

				if (isTransitioning) {
					const currentTime = performance.now();
					const elapsed = currentTime - transitionStartTime;
					const t = Math.min(elapsed / transitionDuration, 1);
					const easedT = easeInOutCubic(t);

					// Interpolate color
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

		return <Canvas style={{
			position: 'fixed',
			top: 0,
			left: 0,
			width: '100%',
			height: '100%',
			pointerEvents: 'none',
		}} />;
	};

	return Collision;
});
