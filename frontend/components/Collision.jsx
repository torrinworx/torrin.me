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

		// Observe color from the theme
		const colorObserver = theme('*').vars('color_main');

		// Create a default material placeholder
		let defaultMaterial = new THREE.MeshStandardMaterial({
			// color: (new THREE.Color(colorObserver.get())), // get initial color
			roughness: 0.8,
			metalness: 0,
			emissiveIntensity: 0,
			// emissive: (new THREE.Color(colorObserver.get())), // initial emissive color
			flatShading: true,
		});

		// Reactive effect to update material colors on theme change
		colorObserver.effect(newColor => {
			console.log(newColor);
			const color = new THREE.Color(newColor);
			defaultMaterial.color = color;
			defaultMaterial.emissive = color;
		});

		mounted(() => {
			const width = Canvas.clientWidth;
			const height = Canvas.clientHeight;

			renderer = new THREE.WebGLRenderer({
				canvas: Canvas,
				alpha: true,
				antialias: settings.antialias,
			});
			renderer.setSize(width, height);
			const desiredDPR = Math.min(window.devicePixelRatio, settings.dpr[1]);
			renderer.setPixelRatio(desiredDPR);

			renderer.shadowMap.enabled = settings.useShadows;
			renderer.shadowMap.type = THREE.PCFSoftShadowMap;

			// Camera setup
			camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
			camera.position.set(0, 0, 30);

			// Bright spotlight positioned closer to the models
			const spotLight = new THREE.SpotLight(0xffffff, 100);
			spotLight.position.set(0, 10, 0);
			spotLight.castShadow = settings.useShadows;
			spotLight.shadow.mapSize.width = settings.shadowMapSize[0];
			spotLight.shadow.mapSize.height = settings.shadowMapSize[1];
			scene.add(spotLight);

			// Load each model and position them along the X-axis
			const loader = new GLTFLoader();
			const spacing = 4; // distance between each model
			const startX = -(models.length - 1) * spacing * 0.5; // center them

			models.forEach((modelPath, i) => {
				loader.load(modelPath, (gltf) => {
					const mesh = gltf.scene.children.find(
						(child) => child instanceof THREE.Mesh
					);
					if (mesh) {
						mesh.scale.set(1, 1, 1);
						mesh.material = defaultMaterial;
						mesh.position.set(startX + i * spacing, 0, 0);

						scene.add(mesh);
					}
				});
			});

			const animate = () => {
				requestAnimationFrame(animate);
				renderer.render(scene, camera);
			};
			animate();
		});

		cleanup(() => {
			renderer.dispose();
		});

		return <Canvas
			style={{
				position: 'absolute',
				top: 0,
				left: 0,
				width: '100%',
				height: '100%',
			}}
		/>;
	};

	return Collision;
});
