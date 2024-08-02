const Plugin = require('./Plugin')
const config = require('../../config')

class PluginTile extends Plugin {
    
    constructor(name, core, settings) {
        super(name, core, settings)
    }

    /*In the tile setting the standard entries are
        - MAP_ID: indicates the number to which the type is associated in the numerical grid representing the map,
                  if it is not specified it is associated with the first free number
    */

    load() {
                
        let map_id;

        if (this.settings && 'MAP_ID' in this.settings) {
            map_id = this.settings.MAP_ID;
            if (config.TILETYPEMAP && config.TILETYPEMAP.hasOwnProperty(map_id)) {
                throw new Error(`ID ${map_id} is already used.`);
                return;
            }
        } else {
            const existingIds = Object.keys(config.TILETYPEMAP).map(Number);
            map_id = 0;
            while (existingIds.includes(map_id)) {
                map_id++;
            }
        }

        if (!config.TILETYPEMAP)  config.TILETYPEMAP = {};
        config.TILETYPEMAP[map_id] = this.name;

        if(!this.settings) return                        // if the plugin has no settings, we can not load them on file config 

        for (let key in this.settings) {                 // Iterate over each setting and add it to the config
            if (!config[key] && key != 'MAP_ID') {       // set the new setting only if it not already defined
                config[key] = this.settings[key];        // the MAP_ID is not added in the standard way
            }
        }

    }

}

module.exports = PluginTile