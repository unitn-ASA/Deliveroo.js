const Grid = require('./deliveroo/Grid');
const randomlyMovingAgent = require('./workers/randomlyMovingAgent');
const menagerEntities = require('./workers/MenagerEntities');
const menagerAgents = require('./workers/MenagerAgents');
const menagerControllers = require('./workers/MenagerControllers');
const config = require('../config');

const MAP_FILE = config.MAP_FILE || process.env.MAP_FILE || "default_map";
const RANDOMLY_MOVING_AGENTS = config.RANDOMLY_MOVING_AGENTS || process.env.RANDOMLY_MOVING_AGENTS || 0;

const map = require( '../levels/maps/' + MAP_FILE );
const grid = new Grid(map);

// Initialize menagerAgents and menagerControllers
menagerAgents.init(grid);
menagerControllers.init(grid);

// Add managerAgents and menagerControllers to grid
grid.menagerAgents = menagerAgents;
grid.menagerControllers = menagerControllers

menagerEntities( grid );




/*
for (let i = 0; i < RANDOMLY_MOVING_AGENTS; i++) {
    randomlyMovingAgent( grid );
} */

module.exports = grid;