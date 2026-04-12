import myClock from '../myClock.js';
import timersPromises from 'timers/promises';
import NPC from './NPC.js';
import Xy from '../deliveroo/Xy.js';
import { config } from '../config/config.js';

/** @typedef {import('@unitn-asa/deliveroo-js-sdk/types/IOGameOptions.js').IONpcsOptions} IONpcsOptions */

const actions = ['up', 'right', 'down', 'left'];
const relPos = [{ x: 0, y: 1 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: -1, y: 0 }];

/**
 * Intelligent NPC that collects and delivers parcels using pathfinding
 * @extends { NPC }
 */
class IntelligentParcelNPC extends NPC {

    /**
     * @param {IONpcsOptions} options
     */
    constructor(options) {
        super();
        // console.log('[IntelligentParcelNPC] Constructor called with options:', options);

        /** @type {IONpcsOptions} */
        this.options = options || {
            type: 'intelligent',
            moving_event: 'frame',
            count: 1
        };

        /** @type {Array<{x: number, y: number}>} Current path to target */
        this.currentPath = [];

        /** @type {{x: number, y: number} | null} Current target position */
        this.currentTarget = null;

        /** @type {Map<string, number>} Tile costs for pathfinding */
        this.tileCosts = new Map();

        /** @type {Set<string>} Visited tiles for exploration */
        this.visitedTiles = new Set();

        /** @type {number} NPC capacity (default to infinite) */
        this.capacity = config?.GAME?.player?.capacity || -1;
    }

    /**
     * Main execution loop
     * @returns {Promise}
     */
    async execute() {
        // console.log('[IntelligentParcelNPC] execute() called for agent', this.agent?.id || 'unknown');
        // Initialize by sensing delivery tiles
        this.senseDeliveryTiles();

        while (!this.stopRequested) {
            try {
                await this.makeDecision();
                // Wait before next action
                await new Promise(res => myClock.once(this.options.moving_event, res));
            } catch (e) {
                console.error('[IntelligentParcelNPC] Error in execute loop:', e);
                // Handle any errors and continue
                await timersPromises.setImmediate();
            }
        }
    }

    /**
     * Sense and cache delivery tile locations
     */
    senseDeliveryTiles() {
        if (!this.agent?.grid) return;

        this.deliveryTiles = [];
        for (let tile of this.agent.grid.tileRegistry.getIterator()) {
            if (tile.delivery) {
                this.deliveryTiles.push({ x: tile.x, y: tile.y });
            }
        }
    }

    /**
     * Main decision-making logic with score-based optimization
     */
    async makeDecision() {
        const agent = this.agent;
        if (!agent) {
            // console.log('[IntelligentParcelNPC] No agent available');
            return;
        }

        // Mark current tile as visited
        const currentPos = `${agent.x},${agent.y}`;
        this.visitedTiles.add(currentPos);

        // If we're in the middle of following a path, continue
        if (this.currentPath.length > 0) {
            // console.log(`[IntelligentParcelNPC] ${agent.id || 'NPC'}: Continuing path, ${this.currentPath.length} steps remaining, at (${agent.x}, ${agent.y})`);
            await this.continueMoving();
            return;
        }

        // Check if we need to deliver parcels
        const carryingCount = agent.carryingParcels ? Array.from(agent.carryingParcels).length : 0;
        if (carryingCount > 0) {
            // -1 means infinite capacity
            const hasCapacity = this.capacity === -1 || carryingCount < this.capacity;

            // If at capacity, go deliver
            if (!hasCapacity) {
                // console.log(`[IntelligentParcelNPC] ${agent.id || 'NPC'}: At capacity (${carryingCount}), going to deliver`);
                await this.deliverParcels();
                return;
            }

            // Score-based decision: deliver or collect more?
            const shouldDeliver = this.shouldDeliverNow();
            // console.log(`[IntelligentParcelNPC] ${agent.id || 'NPC'}: Carrying ${carryingCount} parcels, shouldDeliver=${shouldDeliver}`);

            if (shouldDeliver) {
                // console.log(`[IntelligentParcelNPC] ${agent.id || 'NPC'}: Decided to deliver`);
                await this.deliverParcels();
                return;
            }
        }

        // Look for parcels to collect
        // console.log(`[IntelligentParcelNPC] ${agent.id || 'NPC'}: Looking for parcels to collect at (${agent.x}, ${agent.y})`);
        await this.collectParcels();
    }

