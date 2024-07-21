const Tile = require('../deliveroo/Tile');
const config =  require('../../config');
const fs = require('fs');
const path = require('path');

// Holds the classes of agents dynamically loaded
var tileClasses = {};

// Define the map associating values to tile classes
const tileTypeMap = process.env.TILETYPEMAP || config.TILETYPEMAP

// the initialization focus on the dynamic load of the different agent classes
function init(map) {
    
    Object.values(tileTypeMap).forEach(tileName =>  {
        try {
            tileClasses[tileName] = require(`../extensions/tiles/${tileName}`);
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
                return new Tile(this, x, y);
            }

            return new TileClass(this, x, y);
        })
    } );

    //console.log(tiles)
    return tiles;
}

module.exports = init;