import * as THREE from 'three';

const isOnTouchScreen = 'ontouchstart' in window;

// Not needed in React:
const container = document.querySelector('.canvas-container') as HTMLElement;

interface Skin {
    material: any,
    uniforms?: any,
    fragment?: string,
    vertex?: string,
    update(target?: any): void
}

class PBRSkin implements Skin {

    shaders = {
        physical: require('./shaders/custom_meshphysical.glsl').CustomMeshPhysicalShader,
    };

    material: any;
    uniforms = THREE.UniformsUtils.clone(this.shaders.physical.uniforms);    vertex = this.shaders.physical.vertexShader;
    fragment = this.shaders.physical.fragmentShader;

    constructor(mouse: number) {
        this.uniforms.uTime = { value: 1.0 };
        this.uniforms.uRandom = { value: Math.random() };
        this.uniforms.uScale = { value: 0.001 };

        this.material = new THREE.ShaderMaterial({            uniforms: this.uniforms,
            vertexShader: this.vertex,
            fragmentShader: this.fragment,
            lights: true,
        } );
    }
    
    update(target) {
        this.uniforms.uTime.value += .01;
        this.uniforms.uScale.value = target.scale.x * Math.max(1.-scrollPercent, .25);
        // when the sphere goes small, reset material
        if (target.scale.x <= 0.001) {
            this.uniforms.uRandom.value = Math.random();
        }

    }
}

// Create Scene - Done in React
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 10, window.innerWidth / container.offsetHeight, 10, 50 );
camera.position.z = 30;

// Create Renderer - Done in React
var renderer = new THREE.WebGLRenderer({
    alpha: true,
    premultipliedAlpha: false,
    powerPreference: 'high-performance',
    precision: 'lowp',
    depth: false,
    antialias: true
});
renderer.setSize( window.innerWidth, container.offsetHeight );
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.BasicShadowMap;
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 3;
renderer.physicallyCorrectLights = true;

// Not needed in React - Automatically handled by Fiber:
((renderer.domElement.getContext('webgl') ||
    renderer.domElement.getContext('experimental-webgl')) as WebGLRenderingContext).getExtension('OES_standard_derivatives');

container.appendChild( renderer.domElement );

function map(value: number, min1: number, max1: number, min2: number, max2: number): number {
    return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}
  
const physicsWorker = new Worker("/src/worker-physics.js");

const dt = 1/60, N = Math.round(map(window.innerWidth, 300, 2000, 5, 30));
let physicsData = {
    positions: new Float32Array(N*3),
    quaternions: new Float32Array(N*4),
    scales: new Float32Array(N*4)
};
let geometryData = {
    positions: new Float32Array(N*3),
    quaternions: new Float32Array(N*4),
    scales: new Float32Array(N*4)
};

let sendTime;
let create = false;
let needsupdate = true;
physicsWorker.onmessage = function(e) {
    physicsData.positions = e.data.positions;
    physicsData.quaternions = e.data.quaternions;
    physicsData.scales = e.data.scales;
    
    geometryData.positions.set(physicsData.positions);
    geometryData.quaternions.set(physicsData.quaternions);
    geometryData.scales.set(physicsData.scales);

    needsupdate = true;
    setTimeout(updateWorker, Math.max(dt * 1000 - (Date.now() - sendTime), 0));
};

function updateWorker() {
    if (!needsupdate) {
        return;
    }
    needsupdate = false;
    
    sendTime = Date.now();
    physicsWorker.postMessage({
        create: create,
        N: spheres.length,
        dt: dt,
        positions: physicsData.positions,
        quaternions: physicsData.quaternions,
        scales: physicsData.scales,
        mouse: move
    },[
        physicsData.positions.buffer,
        physicsData.quaternions.buffer,
        physicsData.scales.buffer
    ]);
    create = false;
}

const spheresCenter = new THREE.Object3D();
scene.add(spheresCenter);
let spheres = [];
var geometry = new THREE.InstancedBufferGeometry();
var ballGeometry = new THREE.IcosahedronBufferGeometry(1, 3);
geometry.copy( ballGeometry );
var randomData = new Float32Array(N).map(_ => Math.random());
let instanceRandomAttribute = new THREE.InstancedBufferAttribute( randomData, 1 );
geometry.setAttribute('instanceRandom', instanceRandomAttribute);
var scaleData = new Float32Array(N).map((s, i) => geometryData.scales[i*4 + 4]);
let instanceScaleAttribute = new THREE.InstancedBufferAttribute( scaleData, 1 ).setUsage(THREE.DynamicDrawUsage);
geometry.setAttribute('instanceScale', instanceScaleAttribute);
let material = new PBRSkin(1).material;
let mesh = new THREE.InstancedMesh(geometry, material, N);
spheresCenter.add(mesh);
mesh.castShadow = true;
mesh.receiveShadow = true;

