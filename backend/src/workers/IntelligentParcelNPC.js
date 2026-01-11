import myClock from '../myClock.js';
import timersPromises from 'timers/promises';
import NPC from './NPC.js';
import Xy from '../deliveroo/Xy.js';

/** @typedef {import('@unitn-asa/deliveroo-js-sdk/src/config/IOGameOptions.js').IONpcsOptions} IONpcsOptions */

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

        /** @type {IONpcsOptions} */
        this.options = options || {
            type: 'intelligent',
            moving_event: 'frame',
            count: 1,
            capacity: 5
        };

        /** @type {Array<{x: number, y: number}>} Current path to target */
        this.currentPath = [];

        /** @type {{x: number, y: number} | null} Current target position */
        this.currentTarget = null;

        /** @type {Map<string, number>} Tile costs for pathfinding */
        this.tileCosts = new Map();

        /** @type {Set<string>} Visited tiles for exploration */
        this.visitedTiles = new Set();
    }

    /**
     * Main execution loop
     * @returns {Promise}
     */
    async execute() {
        // Initialize by sensing delivery tiles
        this.senseDeliveryTiles();

        while (!this.stopRequested) {
            try {
                await this.makeDecision();
                // Wait before next action
                await new Promise(res => myClock.once(this.options.moving_event, res));
            } catch (e) {
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
        for (let tile of this.agent.grid.getTiles()) {
            if (tile.delivery) {
                this.deliveryTiles.push({ x: tile.x, y: tile.y });
            }
        }
    }

    /**
     * Main decision-making logic
     */
    async makeDecision() {
        const agent = this.agent;
        if (!agent) return;

        // Mark current tile as visited
        const currentPos = `${agent.x},${agent.y}`;
        this.visitedTiles.add(currentPos);

        // Check if we need to deliver parcels
        if (agent.carryingParcels && agent.carryingParcels.size > 0) {
            const hasCapacity = agent.carryingParcels.size < this.options.capacity;

            // If at capacity or no parcels in sight, go deliver
            if (!hasCapacity || !this.hasVisibleParcels()) {
                await this.deliverParcels();
                return;
            }
        }

        // Look for parcels to collect
        await this.collectParcels();
    }

    /**
     * Check if there are any visible parcels
     * @returns {boolean}
     */
    hasVisibleParcels() {
        if (!this.agent?.sensor?.sensedParcels) return false;
        return this.agent.sensor.sensedParcels.some(s => s.parcel && !s.parcel.carriedBy);
    }

    /**
     * Navigate to collect parcels
     */
    async collectParcels() {
        const agent = this.agent;

        // Pick up any parcels on current tile
        const currentTile = agent.grid.getTile({ x: agent.x, y: agent.y });
        if (currentTile && agent.grid.getParcelsAt(currentTile.xy).length > 0) {
            await agent.pickUp();
            return;
        }

        // Find nearest parcel
        const nearestParcel = this.findNearestParcel();
        if (nearestParcel) {
            await this.moveToTarget(nearestParcel.x, nearestParcel.y);
            // Try to pick up after moving
            await agent.pickUp();
            return;
        }

        // No parcels visible, explore
        await this.explore();
    }

    /**
     * Navigate to delivery station
     */
    async deliverParcels() {
        const agent = this.agent;
        const currentTile = agent.grid.getTile({ x: agent.x, y: agent.y });

        // If on delivery tile, deliver
        if (currentTile && currentTile.delivery) {
            await agent.putDown();
            this.currentPath = [];
            this.currentTarget = null;
            return;
        }

        // Find nearest delivery tile
        const nearestDelivery = this.findNearestDelivery();
        if (nearestDelivery) {
            await this.moveToTarget(nearestDelivery.x, nearestDelivery.y);
            // Try to deliver after moving
            await agent.putDown();
        }
    }

    /**
     * Find nearest parcel using Manhattan distance
     * @returns {{x: number, y: number, reward: number} | null}
     */
    findNearestParcel() {
        if (!this.agent?.sensor?.sensedParcels) return null;

        let nearest = null;
        let minDist = Infinity;
        const myPos = { x: this.agent.x, y: this.agent.y };

        for (let sensed of this.agent.sensor.sensedParcels) {
            if (sensed.parcel && !sensed.parcel.carriedBy) {
                const dist = Xy.distance(myPos, { x: sensed.x, y: sensed.y });
                // Prioritize higher reward parcels with slight weight
                const weightedDist = dist - (sensed.parcel.reward * 0.1);
                if (weightedDist < minDist) {
                    minDist = weightedDist;
                    nearest = { x: sensed.x, y: sensed.y, reward: sensed.parcel.reward };
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
     * Move towards target using pathfinding
     * @param {number} targetX
     * @param {number} targetY
     */
    async moveToTarget(targetX, targetY) {
        const agent = this.agent;
        const targetKey = `${targetX},${targetY}`;

        // Recalculate path if target changed or no path
        if (!this.currentTarget || this.currentTarget.x !== targetX || this.currentTarget.y !== targetY || this.currentPath.length === 0) {
            this.currentTarget = { x: targetX, y: targetY };
            this.currentPath = this.findPath(agent.x, agent.y, targetX, targetY);
        }

        // Follow the path
        if (this.currentPath.length > 0) {
            const nextStep = this.currentPath.shift();
            const dx = nextStep.x - agent.x;
            const dy = nextStep.y - agent.y;

            // Find the action that moves us in the right direction
            for (let i = 0; i < 4; i++) {
                if (relPos[i].x === dx && relPos[i].y === dy) {
                    const moved = await agent[actions[i]]();
                    if (!moved) {
                        // Path blocked, recalculate
                        this.currentPath = [];
                    }
                    return;
                }
            }
        }
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

                const tile = grid.getTile({ x: newX, y: newY });
                if (!tile || !tile.walkable) continue;

                // Check if current tile allows exit in this direction
                const currentTile = grid.getTile(current.pos);
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

        // If we have a path, follow it
        if (this.currentPath.length > 0) {
            const nextStep = this.currentPath.shift();
            const dx = nextStep.x - agent.x;
            const dy = nextStep.y - agent.y;

            for (let i = 0; i < 4; i++) {
                if (relPos[i].x === dx && relPos[i].y === dy) {
                    const moved = await agent[actions[i]]();
                    if (!moved) {
                        this.currentPath = [];
                    }
                    return;
                }
            }
        }

        // Find nearest unvisited tile
        let nearestUnvisited = null;
        let minDist = Infinity;
        const myPos = { x: agent.x, y: agent.y };

        for (let tile of agent.grid.getTiles()) {
            if (tile.walkable && !this.visitedTiles.has(`${tile.x},${tile.y}`)) {
                const dist = Xy.distance(myPos, { x: tile.x, y: tile.y });
                if (dist < minDist) {
                    minDist = dist;
                    nearestUnvisited = { x: tile.x, y: tile.y };
                }
            }
        }

        if (nearestUnvisited) {
            await this.moveToTarget(nearestUnvisited.x, nearestUnvisited.y);
        } else {
            // All tiles visited, reset and start over
            this.visitedTiles.clear();
            // Make a random move
            const index = Math.floor(Math.random() * 4);
            await agent[actions[index]]();
        }
    }
}

export default IntelligentParcelNPC;
