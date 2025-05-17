import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Theme } from 'destamatic-ui';
import { Observer } from 'destam-dom';

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

		const colorObserver = theme('*').vars('color_main');
		const defaultMaterial = new THREE.MeshStandardMaterial({
			roughness: 0.8,
			metalness: 0,
			emissiveIntensity: 0,
			flatShading: true,
		});

		colorObserver.effect(newColor => {
			const c = new THREE.Color(newColor);
			defaultMaterial.color = c;
			defaultMaterial.emissive = c;
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
			renderer.setPixelRatio(Math.min(window.devicePixelRatio, settings.dpr[1]));
			renderer.shadowMap.enabled = settings.useShadows;
			renderer.shadowMap.type = THREE.PCFSoftShadowMap;

			camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
			camera.position.set(0, 0, 30);

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
						scene.add(mesh);
					}
				});
			});

			// Animation loop
			const animate = () => {
				requestAnimationFrame(animate);
				renderer.render(scene, camera);
			};
			animate();

		});

		cleanup(() => {
			renderer.dispose();
		});

		return <div style={{
			position: 'absolute',
			top: 0,
			left: 0,
			width: '100%',
			height: '100%',
			pointerEvents: 'none',
		}} >
			<Canvas style={{
				width: '100%',
				height: '100%',
			}} />
		</div>;
	};

	return Collision;
});