let mouseGeometry = new THREE.CircleGeometry( 1, 10);
mouseGeometry.vertices.shift(); // removes center vertex
let mouseBall = new THREE.LineLoop( mouseGeometry, new THREE.LineBasicMaterial( { color: getComputedStyle(document.documentElement).getPropertyValue('--c-primary').trim() } ) );
if (!isOnTouchScreen) {
    scene.add(mouseBall);
}

function makeSphere() {
    create = true;
    spheres.push(1);
}

var topLight = new THREE.DirectionalLight( 0xffffff, 3 );
topLight.color.setHSL( 0.1, 1, 0.95 );
topLight.position.set( - 1, 1.75, 1 );
topLight.position.multiplyScalar( 2 );
scene.add( topLight );
topLight.castShadow = true;
topLight.shadow.mapSize.width = topLight.shadow.mapSize.height = 2048;
var d = 4;
topLight.shadow.camera.left = - d;
topLight.shadow.camera.right = d;
topLight.shadow.camera.top = d;
topLight.shadow.camera.bottom = - d;
topLight.shadow.camera.far = 8;

let timeSinceLast = 0;
let maxTime = 5;
var doc = document.documentElement;
var cachedClientHeight = doc.clientHeight;
var cachedScrollHeight = doc.scrollHeight;

// mouse intersect plane data
const planeNormal = new THREE.Vector3(0, 0, 1);
const plane = new THREE.Plane(planeNormal, 0);

const raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2(0.,-2.);
let mouseTarget = new THREE.Vector2(0.,0);
let mouseScaleTarget = new THREE.Vector3();
let mosueOverLink = false;
let move = new THREE.Vector3();

// scrolling data
var scrollPercent = 0;
var targetScollPercent = doc.scrollTop / (cachedScrollHeight - cachedClientHeight);

var tmpM = new THREE.Matrix4();
let offset = new THREE.Vector3();
let orientation = new THREE.Quaternion();
let scale = new THREE.Vector3();
let time = 0;
var animate = function () {
    time += 0.01;
    timeSinceLast++;
    requestAnimationFrame( animate );
    
    if (spheres.length < N && timeSinceLast > maxTime) {
        makeSphere();
        timeSinceLast = 0;
        // maxTime = random(20,50);
    }
    
    spheres.forEach((s, i) => {
        offset.set(
            geometryData.positions[3*i+0],
            geometryData.positions[3*i+1],
            geometryData.positions[3*i+2]
        );
        orientation.set(
            geometryData.quaternions[4*i+0],
            geometryData.quaternions[4*i+1],
            geometryData.quaternions[4*i+2],
            geometryData.quaternions[4*i+3]
        );
        scale.setScalar(geometryData.scales[4 * i + 0]);
        tmpM.compose( offset, orientation, scale );
        mesh.setMatrixAt( i, tmpM );

        instanceScaleAttribute.setX(i, geometryData.scales[4*i + 3] / 4);
    });

    instanceScaleAttribute.needsUpdate = true;
    geometry.setAttribute('instanceScale', instanceScaleAttribute);
    mesh.instanceMatrix.needsUpdate = true;

    targetScollPercent = (doc.scrollTop / (cachedScrollHeight - cachedClientHeight));
    scrollPercent += (targetScollPercent - scrollPercent) * 0.01;
    // spheresCenter.rotation.x = scrollPercent * 2;

    if (isOnTouchScreen) {
        mouseTarget.set(Math.cos(time * Math.PI) * .25, Math.cos(time) * .5);
    }

    mouse.lerp(mouseTarget, .15);
    raycaster.setFromCamera(mouse, camera);
    raycaster.ray.intersectPlane(plane, move);
    mouseBall.position.copy(move);

    mouseScaleTarget.setScalar(mosueOverLink ? .25 + mouse.distanceToSquared(mouseTarget) * .5 : .1);
    mouseBall.rotateZ(-.2 * mouseBall.scale.x);

    mouseBall.scale.lerp(mouseScaleTarget, .06);

    renderer.render( scene, camera );
};

updateWorker();
animate();

window.onresize = function() {
    var windowAspect = window.innerWidth / container.offsetHeight;
    cachedClientHeight = doc.clientHeight;
    cachedScrollHeight = doc.scrollHeight;
    camera.aspect = windowAspect;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, container.offsetHeight );
};

if (window.PointerEvent) {
    document.addEventListener('pointermove', onmove, false)
} else {
    document.addEventListener('mousemove', onmove, false)
}

function onmove(e) {
    if (isOnTouchScreen) {
        mouseTarget.set(0,0);
        return e;
    } else {
        mosueOverLink = !!(e.target.nodeName.toLowerCase() == 'a');
        mouseTarget.set(
            (e.clientX / window.innerWidth) * 2 - 1,
            (-(e.clientY / (container.offsetHeight)) * 2 + 1)
        );
    }
}

document.addEventListener('DOMContentLoaded', function() {
    document.documentElement.classList.add('loaded');
}, false);
