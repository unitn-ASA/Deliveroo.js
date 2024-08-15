const Agent = require('../deliveroo/Agent');
const config =  require('../../config');
const jwt = require('jsonwebtoken');
const { uid } = require('uid');

const SUPER_SECRET = process.env.SUPER_SECRET || 'default_token_private_key';
const AGENT_TIMEOUT = process.env.AGENT_TIMEOUT || 10000;


var agentClasses = {    // Map associating name to the class of each agent type
    'default': Agent    // define the 'default' type as Agent
};                


function loadPlugin(PluginName) {

    if (!config.AGENTS)  config.AGENTS = [];

    // load the extension of the plugin in the agents register
    let agentPlugin = require(`../plugins/agents/${PluginName}`)        // get the plugin from the agent's plugins folder
    agentClasses[agentPlugin.name.toLowerCase()] = agentPlugin.extension;             // create a name-class entry for the loaded agent
    

    // if the plugin has settings the manager load them on file config
    if(agentPlugin.settings){
        for (let key in agentPlugin.settings) {                 // Iterate over each setting and add it to the config
            if (!config[key]) {                          // set the new setting only if it not already defined
                config[key] = agentPlugin.settings[key];
            }
        }
    }                      
        
    // Add the name of the agent type of the extension in the list of tiles in the game
    config.AGENTS.push(agentPlugin.name)                    
}


function getAgent(id, name, agentType, grid) {
    let me;

    let tiles_unlocked =
    Array.from( grid.getTiles() )
    // not locked
    .filter( t => ! t.locked )

            
    if ( tiles_unlocked.length == 0 )
        throw new Error('No unlocked tiles available on the grid')

    let i = Math.floor( Math.random() * tiles_unlocked.length - 1 )
    let tile = tiles_unlocked.at( i )
    tile.lock()

    // try to load the requested agent type, if it is not found generate a default type
    let AgentClass = agentClasses[agentType.toLowerCase()];
    if (!AgentClass) {
        if(agentType != 'default'){
            console.error(`Class for agent type ${agentType} not found; default agent created`);
        }
        AgentClass = agentClasses['default'];
    }  
    me = new AgentClass(grid, id, name, tile);

    return me; // Return agent given the specified id
}


const ManagerAgents = { loadPlugin, getAgent}

module.exports = ManagerAgents;