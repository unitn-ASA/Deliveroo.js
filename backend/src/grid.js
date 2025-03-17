const Grid = require('./deliveroo/Grid');
const randomlyMovingAgent = require('./workers/randomlyMovingAgent');
const parcelsGenerator = require('./workers/parcelsGenerator');
const {RANDOMLY_MOVING_AGENTS, MAP_FILE} = require('../config');
const Spawner = require('./deliveroo/Spawner');



const map = require( '../levels/maps/' + MAP_FILE );
const grid = new Grid( map );

// parcelsGenerator( grid );
new Spawner( grid );

for (let i = 0; i < RANDOMLY_MOVING_AGENTS; i++) {
    randomlyMovingAgent( grid );
}



module.exports = grid;