    /**
     * Continue moving along the current path
     */
    async continueMoving() {
        const agent = this.agent;

        if (this.currentPath.length === 0) {
            // Reached destination, try to perform action
            // console.log(`[IntelligentParcelNPC] ${agent.id || 'NPC'}: Path complete, trying action at destination`);
            await this.tryPerformActionAtDestination();
            return;
        }

        const nextStep = this.currentPath.shift();
        const dx = nextStep.x - agent.x;
        const dy = nextStep.y - agent.y;

        // console.log(`[IntelligentParcelNPC] ${agent.id || 'NPC'}: Moving from (${agent.x}, ${agent.y}) to (${nextStep.x}, ${nextStep.y}), dx=${dx}, dy=${dy}`);

        // Find the action that moves us in the right direction
        for (let i = 0; i < 4; i++) {
            if (relPos[i].x === dx && relPos[i].y === dy) {
                const moved = await agent.controller[actions[i]]();
                // console.log(`[IntelligentParcelNPC] ${agent.id || 'NPC'}: Move ${actions[i]} returned ${moved}`);
                if (!moved) {
                    // Path blocked, recalculate
                    // console.log(`[IntelligentParcelNPC] ${agent.id || 'NPC'}: Move failed, resetting path`);
                    this.currentPath = [];
                    this.currentTarget = null;
                }
                return;
            }
        }

        // Couldn't find matching action, reset path
        // console.log(`[IntelligentParcelNPC] ${agent.id || 'NPC'}: No matching action found for dx=${dx}, dy=${dy}`);
        this.currentPath = [];
        this.currentTarget = null;
    }

    /**
     * Try to perform action (pickup/deliver) at the destination
     */
    async tryPerformActionAtDestination() {
        const agent = this.agent;

        // Check if we're at the target
        if (this.currentTarget && agent.x === this.currentTarget.x && agent.y === this.currentTarget.y) {
            // Try to pick up or deliver
            const currentTile = agent.grid.tileRegistry.getOneByXy({ x: agent.x, y: agent.y });

            // If on delivery tile and carrying parcels, deliver
            if (currentTile && currentTile.delivery && agent.carryingParcels.size > 0) {
                await agent.controller.putDown();
                this.currentTarget = null;
                return;
            }

            // Try to pick up parcels
            if (currentTile && agent.grid.parcelRegistry.getByXy(currentTile.xy).length > 0) {
                await agent.controller.pickUp();
                this.currentTarget = null;
                return;
            }
        }

        // Reset target
        this.currentTarget = null;
    }

    /**
     * Set up path to target position
     * @param {number} targetX
     * @param {number} targetY
     */
    setupPathTo(targetX, targetY) {
        const agent = this.agent;

        // Recalculate path if target changed
        if (!this.currentTarget || this.currentTarget.x !== targetX || this.currentTarget.y !== targetY) {
            // console.log(`[IntelligentParcelNPC] ${agent.id || 'NPC'}: Setting up path from (${agent.x}, ${agent.y}) to (${targetX}, ${targetY})`);
            this.currentTarget = { x: targetX, y: targetY };
            this.currentPath = this.findPath(agent.x, agent.y, targetX, targetY);
            // console.log(`[IntelligentParcelNPC] ${agent.id || 'NPC'}: Path computed with ${this.currentPath.length} steps`);
        }
    }

