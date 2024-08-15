const config = require('../config');

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const Entity = require('./deliveroo/Entity');
const Tile = require('./deliveroo/Tile');
const Agent = require('./deliveroo/Agent');
const Controller = require('./deliveroo/Controller')

const ManagerEntities = require('./workers/ManagerEntities');
const ManagerAgents = require('./workers/ManagerAgents');
const ManagerControllers = require('./workers/ManagerControllers');
const ManagerTiles = require('./workers/ManagerTiles');


//Ask what plugins to add to the game and try to include them.
async function setupPlugin() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    let plugins = config.PLUGINS || [];   // load the default plugins 

    function askForPlugin() {
        return new Promise((resolve) => {
            rl.question('Enter plugin name to add (or "done" to finish): ', (answer) => {
                if (answer.toLowerCase() === 'done') {
                    rl.close();
                    resolve();
                } else {
                    plugins.push(answer);
                    resolve(askForPlugin());
                }
            });
        });
    }

    await askForPlugin();

    //addPlugin` is the method to add a plugin to ioServer
    plugins.forEach(plugin => {
        addPlugin(plugin); 
    });

    console.log('Server configured with plugins:', plugins);
}


/**
 * Add plugin from extensions folder
 */
function addPlugin(pluginName) {
    const extensionsDir = path.join(__dirname, 'plugins');
    const subDirs = ['agents', 'tiles', 'entities', 'controllers'];
    let found = false;
    
    try {
        for (const subDir of subDirs) {
            let fullPath = path.join(extensionsDir, subDir, pluginName);
            fullPath = `${fullPath}.js`;
    
            if (fs.existsSync(fullPath) || fs.existsSync(fullPath.toLowerCase()) || fs.existsSync(fullPath.toUpperCase())) {
                const pluginPath = [fullPath, fullPath.toLowerCase(), fullPath.toUpperCase()].find(p => fs.existsSync(p));
                const plugin = require(pluginPath);
                
                if(!checkPluginStructur(plugin)){
                    throw new Error('Incorrect plugin structure')
                }

                try {  
                    if(subDir == 'agents') ManagerAgents.loadPlugin(pluginName)
                    if(subDir == 'tiles') ManagerTiles.loadPlugin(pluginName)
                    if(subDir == 'entities') ManagerEntities.loadPlugin(pluginName)
                    if(subDir == 'controllers') ManagerControllers.loadPlugin(pluginName)
                } 
                catch (error) { console.error('ERROR loading plugin: ', pluginName + ':\n', error) }
                
                found = true;
                break;
            }
        }
    
        if (!found) {
            console.error(`Plugin "${pluginName}" not found in plugins folder.`);
        } 

    } catch (error) {
        console.error('ERROR adding plugin: ', pluginName + ':\n', error)
    }
    
};

function checkPluginStructur(plugin){
    
    // Controlla se l'attributo 'name' è presente e se è una stringa
    if (typeof plugin.name !== 'string') {
        return false;
    }

    // Controlla se l'attributo 'extension' è presente e se è una classe
    if (typeof plugin.extension !== 'function' ) {
        return false;
    }

    //check that the extansion is a subclass of one of the base classes
    if (Object.getPrototypeOf(plugin.extension) !== Entity && Object.getPrototypeOf(plugin.extension) !== Tile &&
        Object.getPrototypeOf(plugin.extension) !== Agent  && Object.getPrototypeOf(plugin.extension) !== Controller) {
            return false;
    }

    return true;
}


module.exports = setupPlugin