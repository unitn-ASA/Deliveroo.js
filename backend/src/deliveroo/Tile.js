import Xy from './Xy.js';
import Parcel from './Parcel.js';
import Grid from './Grid.js';
import eventEmitter from 'events';
import { watchProperty } from '../reactivity/watchProperty.js';
import { parseIOTileType } from '@unitn-asa/deliveroo-js-sdk/types/IOTile.js';

/** @typedef {import("@unitn-asa/deliveroo-js-sdk/types/IOTile.js").IOTile} IOTile */
/** @typedef {import("@unitn-asa/deliveroo-js-sdk/types/IOTile.js").IOTileType} IOTileType */



/**
 * @class Tile
 * @implements { IOTile }
 */
 class Tile {

    /**
     * @typedef {{type: [string], locked: [boolean]}} eventsMap
     * @type { eventEmitter<Record<keyof eventsMap, eventsMap[keyof eventsMap]>> }
    */
    #emitter = new eventEmitter();
    get emitter () { return this.#emitter; }

    /** @type {Xy} */
    #xy;

    /** @type {Xy} xy */
    get xy () {
        return this.#xy;
    }
    /** @type {number} */
    get x () { return this.xy.x }
    /** @type {number} */
    get y () { return this.xy.y }

    /** @type {IOTileType} */
    type;

    /** Directional tile movement vectors */
    static #directionVectors = {
        '↑': { dx: 0, dy: 1 },   // Up: moving from lower y to higher y
        '→': { dx: 1, dy: 0 },   // Right: moving from lower x to higher x
        '↓': { dx: 0, dy: -1 },  // Down: moving from higher y to lower y
        '←': { dx: -1, dy: 0 }   // Left: moving from higher x to lower x
    };

    /** @type {boolean} */
    get walkable () {
        return this.type != "0";
    }

    get delivery () {
        return this.type == "2";
    }

    get parcelSpawner () {
        return this.type == "1";
    }

    /**
     * Check if this tile is a directional tile
     * @returns {boolean}
     */
    get isDirectional () {
        return Tile.#directionVectors.hasOwnProperty(this.type);
    }

    /** @type {boolean} */
    locked;

    lock() {
        this.locked = true;
    }

    unlock() {
        this.locked = false;
    }

    /**
     * Check if movement from given coordinates to this tile is allowed
     * @param {number} fromX - Source X coordinate
     * @param {number} fromY - Source Y coordinate
     * @returns {boolean} - True if movement is allowed
     */
    allowsMovementFrom (fromX, fromY) {

        if (!this.isDirectional) {
            // Not a directional tile, allows all movement
            return true;
        }

        // Calculate direction of movement
        const dx = this.x - fromX;
        const dy = this.y - fromY;

        // Check if movement is opposite to tile's direction
        const prohibitedDirection = Tile.#directionVectors[this.type];
        return dx != -prohibitedDirection.dx || dy != -prohibitedDirection.dy;

        // // Check if movement matches the tile's direction
        // const allowedDirection = Tile.#directionVectors[this.type];
        // return dx === allowedDirection.dx && dy === allowedDirection.dy;
    }

    /**
     * Check if movement from this tile in the given direction is allowed
     * @param {number} incr_x - X increment (-1, 0, or 1)
     * @param {number} incr_y - Y increment (-1, 0, or 1)
     * @returns {boolean} - True if exit in this direction is allowed
     */
    allowsExitInDirection (incr_x, incr_y) {

        // Always allow exit in any direction
        return true;

        if (!this.isDirectional) {
            // Not a directional tile, allows all exits
            return true;
        }

        // Check if exit direction matches the tile's direction
        const allowedDirection = Tile.#directionVectors[this.type];
        return incr_x === allowedDirection.dx && incr_y === allowedDirection.dy;
    }

    // /** @type {Set<Parcel>} parcel */
    // #parcels = new Set();

    /**
     * @constructor Tile
     * @param {Xy} xy
     * @param {IOTileType} type
     */
    constructor ( xy, type = '1' ) {

        this.#emitter.setMaxListeners(0); // unlimited listeners

        this.#xy = xy;

        watchProperty({
            target: this,
            key: 'type',
            callback: (target, key, value) => target.#emitter.emit(key, value)
        });
        this.type = parseIOTileType(type); // Ensure type is always a string

        watchProperty({
            target: this,
            key: 'locked',
            callback: (target, key, value) => target.#emitter.emit(key, value)
        });
        this.locked = false;

    }

}



export default Tile;