    /**
     * Decide whether to deliver parcels now or collect more
     * Uses score-based decision making considering:
     * - Total value of carried parcels
     * - Distance to nearest delivery
     * - Value and distance of nearby available parcels
     * @returns {boolean}
     */
    shouldDeliverNow() {
        const agent = this.agent;

        // Calculate total value of carried parcels
        let carriedValue = 0;
        const carryingArray = Array.from(agent.carryingParcels || []);
        for (let parcel of carryingArray) {
            carriedValue += parcel.reward;
        }

        // Find nearest delivery
        const nearestDelivery = this.findNearestDelivery();
        if (!nearestDelivery) return false;

        const distToDelivery = Xy.distance({ x: agent.x, y: agent.y }, nearestDelivery);

        // Find nearest valuable parcel (only consider reasonably close ones)
        const nearestParcel = this.findNearestParcel();
        // console.log(`[IntelligentParcelNPC] ${agent.id || 'NPC'}: shouldDeliverNow - carriedValue=${carriedValue}, nearestParcel=${nearestParcel ? '(' + nearestParcel.x + ',' + nearestParcel.y + ')' : 'null'}`);

        if (!nearestParcel) {
            // No parcels available, go deliver
            // console.log(`[IntelligentParcelNPC] ${agent.id || 'NPC'}: No parcels available, deciding to deliver`);
            return true;
        }

        const distToParcel = Xy.distance({ x: agent.x, y: agent.y }, nearestParcel);

        // Decision factors:
        // 1. If carrying high value, prioritize delivery
        // 2. If delivery is very close, prioritize delivery
        // 3. If high-value parcel is very close, prioritize collection

        const totalTripToDelivery = distToDelivery;
        const totalTripWithParcel = distToParcel + Xy.distance(nearestParcel, nearestDelivery);

        // Also consider absolute values - don't travel too far for low-value parcels
        const MIN_VALUE_THRESHOLD = 10;
        const MAX_DIST_RATIO = 2.5;

        // If carrying ANY value and parcel is too far or low value, deliver
        if (carriedValue > 0 && distToDelivery <= distToParcel) {
            // console.log(`[IntelligentParcelNPC] ${agent.id || 'NPC'}: Delivery closer than parcel, deciding to deliver`);
            return true;
        }

        // If carried value is high enough, deliver
        if (carriedValue >= MIN_VALUE_THRESHOLD && distToDelivery < distToParcel) {
            // console.log(`[IntelligentParcelNPC] ${agent.id || 'NPC'}: High value (${carriedValue}) and delivery closer, deciding to deliver`);
            return true;
        }

        // If parcel is too far compared to delivery
        if (totalTripWithParcel > totalTripToDelivery * MAX_DIST_RATIO) {
            // console.log(`[IntelligentParcelNPC] ${agent.id || 'NPC'}: Parcel too far (${totalTripWithParcel} vs ${totalTripToDelivery}), deciding to deliver`);
            return true;
        }

        // If the parcel is not valuable enough to justify the detour
        if (nearestParcel.reward < MIN_VALUE_THRESHOLD && carriedValue > 0) {
            // console.log(`[IntelligentParcelNPC] ${agent.id || 'NPC'}: Low value parcel (${nearestParcel.reward}), deciding to deliver`);
            return true;
        }

        // console.log(`[IntelligentParcelNPC] ${agent.id || 'NPC'}: Deciding to collect more (value=${nearestParcel.reward}, dist=${distToParcel})`);
        // Otherwise, collect more
        return false;
    }

    /**
     * Check if there are any available parcels on the grid
     * @returns {boolean}
     */
    hasVisibleParcels() {
        if (!this.agent?.grid) return false;
        for (let p of this.agent.grid.parcelRegistry.getIterator()) {
            if (!p.carriedBy) return true;
        }
        return false;
    }

    /**
     * Navigate to collect parcels
     */
    async collectParcels() {
        const agent = this.agent;

        // Pick up any parcels on current tile
        const currentTile = agent.grid.tileRegistry.getOneByXy({ x: agent.x, y: agent.y });
        if (currentTile && agent.grid.parcelRegistry.getByXy(currentTile.xy).length > 0) {
            // console.log(`[IntelligentParcelNPC] ${agent.id || 'NPC'}: Picking up parcel on current tile`);
            await agent.controller.pickUp();
            return;
        }

        // Find nearest parcel
        const nearestParcel = this.findNearestParcel();
        if (nearestParcel) {
            // console.log(`[IntelligentParcelNPC] ${agent.id || 'NPC'}: Found parcel at (${nearestParcel.x}, ${nearestParcel.y}), setting up path`);
            this.setupPathTo(nearestParcel.x, nearestParcel.y);
            return;
        }

        // No parcels visible, explore
        // console.log(`[IntelligentParcelNPC] ${agent.id || 'NPC'}: No parcels found, exploring`);
        await this.explore();
    }

    /**
     * Navigate to delivery station
     */
    async deliverParcels() {
        const agent = this.agent;
        const currentTile = agent.grid.tileRegistry.getOneByXy({ x: agent.x, y: agent.y });

        // If on delivery tile, deliver
        if (currentTile && currentTile.delivery) {
            await agent.controller.putDown();
            this.currentPath = [];
            this.currentTarget = null;
            return;
        }

        // Find nearest delivery tile
        const nearestDelivery = this.findNearestDelivery();
        if (nearestDelivery) {
            this.setupPathTo(nearestDelivery.x, nearestDelivery.y);
        }
    }

