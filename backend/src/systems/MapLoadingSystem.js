import Xy from '../deliveroo/Xy.js';
import Grid from '../deliveroo/Grid.js';
import Tile from '../deliveroo/Tile.js';
import { parseIOTileType } from '@unitn-asa/deliveroo-js-sdk/types/IOTile.js';

/**
 * @typedef {import('@unitn-asa/deliveroo-js-sdk/types/IOTile.js').IOTileType} IOTileType
 */

/**
 * MapLoadingSystem handles map loading and tile management.
 */
class MapLoadingSystem {

    /** @type {Grid} */
    #grid;

    constructor(grid) {
        this.#grid = grid;
    }

    /**
     * Load a new map
     * @param {IOTileType[][]} tiles - 2D array of tile types
     * @returns {{success: boolean, error?: string}}
     */
    loadMap(tiles) {
        if (!Array.isArray(tiles)) {
            return {
                success: false,
                error: 'Invalid tiles format: expected array'
            };
        }

        // Clear all crates from the map before loading new map
        for (const crate of this.#grid.crateRegistry.getIterator()) {
            crate.delete();
        }
        
        // Process tiles
        this.#processTiles(tiles);

        return {
            success: true
        };
    }

    /**
     * Calculate map dimensions from tile array
     * @param {IOTileType[][]} tiles
     * @returns {Xy} - Maximum x and y coordinates of the map
     */
    #calculateMaxXy(tiles) {
        const xLength = tiles.length;
        const yLength = Array.from(tiles).reduce(
            (longest, current) => (current.length > longest.length ? current : longest)
        ).length;

        return new Xy({ x: xLength - 1, y: yLength - 1 }); // -1 for 0-based indexing
    }

    /**
     * Process all tiles in the map
     * @param {IOTileType[][]} tiles
     */
    #processTiles(tiles) {
        
        // Calculate old dimensions
        const { x: oldX, y: oldY } = this.#grid.tileRegistry.getMaxXy();
        
        // Calculate new dimensions
        const { x: newX, y: newY } = this.#calculateMaxXy(tiles);

        // Iterate over the maximum area
        for (let x = 0; x <= Math.max(newX, oldX); x++) {
            for (let y = 0; y <= Math.max(newY, oldY); y++) {
                const xy = new Xy({ x, y });

                if (x <= newX && y <= newY) {
                    // Create/update tile
                    this.#grid.setTile(xy, tiles[x][y]);
                } else {
                    // Remove tile outside new dimensions
                    this.#grid.tileRegistry.getOneByXy(xy)?.delete();
                }
            }
        }
    }

}

export default MapLoadingSystem;
