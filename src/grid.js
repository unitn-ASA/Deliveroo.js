const Grid = require('./deliveroo/Grid');
const ParcelsGeneratorService = require('./deliveroo/services/ParcelsGeneratorService');
const config = require('../config');



const MAP_FILE = config.MAP_FILE || process.env.MAP_FILE || "default_map";



const myMap = require( '../levels/maps/' + MAP_FILE );
const grid = new Grid( myMap );
new ParcelsGeneratorService( grid ).start();



module.exports = grid;