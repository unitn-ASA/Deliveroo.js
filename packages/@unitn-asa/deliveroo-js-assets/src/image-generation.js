/**
 * Image generation module for game maps and layers
 * @module image-generation
 */

import { createCanvas } from 'canvas';
import GIFEncoder from 'gifencoder';
import { mapRowsToColumns } from '@unitn-asa/deliveroo-js-sdk/types/mapRows.js';

/** @type {number} Pixels per tile in generated images */
export const DOT_PER_TILE = 10;

/** @type {number} Padding around each tile */
export const PADDING = 1;

/**
 * Generate PNG from game tiles
 * @param {string[]} rows - Fixed-width map rows
 * @returns {Buffer} PNG buffer
 */
export function generatePng(rows) {
    const height = rows.length;
    const width = Math.max(...rows.map(row => Math.ceil(row.length / 2)));
    const matrix = mapRowsToColumns(rows, width, height);

    const canvas = createCanvas(width * DOT_PER_TILE, height * DOT_PER_TILE);
    const ctx = canvas.getContext('2d');

    // fill background
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#252f3dff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            let value = '0';
            try {
                value = (matrix[x][y]).toString();
            } catch (err) {
                console.error('image-generation.js generatePng() Error accessing matrix at', x, y, ':', err);
            }

            // Handle directional tiles (Unicode arrows)
            const directionalTiles = ['↑', '→', '↓', '←'];
            const isDirectional = directionalTiles.includes(String(value));

            // Default opacity
            ctx.globalAlpha = 1;
            if (isDirectional) {
                ctx.fillStyle = '#3b82f6';
                ctx.globalAlpha = 0.8;
            } else if (value == '0') {
                ctx.fillStyle = 'grey';
                ctx.globalAlpha = 0.1;
            } else if (value == '1') {
                ctx.fillStyle = 'green';
            } else if (value == '2') {
                ctx.fillStyle = 'red';
            } else if (value == '3') {
                ctx.fillStyle = 'lightgray';
            } else if (value == '5' || value == '5!') {
                ctx.fillStyle = 'yellow';
            } else {
                ctx.fillStyle = 'purple';
            }

            const _left = x * DOT_PER_TILE + PADDING;
            const _top = (height - 1 - y) * DOT_PER_TILE + PADDING;
            const _width = DOT_PER_TILE - 2 * PADDING;
            const _height = DOT_PER_TILE - 2 * PADDING;

            ctx.fillRect(_left, _top, _width, _height);

            // Draw arrow for directional tiles
            if (isDirectional) {
                ctx.fillStyle = 'black';
                ctx.font = '8px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(value, _left + _width / 2, _top + _height / 2);
            }

            // Draw 'C' for crate spawning tiles
            if (value.endsWith('!')) {
                ctx.fillStyle = 'black';
                ctx.font = '8px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('C', _left + _width / 2, _top + _height / 2);
            }
        }
    }

    return canvas.toBuffer("image/png");
}

/**
 * Generate observation area overlay (black outside, transparent inside)
 * @param {string[]} tiles - Fixed-width map rows
 * @param {number} observationDistance - Player observation distance
 * @returns {Buffer} PNG buffer
 */
export function generateObservationLayer(tiles, observationDistance) {
    const height = tiles.length;
    const width = Math.max(...tiles.map(row => Math.ceil(row.length / 2)));

    const canvas = createCanvas(width * DOT_PER_TILE, height * DOT_PER_TILE);
    const ctx = canvas.getContext('2d');

    // Start with full black overlay
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Clear observation area (make transparent)
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);

    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            const manhattanDistance = Math.abs(x - centerX) + Math.abs(y - centerY);

            if (manhattanDistance <= observationDistance) {
                // Make this tile transparent
                const _left = x * DOT_PER_TILE;
                const _top = (height - 1 - y) * DOT_PER_TILE;
                ctx.clearRect(_left, _top, DOT_PER_TILE, DOT_PER_TILE);
            }
        }
    }

    return canvas.toBuffer("image/png");
}

/**
 * Generate animated GIF showing NPC movement patterns
 * @param {string[]} tiles - Fixed-width map rows
 * @param {import("@unitn-asa/deliveroo-js-sdk/types/IOGameOptions.js").IONpcsOptions[]} npcs - NPC configurations
 * @param {number} movementDuration - Player movement duration in ms
 * @returns {Buffer} GIF buffer
 */
