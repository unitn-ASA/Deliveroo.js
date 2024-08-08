const Agent = require('../deliveroo/Agent');
const config =  require('../../config');
const jwt = require('jsonwebtoken');
const { uid } = require('uid');

const SUPER_SECRET = process.env.SUPER_SECRET || 'default_token_private_key';
const AGENT_TIMEOUT = process.env.AGENT_TIMEOUT || 10000;


var agentClasses = {};                // Map associating name to the class of each agent type


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

/**
 * @type {Map<string,{agent:Object ,sockets:Set<Socket>}>} idToAgentAndSockets
 */
const idToAgentAndSockets = new Map();

function registerSocketAndGetAgent(id, name, agentType, socket, grid) {
    const db = idToAgentAndSockets;

    // Get or create entry for id
    var entry = db.get(id);
    if (!entry) {
        db.set(id, { agent: null, sockets: new Set() });
        entry = db.get(id);
    }

    // Register socket
    entry.sockets.add(socket);

    // Get or create agent for id
    var me = grid.getAgent(id);

    if (!me) {

        let tiles_unlocked =
        Array.from( grid.getTiles() )
        // not locked
        .filter( t => ! t.locked )

                
        if ( tiles_unlocked.length == 0 )
            throw new Error('No unlocked tiles available on the grid')

        let i = Math.floor( Math.random() * tiles_unlocked.length - 1 )
        let tile = tiles_unlocked.at( i )
        tile.lock()

        // try to load the requested agent type, if it is not found generate a default Agent
        const AgentClass = agentClasses[agentType.toLowerCase()];
        if (!AgentClass) {
            if(agentType != 'default'){
                console.error(`Class for agent type ${agentType} not found; default agent created`);
            }
            me = new Agent(grid, id, name, tile);
        } else {
            me = new AgentClass(grid, id, name, tile);
        }

        entry.agent = me
    }

    return me; // Return agent given the specified id
}

/** @type {function(Socket,Grid):Agent} */
function authenticate(socket, grid) {
    var id;
    var name;
    var agentType;
    var token = socket.handshake.headers['x-token'];

    // No token provided, generate new one
    if (!token || token == "") {
        id = uid();
        name = socket.handshake.query.name;
        agentType = socket.handshake.query.agentType;

        token = jwt.sign({ id, name, agentType }, SUPER_SECRET);
        socket.emit('token', token);
        console.log(`Socket ${socket.id} connected as ${name}(${id},${agentType}). New token created: ...${token.slice(-30)}`);
    }
    // Token provided
    else {
        try {
            // Verify and decode payload
            const decoded = jwt.verify(token, SUPER_SECRET);
            if (decoded.id && decoded.name && decoded.agentType) {
                id = decoded.id;
                name = decoded.name;
                agentType = decoded.agentType;
                console.log(`Socket ${socket.id} connected as ${name}(${id},${agentType}). With token: ...${token.slice(-15)}`);
            } else {
                throw `Socket ${socket.id} log in failure. Token is verified but id or name are missing.`;
            }
        } catch (err) {
            console.error(`Socket ${socket.id} log in failure. Invalid token provided.`);
            socket.disconnect();
            return; // invalid token
        }
    }

    // Agent
    var me = registerSocketAndGetAgent(id, name, agentType, socket, grid);


    /**
     * Emit me
     */
    socket.broadcast.emit( 'hi ', socket.id, me.id, me.name );

    socket.emit( 'config', me.config )

    // Emit you
    me.on( 'update', ({id, x, y, type, metadata}) => {
      //console.log( 'emit you', id, x, y, type, metadata );
      socket.emit( 'you', {id, x, y, type, metadata} );
    } );
    // console.log( 'emit you', id, name, x, y, score );
    socket.emit( 'you', me );
  

    /**
     * Emit sensing
     */
    // Entities
    me.on( 'entities sensing', (entities) => {
        //console.log('emit entities sensing', ...entities);
        socket.emit('entities sensing', entities )
    } );
    me.emitEntitySensing();

    // Agents
    me.on( 'agents sensing', (agents) => {
        // console.log(me.get('name') + ' emit agents sensing', ...agents); // {id, x, y, type, metadata}
        socket.emit( 'agents sensing', agents );
    } );
    me.emitAgentSensing();


    /**
     * on Disconnect
     */
    socket.on('disconnect', () => {
        const tokenToSockets = idToAgentAndSockets;

        console.log(`Socket ${socket.id} disconnected from agent ${me.metadata.name}(${me.id})`);
        tokenToSockets.get(id).sockets.delete(socket);

        if (tokenToSockets.get(id).sockets.size == 0) {
            new Promise(res => setTimeout(res, AGENT_TIMEOUT)).then(() => {
                if (tokenToSockets.get(id) && tokenToSockets.get(id).sockets.size == 0) {
                    console.log(`Agent ${me.metadata.name}(${me.id}) deleted after 10 seconds of no connections from token ...${token.slice(-30)}`);
                    me.delete();
                }
            });
        }
    });

    return me;
}


const ManagerAgent = { loadPlugin, authenticate}

module.exports = ManagerAgent;