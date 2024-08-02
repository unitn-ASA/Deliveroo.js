class Plugin {

    name        // name of the class that the plugin adds
    core        // class that the plugin adds
    setting     // setting the values ​​necessary to manage the plugin objects
    
    constructor(name, core, settings) {
        this.name = name
        this.core = core;
        this.settings = settings;
    }

    // method to load the plugin into the system, must be overridden in the plugin subtype
    load() {
        console.error('ERROR: load method not found')
    }

}

module.exports = Plugin