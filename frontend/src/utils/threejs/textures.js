import * as THREE from 'three';

/**
 * Create a canvas texture with hazard stripes for directional tiles
 * @param {string} direction - The direction symbol
 * @returns {THREE.CanvasTexture}
 */
export function createDirectionalTexture(direction) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Constants
    const size = 128;
    const stripeWidth = 40;
    const borderWidth = size / 2;

    // Draw background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 128, 128);

    // Save context and apply clipping
    ctx.save();
    ctx.beginPath();
    // Determine clip region based on direction
    ctx.rect(
        ['→'].includes(direction) ? size - borderWidth : 0,
        ['↓'].includes(direction) ? size - borderWidth : 0,
        ['←','→'].includes(direction) ? borderWidth : size,
        ['↑','↓'].includes(direction) ? borderWidth : size
    );
    ctx.clip();

    // Draw alternating concentric 45° rotated squares
    ctx.save();
    // Move origin to center
    ctx.translate(size / 2, size / 2);
    // Rotate canvas by 45 degrees
    ctx.rotate(Math.PI / 4);
    // Draw concentric squares
    for (let i = size * 1.55; i > size / 4; i -= stripeWidth) {
        ctx.fillStyle = Math.floor(i / stripeWidth) % 2 === 0 ? '#ffffff' : '#0000ff';
        const half = i / 2;
        ctx.fillRect( -half, -half, i, i );
    }
    // Restore after drawing squares
    ctx.restore();

    return new THREE.CanvasTexture(canvas);
}

/**
 * Create a canvas texture for crate spawner tiles
 * @returns {THREE.CanvasTexture}
 */
export function createCrateSpawnerTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;

    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffff00';
    ctx.fillRect(0, 0, 128, 128);

    ctx.fillStyle = 'black';
    ctx.font = 'bold 80px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('C', 64, 64);

    return new THREE.CanvasTexture(canvas);
}

/**
 * Get or create static tile textures (cached globally)
 * @returns {{ crateSpawner: THREE.CanvasTexture, dir_↑: THREE.CanvasTexture, dir_→: THREE.CanvasTexture, dir_↓: THREE.CanvasTexture, dir_←: THREE.CanvasTexture }}
 */
export function getTileTextures() {
    /** @type {any} */ (globalThis).__tileTextures ??= {
        crateSpawner: createCrateSpawnerTexture(),
        'dir_↑': createDirectionalTexture('↑'),
        'dir_→': createDirectionalTexture('→'),
        'dir_↓': createDirectionalTexture('↓'),
        'dir_←': createDirectionalTexture('←')
    };
    return /** @type {any} */ (globalThis).__tileTextures;
}
