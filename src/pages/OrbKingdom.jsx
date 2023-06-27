import React, { useState, useEffect, useRef } from "react";
import { Grid, Typography } from "@mui/material";
import { Stage, Container, Graphics, useTick, useApp } from '@pixi/react';
import FloatingCard from "../components/FloatingCard";
import { contentMargin } from "../Theme";

const OrbKingdomGame = ({ stageWidth, stageHeight }) => {
    const circle = useRef(null);
    const mapGraphics = useRef(null);
    const mapContainer = useRef(null);

    const mapSize = { width: 2000, height: 2000 };
    const cellSize = 50;

    const [x, setX] = useState(stageWidth / 2);
    const [y, setY] = useState(stageHeight / 2);
    const [radius, setRadius] = useState(30);

    useTick(() => {
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

        if (circle.current) {
            const graphics = circle.current;
            graphics.clear();
            graphics.lineStyle(2, 0x333333, 1);
            graphics.beginFill(0xff0000);
            graphics.drawCircle(stageWidth / 2, stageHeight / 2, radius);
            graphics.endFill();
        }

        if (mapContainer.current) {
            // Clamp x and y to be within the map
            const clampedX = Math.max(Math.min(x, mapSize.width - radius), radius);
            const clampedY = Math.max(Math.min(y, mapSize.height - radius), radius);

            // Scale the map container based on the circle's radius
            const scale = 30 / radius;
            mapContainer.current.scale.set(scale, scale);

            // Set the position of the map container
            mapContainer.current.position.set(clampedX - stageWidth / 2, clampedY - stageHeight / 2);
        }
    });

    useEffect(() => {
        const handleKeyDown = (e) => {
            const moveSpeed = 5;
            const growthSpeed = 2;
            if (e.key === 'w' || e.key === 'ArrowUp') setY(y => y + moveSpeed);
            if (e.key === 's' || e.key === 'ArrowDown') setY(y => y - moveSpeed);
            if (e.key === 'a' || e.key === 'ArrowLeft') setX(x => x + moveSpeed);
            if (e.key === 'd' || e.key === 'ArrowRight') setX(x => x - moveSpeed);
            if (e.key === 'e') setRadius(r => Math.min(r + growthSpeed, 100));
            if (e.key === 'q') setRadius(r => Math.max(r - growthSpeed, 10));
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <Container>
            <Container ref={mapContainer}>
                <Graphics ref={mapGraphics} />
            </Container>
            <Graphics ref={circle} />
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
                {/* Adding a ledger below the stage */}
                <Typography variant="body1" style={{ marginTop: '20px' }}>
                    <strong>Controls:</strong>
                </Typography>
                <Typography variant="body2">Move: Arrows or WASDA</Typography>
                <Typography variant="body2">Increase Circle Size: E </Typography>
                <Typography variant="body2">Decrease Circle Size: Q</Typography>
            </FloatingCard>
        </Grid>
    );
};

export default OrbKingdom;
