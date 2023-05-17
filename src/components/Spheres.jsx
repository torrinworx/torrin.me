
import React, { useRef, useEffect } from "react";
import * as THREE from "three"
import { useFrame, useThree } from "react-three-fiber";
import { useTexture } from "@react-three/drei"
import { useSphere } from "@react-three/cannon";

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
const numberOfSpheres = mapAndRound(window.innerWidth, 300, 2000, 10, 30);

export const Spheres = () => {
    const { viewport } = useThree();

    const sphereGeometry = new THREE.SphereGeometry(1, 32, 32)
    const sphereMaterial = new THREE.MeshStandardMaterial({ color: "red", roughness: 0, envMapIntensity: 0.2, emissive: "#370037" })
    const texture = useTexture("./cross.jpg");

    const rfs = THREE.MathUtils.randFloatSpread

    const [ref, api] = useSphere((index) => ({
        args: [1],
        mass: 0.8,
        angularDamping: 0.1,
        linearDamping: 0.65,
        position: [rfs(20), rfs(20), rfs(20)],
    }));

    const mat = useRef(new THREE.Matrix4());
    const vec = useRef(new THREE.Vector3());

    const mouse = useRef(new THREE.Vector3(0, 0, 0));
    const mousePos = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const updateMousePos = (event) => {
            // Convert to normalized device coordinates
            mousePos.current.x = (event.clientX / window.innerWidth) * 2 - 1;
            mousePos.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
        };

        window.addEventListener('mousemove', updateMousePos);

        // Remove the event listener on unmount
        return () => window.removeEventListener('mousemove', updateMousePos);
    }, []);
    
    useFrame((state) => {
        mouse.current.set(
            (mousePos.current.x * viewport.width) / 2,
            (mousePos.current.y * viewport.height) / 2,
            0
        );

        for (let i = 0; i < numberOfSpheres; i++) {
            ref.current.getMatrixAt(i, mat.current);
            const direction = new THREE.Vector3().subVectors(mouse.current, vec.current.setFromMatrixPosition(mat.current)).normalize();
            const body = api.at(i); // Get the body at index i
            if (body) { // Check if body is not undefined
                body.applyForce(direction.multiplyScalar(10).toArray(), [0, 0, 0]);
            } else {
                console.warn(`No body at index ${i}`);
            }
        }
    });

    return (
        <instancedMesh
            ref={ref}
            castShadow
            receiveShadow
            args={[null, null, numberOfSpheres]} // Use numberOfSpheres to set the number of instances
            geometry={sphereGeometry}
            material={sphereMaterial}
            material-map={texture}
        />
    );
};

export default Spheres;
