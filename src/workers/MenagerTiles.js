const Tile = require('../deliveroo/Tile');
const config =  require('../../config');


// Holds the classes of agents dynamically loaded
var tileClasses = {};

// the initialization focus on the dynamic load of the different agent classes
function init(map, grid) {

    // Define the map associating values to tile classes
    const tileTypeMap = config.TILETYPEMAP
    
    Object.values(tileTypeMap).forEach(tileName =>  {
        try {
            let tilePlugin = require(`../plugins/tiles/${tileName}`)
            tileClasses[tileName] = tilePlugin.core;
        } catch (error) {
            console.error(`Class ${tileName} not founded`);
        }
    });


    //Creation of the tiles
    let tiles = Array.from(map).map( (column, x) => {
        return Array.from(column).map( (value, y) => {

            let TileClass = tileClasses[tileTypeMap[value]]

            if (!TileClass) {
                console.error(`No class found for tile type ${value}`);
                return new Tile(grid, x, y);
            }

            return new TileClass(grid, x, y);
        })
    } );

    //console.log(tiles)
    return tiles;
}

module.exports = init;