    /**
     * Find nearest parcel on the grid using Manhattan distance
     * @returns {{x: number, y: number, reward: number} | null}
     */
    findNearestParcel() {
        if (!this.agent?.grid) return null;

        let nearest = null;
        let minDist = Infinity;
        const myPos = { x: this.agent.x, y: this.agent.y };

        for (let parcel of this.agent.grid.parcelRegistry.getIterator()) {
            if (!parcel.carriedBy) {
                const dist = Xy.distance(myPos, { x: parcel.x, y: parcel.y });
                // Prioritize higher reward parcels with slight weight
                const weightedDist = dist - (parcel.reward * 0.1);
                if (weightedDist < minDist) {
                    minDist = weightedDist;
                    nearest = { x: parcel.x, y: parcel.y, reward: parcel.reward };
                }
            }
        }

        return nearest;
    }

    /**
     * Find nearest delivery tile
     * @returns {{x: number, y: number} | null}
     */
    findNearestDelivery() {
        if (!this.deliveryTiles || this.deliveryTiles.length === 0) {
            this.senseDeliveryTiles();
        }

        if (!this.deliveryTiles || this.deliveryTiles.length === 0) return null;

        let nearest = null;
        let minDist = Infinity;
        const myPos = { x: this.agent.x, y: this.agent.y };

        for (let tile of this.deliveryTiles) {
            const dist = Xy.distance(myPos, tile);
            if (dist < minDist) {
                minDist = dist;
                nearest = tile;
            }
        }

        return nearest;
    }

    /**
     * Find path using A* pathfinding
     * @param {number} startX
     * @param {number} startY
     * @param {number} targetX
     * @param {number} targetY
     * @returns {Array<{x: number, y: number}>}
     */
    findPath(startX, startY, targetX, targetY) {
        const agent = this.agent;
        const grid = agent.grid;

        // Simple BFS for now (can be upgraded to A*)
        /** @type {Array<{pos: {x: number, y: number}, path: Array<{x: number, y: number}>}>} */
        const queue = [{ pos: { x: startX, y: startY }, path: [] }];
        /** @type {Set<string>} */
        const visited = new Set();
        visited.add(`${startX},${startY}`);

        while (queue.length > 0) {
            const current = queue.shift();

            // Reached target
            if (current.pos.x === targetX && current.pos.y === targetY) {
                return current.path;
            }

            // Explore neighbors
            for (let i = 0; i < 4; i++) {
                const newX = current.pos.x + relPos[i].x;
                const newY = current.pos.y + relPos[i].y;
                const key = `${newX},${newY}`;

                if (visited.has(key)) continue;

                const tile = grid.tileRegistry.getOneByXy({ x: newX, y: newY });
                if (!tile || !tile.walkable) continue;

                // Check if current tile allows exit in this direction
                const currentTile = grid.tileRegistry.getOneByXy(current.pos);
                if (!currentTile.allowsExitInDirection(relPos[i].x, relPos[i].y)) continue;

                // Check if new tile allows movement from current position
                if (!tile.allowsMovementFrom(current.pos.x, current.pos.y)) continue;

                visited.add(key);
                const newPath = [...current.path, { x: newX, y: newY }];
                queue.push({ pos: { x: newX, y: newY }, path: newPath });
            }
        }

        // No path found
        return [];
    }

    /**
     * Explore the map when no parcels are visible
     */
    async explore() {
        const agent = this.agent;

        // Find nearest unvisited tile
        let nearestUnvisited = null;
        let minDist = Infinity;
        const myPos = { x: agent.x, y: agent.y };

        for (let tile of agent.grid.tileRegistry.getIterator()) {
            if (tile.walkable && !this.visitedTiles.has(`${tile.x},${tile.y}`)) {
                const dist = Xy.distance(myPos, { x: tile.x, y: tile.y });
                if (dist < minDist) {
                    minDist = dist;
                    nearestUnvisited = { x: tile.x, y: tile.y };
                }
            }
        }

        if (nearestUnvisited) {
            this.setupPathTo(nearestUnvisited.x, nearestUnvisited.y);
        } else {
            // All tiles visited, reset and start over
            this.visitedTiles.clear();
            // Make a random move
            const index = Math.floor(Math.random() * 4);
            await agent.controller[actions[index]]();
        }
    }
}

export default IntelligentParcelNPC;
