import React, { useRef, useEffect, useMemo } from "react";
import * as THREE from "three"
import { useFrame, useThree } from "react-three-fiber";
import { useGLTF } from "@react-three/drei"
import { Physics, useSphere } from "@react-three/cannon";
import { selectedPallet } from "../Theme";

import MouseBall from "./MouseBall";

const models = [
    "models/cone.glb",
    "models/cube.glb",
    // "models/cylinder.glb",
    "models/sphere.glb",
    "models/suzanne.glb",
    "models/torus.glb",
];

// Utility function to map a value from one range to another
const mapAndRound = (
    value,
    min1,
    max1,
    min2,
    max2
) => {
    return Math.round(min2 + ((value - min1) * (max2 - min2)) / (max1 - min1));
};

// Calculate the number of spheres based on the screen width
var totalNumObjects = mapAndRound(window.innerWidth, 300, 2000, 10, 30);

export const ObjectWranglerInstanced = ({ glb, material, numberOfObjects, ...props }) => {
    const { scene } = useGLTF(glb);
    const { viewport } = useThree();
    // const texture = useTexture("./cross.jpg");

    const rfs = THREE.MathUtils.randFloatSpread  // Randomize spawn position of objects

    // Physics here is just a sphere, and isn't based on the actual physics of the geometry passed in:

    const mesh = useMemo(() => {
        return scene.children.find((child) => child instanceof THREE.Mesh);
    }, [scene]);

    const [ref, api] = useSphere(
        () => ({
            mass: 1,
            angularDamping: 0.1,
            linearDamping: 0.65,
            position: [rfs(20), rfs(20), rfs(20)],
            rotation: [rfs(20), rfs(20), rfs(20)]
        }),
    );

    const mat = useRef(new THREE.Matrix4());
    const vec = useRef(new THREE.Vector3());

    const mouse = useRef(new THREE.Vector3(0, 0, 0));
    const mousePos = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const updateMousePos = (event) => {
            mousePos.current.x = (event.clientX / window.innerWidth) * 2 - 1;
            mousePos.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
        };

        window.addEventListener('mousemove', updateMousePos);

        return () => window.removeEventListener('mousemove', updateMousePos);
    }, []);

    useFrame((state) => {
        mouse.current.set(
            (mousePos.current.x * viewport.width) / 2,
            (mousePos.current.y * viewport.height) / 2,
            0
        );

        for (let i = 0; i < numberOfObjects; i++) {
            if (ref.current && ref.current.count > i) {
                ref.current.getMatrixAt(i, mat.current);
                const direction = new THREE.Vector3().subVectors(mouse.current, vec.current.setFromMatrixPosition(mat.current)).normalize();
                const body = api.at(i);
                if (body) {
                    body.applyForce(direction.multiplyScalar(10).toArray(), [0, 0, 0]);
                } else {
                    console.warn(`No body at index ${i}`);
                }
            }
        }
    });

    return <instancedMesh
        ref={ref}
        castShadow
        receiveShadow
        args={[
            mesh.geometry,
            material,
            numberOfObjects
        ]}
    />
};

const ObjectWranglerIndividual = ({ glb, material, ...props }) => {
    const { scene } = useGLTF(glb);
    const { viewport } = useThree();

    const rfs = THREE.MathUtils.randFloatSpread  // Randomize spawn position of objects

    const mesh = useMemo(() => {
        return scene.children.find((child) => child instanceof THREE.Mesh);
    }, [scene]);

    const vec = useRef(new THREE.Vector3());

    const [ref, api] = useSphere(() => ({
        mass: 1,
        angularDamping: 0.1,
        linearDamping: 0.65,
        position: [rfs(20), rfs(20), rfs(20)],
        rotation: [rfs(20), rfs(20), rfs(20)]
    }));

    const mouse = useRef(new THREE.Vector3(0, 0, 0));
    const mousePos = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const updateMousePos = (event) => {
            mousePos.current.x = (event.clientX / window.innerWidth) * 2 - 1;
            mousePos.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
        };

        window.addEventListener('mousemove', updateMousePos);

        return () => window.removeEventListener('mousemove', updateMousePos);
    }, []);

    useFrame(() => {
        mouse.current.set(
            (mousePos.current.x * viewport.width) / 2,
            (mousePos.current.y * viewport.height) / 2,
            0
        );

        ref.current.getWorldPosition(vec.current);
        const direction = new THREE.Vector3().subVectors(mouse.current, vec.current).normalize();
        api.applyForce(direction.multiplyScalar(10).toArray(), [0, 0, 0]);
    });

    return (
        <mesh
            ref={ref}
            castShadow
            receiveShadow
            geometry={mesh.geometry}
            material={material}
        />
    );
}

export const Objects = () => {
    const primaryMat = new THREE.MeshStandardMaterial({
        ...selectedPallet.materials.primaryMaterial
    });

    const secondaryMat = new THREE.MeshStandardMaterial({
        ...selectedPallet.materials.secondaryMaterial
    });

    // Deduct the number of ObjectWranglerIndividual components from the total number of objects
    const totalInstancedObjects = totalNumObjects - models.length;
    const objectsPerModel = Math.floor(totalInstancedObjects / models.length);
    let remainingObjects = totalInstancedObjects % models.length;

    let extra = 0;

    return (
        <Physics gravity={[0, 2, 0]} iterations={10}>
            <MouseBall />
            {
                models.map((model, index) => {
                    // If there are remaining objects, assign one to the current model and decrease the count
                    if (remainingObjects > 0) {
                        extra = 1;
                        remainingObjects--;
                    } else {
                        extra = 0;
                    }

                    // Pass the selected material to the ObjectWrangler component
                    return (
                        <React.Fragment key={index}>
                            <ObjectWranglerInstanced key={`${index}-instanced`} glb={`/${model}`} material={primaryMat} numberOfObjects={objectsPerModel + extra} />
                            <ObjectWranglerIndividual key={`${index}-individual`} glb={model} material={secondaryMat} />
                        </React.Fragment>
                    );
                })
            }
        </Physics>
    );
};

export default Objects;
