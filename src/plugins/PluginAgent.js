const Plugin = require('./Plugin')
const config = require('../../config')

class PluginAgent extends Plugin {
    
    constructor(name, core, settings) {
        super(name, core, settings)
    }

    load() {

        if (!config.AGENTS)  config.AGENTS = [];
        config.AGENTS.push(this.name)                    // Add the name of the class in the list of agents in the game 
        
        if(!this.settings) return                        // if the plugin has no settings, we can not load them on file config 

        for (let key in this.settings) {                 // Iterate over each setting and add it to the config
            if (!config[key]) {                          // set the new setting only if it not already defined
                config[key] = this.settings[key];
            }
        }
    }

}

module.exports = PluginAgent