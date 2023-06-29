import React, { useState, useEffect, useRef } from "react";
import { Grid, Typography } from "@mui/material";
import { Stage, Container, Graphics, Text, useTick } from '@pixi/react'
import FloatingCard from "../components/FloatingCard";
import { contentMargin } from "../Theme";

const OrbKingdomGame = ({ stageWidth, stageHeight }) => {
    const circle = useRef(null);
    const mapGraphics = useRef(null);
    const mapContainer = useRef(null);

    const mapSize = { width: 2000, height: 2000 };
    const cellSize = 50;

    const [x, setX] = useState(mapSize.width / 2);
    const [y, setY] = useState(mapSize.height / 2);
    const [radius, setRadius] = useState(30);
    const [mousePosition, setMousePosition] = useState({ x: stageWidth / 2, y: stageHeight / 2 });

    const [score, setScore] = useState(0);
    const scoreRef = useRef(null);
    const dots = useRef([]);

    // Dots Spawning
    useEffect(() => {
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * mapSize.width;
            const y = Math.random() * mapSize.height;
            const dot = { x, y, radius: 5 };
            dots.current.push(dot);
        }
    }, [mapSize.height, mapSize.width]);

    // Draw the grid once when the component is mounted
    useEffect(() => {
        if (mapGraphics.current) {
            const graphics = mapGraphics.current;
            graphics.clear();
            graphics.lineStyle(1, 0xAAAAAA);

            for (let i = 0; i <= mapSize.width; i += cellSize) {
                graphics.moveTo(i, 0);
                graphics.lineTo(i, mapSize.height);
            }
            for (let i = 0; i <= mapSize.height; i += cellSize) {
                graphics.moveTo(0, i);
                graphics.lineTo(mapSize.width, i);
            }
        }
    }, [mapSize.width, mapSize.height]);

    useEffect(() => {
        const handleMouseMove = (e) => {
            const rect = e.target.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            setMousePosition({ x: mouseX, y: mouseY });
        };

        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    useTick(() => {
        if (circle.current) {
            const graphics = circle.current;
            graphics.clear();
            graphics.lineStyle(2, 0x333333, 1);
            graphics.beginFill(0xff0000);
            graphics.drawCircle(0, 0, radius);
            graphics.endFill();

            // Calculate the scale based on the player's size and stage size
            const scale = Math.min(stageHeight / (radius * 4), 1);

            // Scale and offset mouse position
            const scaledMouseX = (mousePosition.x + (x - stageWidth / 2) / scale) * scale;
            const scaledMouseY = (mousePosition.y + (y - stageHeight / 2) / scale) * scale;

            // Calculate the direction vector towards the mouse
            const dx = scaledMouseX - x * scale;
            const dy = scaledMouseY - y * scale;

            // Normalize the direction vector
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 5) { // Threshold to prevent jittery movement
                const nx = dx / distance;
                const ny = dy / distance;

                // Move the circle in the direction of the mouse cursor with speed dependent on size
                const moveSpeed = 50 / radius;
                let newX = x + nx * moveSpeed;
                let newY = y + ny * moveSpeed;

                // Clamp x and y to be within the map before setting the position
                newX = Math.max(Math.min(newX, mapSize.width - radius), radius);
                newY = Math.max(Math.min(newY, mapSize.height - radius), radius);

                // Set the position of the graphics object directly for smoother movement
                graphics.position.set(newX, newY);
                setX(newX);
                setY(newY);
            }
        }

        if (mapContainer.current) {
            // Calculate the scale based on the player's size and stage size
            const scale = Math.min(stageHeight / (radius * 4), 1);
            mapContainer.current.scale.set(scale, scale);

            // Move the map container in the opposite direction to simulate camera movement
            mapContainer.current.position.set(
                -(x * scale - stageWidth / 2),
                -(y * scale - stageHeight / 2)
            );
        }

        // Dot eating and score update
        for (let i = dots.current.length - 1; i >= 0; i--) {
            const dot = dots.current[i];
            const dx = x - dot.x;
            const dy = y - dot.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < radius + dot.radius) {
                // eat the dot
                dots.current.splice(i, 1);

                // grow the circle and update score
                setRadius(radius => radius + 1);
                setScore(score => score + 1);

                // spawn a new dot in a random location
                const newX = Math.random() * mapSize.width;
                const newY = Math.random() * mapSize.height;
                const newDot = { x: newX, y: newY, radius: 5 };
                dots.current.push(newDot);
            }
        }

        if (scoreRef.current) {
            scoreRef.current.text = `Score: ${score}`;
        }
    });

    return (
        <Container>
            <Text ref={scoreRef} text={`Score: ${score}`} x={10} y={10} style={{ fontSize: '24px', fill: 'white' }} />
            <Container ref={mapContainer}>
                <Graphics ref={mapGraphics} />
                {dots.current.map((dot, index) => (
                    <Graphics
                        key={index}
                        draw={g => {
                            g.clear();
                            g.beginFill(0x00ff00);
                            g.drawCircle(0, 0, dot.radius);
                            g.endFill();
                        }}
                        x={dot.x}
                        y={dot.y}
                    />
                ))}
                <Graphics ref={circle} x={x} y={y} />
            </Container>
        </Container>
    );
};

export const OrbKingdom = () => {
    const wrapperRef = useRef(null);
    const [wrapperDimensions, setWrapperDimensions] = useState({ width: 0, height: 0 });

    // Get dimensions of the wrapping div
    useEffect(() => {
        if (wrapperRef.current) {
            const { width, height } = wrapperRef.current.getBoundingClientRect();
            setWrapperDimensions({ width, height });
        }
    }, []);

    const { width, height } = wrapperDimensions;

    return (
        <Grid container spacing={contentMargin} justifyContent="center" style={{ height: '100%' }}>
            <FloatingCard
                type="translucentSecondary"
                size="large"
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
                <Typography variant="h1" style={{ marginBottom: '20px' }}>Orb Kingdom</Typography>
                <div ref={wrapperRef} style={{ flex: 1, width: '100%', position: 'relative' }}>
                    <Stage
                        options={{
                            resolution: window.devicePixelRatio,
                            antialias: true
                        }}
                        width={width}
                        height={height}
                        style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                    >
                        {width > 0 && height > 0 && (
                            <OrbKingdomGame stageWidth={width} stageHeight={height} />
                        )}
                    </Stage>
                </div>
            </FloatingCard>
        </Grid>
    );
};

export default OrbKingdom;
