const Tile = require('../deliveroo/Tile');
const config =  require('../../config');


let tileClasses = {};       // Map associating name to the class of each tile type


function loadPlugin(PluginName){    

    /*In the tile setting the standard entries are
        - MAP_ID: indicates the number to which the type is associated in the numerical grid representing the map,
                  if it is not specified it is associated with the first free number
    */
    
    if (!config.TILETYPEMAP)  config.TILETYPEMAP = {};

    // load the extension of the plugin in the tiles register
    let tilePlugin = require(`../plugins/tiles/${PluginName}`)      // get the plugin from the tile's plugins folder
    tileClasses[tilePlugin.name] = tilePlugin.extension;            // create a name-class entry for the loaded tile

    // each type of Tile is associated with an id number, if the plugin does not define it the manager associates one
    let map_id;     

    if (tilePlugin.settings && 'MAP_ID' in tilePlugin.settings) {       // check if the plugin define the id
        map_id = tilePlugin.settings.MAP_ID;

        //if the id is already used, the manager replaces the old tile with the new one
        if (config.TILETYPEMAP && config.TILETYPEMAP.hasOwnProperty(map_id)) {
            throw new Error(`ID ${map_id} was already used by `+ config.TILETYPEMAP[map_id] + `, it is replaced by ${tilePlugin.name}`);
        }

    } else {                                                    // if the plugin dosn't define the id associet a defaul one
        const existingIds = Object.keys(config.TILETYPEMAP).map(Number);
        map_id = 0;
        while (existingIds.includes(map_id)) { map_id++; }
    }

    // if the plugin has settings the manager load them on file config
    if(tilePlugin.settings){
        for (let key in tilePlugin.settings) {                 // Iterate over each setting and add it to the config
            if (!config[key] && key != 'MAP_ID') {             // set the new setting only if it not already defined
                config[key] = tilePlugin.settings[key];        // the MAP_ID is not added in the standard way
            }
        }
    }

    // Add the name of the tile type of the extension in the list of tiles in the game
    config.TILETYPEMAP[map_id] = tilePlugin.name;

}


function spawnTiles(map, grid) {

    // tha map is a bidimensional matrix of number, the menager will generete the tiles associeted with that number
    const tileTypeMap = config.TILETYPEMAP
    
    let tiles = Array.from(map).map( (column, x) => {   
        return Array.from(column).map( (value, y) => {                      // for each number in the bidimensional map matrix

            let TileClass = tileClasses[tileTypeMap[value]]                 //  - get the tile type associeted with that number
            if (!TileClass) {                                               //    if there isn't an assosieted class it generate a default tile
                console.error(`No tile found for id ${value}, a default one was generated instead`);
                return new Tile(grid, x, y);
            }

            return new TileClass(grid, x, y);                               //  - generete a new tyle of the correct type
        })
    } );

    return tiles;
}

const ManagerTiles = { loadPlugin, spawnTiles}

module.exports = ManagerTiles;