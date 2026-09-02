import Xy from '../deliveroo/Xy.js';

/**
 * @typedef {import('@unitn-asa/deliveroo-js-sdk/types/IOTile.js').IOTileType} IOTileType
 */

/**
 * @typedef {import('../deliveroo/Grid.js').default} Grid
 */

/**
 * MapLoadingSystem handles map loading and tile management.
 * Stateless utility: the target Grid is passed to each call.
 */
class MapLoadingSystem {

    /**
     * Load a new map
     * @param {Grid} grid - The grid to load the map into
     * @param {IOTileType[][]} tiles - 2D array of tile types
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
     * @param {Grid} grid
     * @param {IOTileType[][]} tiles
     */
    #processTiles(grid, tiles) {

        // Calculate old dimensions
        const { x: oldX, y: oldY } = grid.tileRegistry.getMaxXy();

        // Calculate new dimensions
        const { x: newX, y: newY } = this.#calculateMaxXy(tiles);

        // Iterate over the maximum area
        for (let x = 0; x <= Math.max(newX, oldX); x++) {
            for (let y = 0; y <= Math.max(newY, oldY); y++) {
                const xy = new Xy({ x, y });

                if (x <= newX && y <= newY) {
                    // Create/update tile
                    grid.setTile(xy, tiles[x][y]);
                } else {
                    // Remove tile outside new dimensions
                    grid.tileRegistry.getOneByXy(xy)?.delete();
                }
            }
        }
    }

}

export default MapLoadingSystem;
