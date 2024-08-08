const Grid = require('./deliveroo/Grid');
const randomlyMovingAgent = require('./workers/randomlyMovingAgent');
const ManagerEntities = require('./workers/ManagerEntities');
const config = require('../config');

const MAP_FILE = config.MAP_FILE || process.env.MAP_FILE || "default_map";

const map = require( '../levels/maps/' + MAP_FILE );

async function initGrid(){
    let grid = new Grid(map);

    await ManagerEntities.managerSpawnEntities( grid );
    
    return grid
}

module.exports = initGrid;