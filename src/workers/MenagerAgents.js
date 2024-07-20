const Agent = require('../deliveroo/Agent');
const config =  require('../../config');
const jwt = require('jsonwebtoken');
const { uid } = require('uid');

const SUPER_SECRET = process.env.SUPER_SECRET || 'default_token_private_key';
const AGENT_TIMEOUT = process.env.AGENT_TIMEOUT || 10000;

// Holds the classes of agents dynamically loaded
var agentClasses = {};

// Holds the grid
var grid;

// the initialization focus on the dynamic load of the different agent classes
function init(newGrid) {
    grid = newGrid;

    // Dynamically load agent classes
    let agentClassesList = process.env.AGENTS || config.AGENTS;
    if(!agentClassesList) return

    agentClassesList.forEach(agentName => {
        try {
            agentClasses[agentName.toLowerCase()] = require(`../extensions/agents/${agentName}`);
        } catch (error) {
            console.error(`Class ${agentName} not founded`);
        }
    });
}

/**
 * @type {Map<string,{agent:Object ,sockets:Set<Socket>}>} idToAgentAndSockets
 */
const idToAgentAndSockets = new Map();

function registerSocketAndGetAgent(id, name, agentType, socket) {
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
        // try to load the requested agent type, if it is not found generate a default Agent
        const AgentClass = agentClasses[agentType.toLowerCase()];
        if (!AgentClass) {
            console.error(`Class for agent type ${agentType} not found; default agent created`);
            me = new Agent(grid, {id, name});
        } else {
            me = new AgentClass(grid, {id, name});
        }

        entry.agent = me
    }

    return me; // Return agent given the specified id
}

/** @type {function(Socket):Agent} */
function authenticate(socket) {
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
                console.log(`Socket ${socket.id} connected as ${name}(${id},${agentType}). With token: ...${token.slice(-30)}`);
            } else {
                throw `Socket ${socket.id} log in failure. Token is verified but id or name are missing.`;
            }
        } catch (err) {
            console.log(`Socket ${socket.id} log in failure. Invalid token provided.`);
            socket.disconnect();
            return; // invalid token
        }
    }

    // Agent
    var me = registerSocketAndGetAgent(id, name, agentType, socket);

    /**
     * on Disconnect
     */
    socket.on('disconnect', () => {
        const tokenToSockets = idToAgentAndSockets;

        console.log(`Socket ${socket.id} disconnected from agent ${me.name}(${me.id})`);
        tokenToSockets.get(id).sockets.delete(socket);

        if (tokenToSockets.get(id).sockets.size == 0) {
            new Promise(res => setTimeout(res, AGENT_TIMEOUT)).then(() => {
                if (tokenToSockets.get(id) && tokenToSockets.get(id).sockets.size == 0) {
                    console.log(`Agent ${me.name}(${me.id}) deleted after 10 seconds of no connections from token ...${token.slice(-30)}`);
                    me.delete();
                }
            });
        }
    });

    return me;
}

module.exports = { init, authenticate };