const Plugin = require('./Plugin')
const config = require('../../config')

class PluginEntity extends Plugin {
    
    constructor(name, core, settings) {
        super(name, core, settings)
    }

    /*In the entity plugin setting the standard entries are
        - ENTITY_GENERATION_INTERVAL: indicates the time between 2 consecutive spawns of this entity type. 
                Accepted values ​​are: '1s', '2s', '5s', '10s', 'infinite'. if the entry is not defined all entities
                will be generated when the game initializes.
        - ENTITY_MAX: indicates the max number for the specific type entity
        - ENTITY_SPAWN_TILE: indicate the type of tile on which the entity can spawn. if it is not specified the default type is 'spawner'
    */

    load() {

        // Add the name of the class in the list of entities in the game
        if (!config.ENTITIES)  config.ENTITIES = [];
        config.ENTITIES.push(this.name)                  

        if(!this.settings) return                        // if the plugin has no settings, we can not load them on file config 

        for (let key in this.settings) {                 // Iterate over each setting and add it to the config
            if (!config[key]) {                          // set the new setting only if it not already defined 
                config[key] = this.settings[key];
            }
        } 
        
    }

}

module.exports = PluginEntity