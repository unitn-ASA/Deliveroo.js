import Xy from '../core/Xy.js';
import { mapRowsToColumns } from '@unitn-asa/deliveroo-js-sdk/types/mapRows.js';
import { parseIOTileType } from '@unitn-asa/deliveroo-js-sdk/types/IOTile.js';

/**
 * @typedef {import('../core/Grid.js').default} Grid
 */

/**
 * MapLoadingSystem handles map loading and tile management.
 * Stateless utility: the target Grid is passed to each call.
 */
class MapLoadingSystem {

    /**
     * Load a new map
     * @param {Grid} grid - The grid to load the map into
     * @param {string[]} tiles - Fixed-width rows stored top-to-bottom
     * @returns {{success: boolean, error?: string}}
     */
    loadMap(grid, tiles) {
        if (!Array.isArray(tiles)) {
            return {
                success: false,
                error: 'Invalid tiles format: expected array'
            };
        }

        // Clear all crates from the map before loading new map
        for (const crate of grid.crateRegistry.getIterator()) {
            crate.delete();
        }

        // Clear all parcels from the map before loading new map
        for (const parcel of grid.parcelRegistry.getIterator()) {
            parcel.delete();
        }

        // Process tiles
        this.#processTiles(grid, tiles);

        return {
            success: true
        };
    }

    /**
     * Calculate map dimensions from tile array
     * @param {string[]} tiles
     * @returns {Xy} - Maximum x and y coordinates of the map
     */
    #calculateMaxXy(tiles) {
        const yLength = tiles.length;
        const xLength = Math.max(...tiles.map(row => Math.ceil(row.length / 2)));

        return new Xy({ x: xLength - 1, y: yLength - 1 }); // -1 for 0-based indexing
    }

    /**
     * Process all tiles in the map
     * @param {Grid} grid
     * @param {string[]} tiles
     */
    #processTiles(grid, tiles) {

        const { x: newX, y: newY } = this.#calculateMaxXy(tiles);
        const columns = mapRowsToColumns(tiles, newX + 1, newY + 1);

        // Calculate old dimensions
        const { x: oldX, y: oldY } = grid.tileRegistry.getMaxXy();

        // Iterate over the maximum area
        for (let x = 0; x <= Math.max(newX, oldX); x++) {
            for (let y = 0; y <= Math.max(newY, oldY); y++) {
                const xy = new Xy({ x, y });

                if (x <= newX && y <= newY) {
                    // Create/update tile
                    grid.setTile(xy, parseIOTileType(columns[x][y]));
                } else {
                    // Remove tile outside new dimensions
                    grid.tileRegistry.getOneByXy(xy)?.delete();
                }
            }
        }
    }

}

export default MapLoadingSystem;
