import React, { useContext, useRef, useEffect, useMemo } from "react";
import * as THREE from "three"
import { useFrame, useThree } from "react-three-fiber";
import { useGLTF } from "@react-three/drei"
import { Physics, useSphere } from "@react-three/cannon";
import { gsap } from "gsap";

import { ThemeContext } from "../../Theme";
import MouseBall from "./MouseBall";

const models = [
    "models/cone.glb",
    "models/cube.glb",
    "models/sphere.glb",
    "models/suzanne.glb",
    "models/torus.glb",
];

// Utility function to map a value from one range to another
// const mapAndRound = (
//     value,
//     min1,
//     max1,
//     min2,
//     max2
// ) => {
//     return Math.round(min2 + ((value - min1) * (max2 - min2)) / (max1 - min1));
// };

// Calculate the number of spheres based on the screen width
// var totalNumObjects = mapAndRound(window.innerWidth, 300, 2000, 10, 30);

const ObjectWrangler = ({ glb, material, scalingOn = true, ...props }) => {

    const minSize = 0.5;
    const maxSize = 1;

    const { scene } = useGLTF(glb);
    const { viewport } = useThree();

    const rfs = THREE.MathUtils.randFloatSpread  // Randomize spawn position of objects

    const mesh = useMemo(() => {
        return scene.children.find((child) => child instanceof THREE.Mesh);
    }, [scene]);

    const vec = useRef(new THREE.Vector3());

    const [ref, api] = useSphere(() => ({
        mass: 1.5,
        angularDamping: 0.1,
        linearDamping: 0.1,
        position: [rfs(20), rfs(20), rfs(20)],
        rotation: [rfs(20), rfs(20), rfs(20)],
        // args: [2]
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

    useEffect(() => {
        if (!scalingOn) return;

        const grow = () => {
            const newSize = Math.random() * (maxSize - minSize) + minSize;

            gsap.to(ref.current.scale, {
                x: newSize,
                y: newSize,
                z: newSize,
                duration: 1,
                ease: "Power2.easeOut",
                onComplete: () => {
                    setTimeout(shrink, 2000);  // Wait 2 seconds then shrink
                }
            });
        };

        const shrink = () => {
            gsap.to(ref.current.scale, {
                x: 0,
                y: 0,
                z: 0,
                duration: 1,
                ease: "Power2.easeIn",
                onComplete: () => {
                    setTimeout(grow, 1000);  // Wait 2 seconds then grow
                }
            });
        };

        // Add a random delay before the first grow
        const delay = Math.random() * 3000;  // Delay up to 2 seconds
        setTimeout(() => {
            grow();  // Start the cycle
        }, delay);

    }, [scalingOn, ref]);

    useFrame((state, delta) => {
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
    const { selectedPalette } = useContext(ThemeContext);
    
    const primaryMat = new THREE.MeshStandardMaterial({
        ...selectedPalette.materials.primaryMaterial
    });

    const secondaryMat = new THREE.MeshStandardMaterial({
        ...selectedPalette.materials.secondaryMaterial
    });

    // Deduct the number of ObjectWranglerIndividual components from the total number of objects
    // const totalInstancedObjects = totalNumObjects - models.length;
    // let remainingObjects = totalInstancedObjects % models.length;
    // let extra = 0;

    return (
        <Physics gravity={[0, 2, 0]} iterations={10}>
            <MouseBall />
            {
                models.map((model, index) => {
                    // If there are remaining objects, assign one to the current model and decrease the count
                    // if (remainingObjects > 0) {
                    //     extra = 1;
                    //     remainingObjects--;
                    // } else {
                    //     extra = 0;
                    // }

                    // Pass the selected material to the ObjectWrangler component
                    return (
                        <React.Fragment key={index}>
                            {/* Needs to be fixed so that the number of models correctly matches screen size: */}
                            <ObjectWrangler key={`${index}-individual0`} glb={model} material={primaryMat} />
                            <ObjectWrangler key={`${index}-individual1`} glb={model} material={primaryMat} />
                            <ObjectWrangler key={`${index}-individual2`} glb={model} material={primaryMat} />
                            <ObjectWrangler key={`${index}-individual`} glb={model} material={secondaryMat} />
                        </React.Fragment>
                    );
                })
            }
        </Physics>
    );
};

export default Objects;
