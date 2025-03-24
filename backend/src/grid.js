const Grid = require('./deliveroo/Grid');
const { MAP_FILE } = require('../config');
const ParcelSpawner = require('./workers/ParcelSpawner');
const NPCspawner = require('./workers/NPCspawner');



const map = require( '../levels/maps/' + MAP_FILE );
const myGrid = new Grid( map );

const myParcelSpawner = new ParcelSpawner( myGrid );

const myNPCSpawner = new NPCspawner( myGrid );



module.exports = { myGrid, myParcelSpawner, myNPCSpawner };