export function generateNpcAnimationGif(tiles, npcs, movementDuration) {
    const height = tiles.length;
    const width = Math.max(...tiles.map(row => Math.ceil(row.length / 2)));

    const canvas = createCanvas(width * DOT_PER_TILE, height * DOT_PER_TILE);
    const ctx = canvas.getContext('2d');

    const encoder = new GIFEncoder(canvas.width, canvas.height);
    encoder.start();
    encoder.setRepeat(0); // Loop infinitely
    encoder.setDelay(50); // 20fps = 50ms per frame
    encoder.setQuality(10); // Lower quality for smaller file size
    encoder.setTransparent(0x000000); // Make black transparent

    // Generate random NPC starting positions
    const npcPositions = [];
    let npcId = 0;

    for (const npcType of npcs) {
        for (let i = 0; i < npcType.count; i++) {
            const x = Math.floor(Math.random() * width);
            const y = Math.floor(Math.random() * height);
            const direction = Math.random() > 0.5 ? 'horizontal' : 'vertical';

            // Parse movement_event to get wait time
            let waitTime = 2000; // default
            if (npcType.moving_event && npcType.moving_event !== 'infinite') {
                if (npcType.moving_event === 'frame') {
                    waitTime = 0;
                } else {
                    const match = npcType.moving_event.match(/(\d+)\s*(s|ms)?/);
                    if (match) {
                        const value = parseInt(match[1]);
                        const unit = match[2] === 'ms' ? 1 : 1000;
                        waitTime = value * unit;
                    }
                }
            }

            npcPositions.push({
                id: npcId++,
                x: x,
                y: y,
                startX: x,
                startY: y,
                direction: direction,
                waitTime: waitTime,
                phase: 'moving', // 'moving' or 'waiting'
                phaseProgress: 0,
                moveTarget: 1 // 1 tile away from start
            });
        }
    }

    // Calculate total animation duration (one full cycle)
    const maxWaitTime = Math.max(...npcPositions.map(npc => npc.waitTime));
    const totalFrames = Math.ceil((maxWaitTime * 2 + movementDuration * 2) / 50);

    // Generate frames
    for (let frame = 0; frame < totalFrames; frame++) {
        // Clear canvas (transparent background)
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw each NPC
        for (const npc of npcPositions) {
            // Simple back-and-forth movement logic
            const cycleProgress = (frame * 50) % (npc.waitTime * 2 + movementDuration * 2);

            let displayX, displayY;

            if (cycleProgress < movementDuration) {
                // Moving to target
                const t = cycleProgress / movementDuration;
                if (npc.direction === 'horizontal') {
                    displayX = npc.startX + t * npc.moveTarget;
                    displayY = npc.startY;
                } else {
                    displayX = npc.startX;
                    displayY = npc.startY + t * npc.moveTarget;
                }
            } else if (cycleProgress < movementDuration + npc.waitTime) {
                // Waiting at target
                if (npc.direction === 'horizontal') {
                    displayX = npc.startX + npc.moveTarget;
                    displayY = npc.startY;
                } else {
                    displayX = npc.startX;
                    displayY = npc.startY + npc.moveTarget;
                }
            } else if (cycleProgress < movementDuration * 2 + npc.waitTime) {
                // Moving back
                const t = (cycleProgress - movementDuration - npc.waitTime) / movementDuration;
                if (npc.direction === 'horizontal') {
                    displayX = npc.startX + npc.moveTarget * (1 - t);
                    displayY = npc.startY;
                } else {
                    displayX = npc.startX;
                    displayY = npc.startY + npc.moveTarget * (1 - t);
                }
            } else {
                // Waiting at start
                displayX = npc.startX;
                displayY = npc.startY;
            }

            // Draw NPC as a circle
            const _left = displayX * DOT_PER_TILE + DOT_PER_TILE / 2;
            const _top = (height - 1 - displayY) * DOT_PER_TILE + DOT_PER_TILE / 2;
            const radius = DOT_PER_TILE / 3;

            ctx.beginPath();
            ctx.arc(_left, _top, radius, 0, Math.PI * 2);
            ctx.fillStyle = '#3b82f6';
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Add frame to GIF
        encoder.addFrame(ctx);
    }

    encoder.finish();
    return Buffer.from(encoder.out.getData());
}
