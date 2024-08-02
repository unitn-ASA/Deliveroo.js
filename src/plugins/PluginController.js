const Plugin = require('./Plugin')
const config = require('../../config')

class PluginController extends Plugin {
    
    constructor(name, core, settings) {
        super(name, core, settings)
    }

    /*In the controller plugin setting the standard entries are
        - SUBJECTS: indicates the type of Agent to which the controller is associated. Can contain multiple Agent types.
                    if the type is already associated with another controller, it overwrites the old information 
    */

    load() {

        if (!config.AGENTSCONTROLLER)  config.AGENTSCONTROLLER = {};
                
        if (this.settings && this.settings.SUBJECTS) {
            for (let subject of this.settings.SUBJECTS) {
                if (config.AGENTSCONTROLLER.hasOwnProperty(subject)) {
                    console.warn(`Controller ${config.AGENTSCONTROLLER.subject} is being overwritten in AGENTSCONTROLLER fot the Agent ${subject}.`);   
                }
                config.AGENTSCONTROLLER[subject] = this.name;
                
            }
        }

        if(!this.settings) return                        // if the plugin has no settings, we can not load them on file config 

        for (let key in this.settings) {                 // Iterate over each setting and add it to the config
            if (!config[key] && key != 'SUBJECTS') {     // set the new setting only if it not already defined 
                config[key] = this.settings[key];        // the SUBJECTS is not added in the standard way
            }
        }

    }

}

module.exports = PluginController