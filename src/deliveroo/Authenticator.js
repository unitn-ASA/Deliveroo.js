const Agent = require('./Agent');
const Grid = require('./Grid');
const jwt = require('jsonwebtoken');
const { uid } = require('uid');

const ManagerAgents = require('../workers/ManagerAgents')

const SUPER_SECRET = process.env.SUPER_SECRET || 'default_token_private_key';
const AGENT_TIMEOUT = process.env.AGENT_TIMEOUT || 10000;



/**
 * @class Authentication
 */
class Authenticator {

    /**
     * @type {Map<string,{agent:Agent,sockets:Set<Socket>}>} idToAgentAndSockets
     */
    idToAgentAndSockets = new Map();
    
    
    /** @param {string} id @return {Agent} */
    getAgent ( id ) {

        return ( this.idToAgentAndSockets.get( id ) ? idToAgentAndSockets.get( id ).agent : null );
        
    }
    
    /** @param {string} id */
    getSockets ( id ) {
        
        let _this = this
        
        return function * () {
            if ( _this.idToAgentAndSockets.has( id ) )
                for ( let s of _this.idToAgentAndSockets.get( id ).sockets.values() )
                    yield s;
        }
        
    }

    /** @type {Grid} */
    grid;

    constructor ( grid ) {
        this.grid = grid;
    }

    /** @type {function(Socket):Agent} */
    authenticate ( socket ) {
    
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
                throw  `Socket ${socket.id} log in failure. Invalid token provided.`;
            }
        }
    
        // Get or create entry in the register AgentSocket for id
        var entry = this.idToAgentAndSockets.get(id);
        if (!entry) {
            this.idToAgentAndSockets.set(id, { agent: null, sockets: new Set() });
            entry = this.idToAgentAndSockets.get(id);
        }

        // Register socket
        entry.sockets.add(socket);

        // Get or create agent for id
        var me = this.grid.getAgent(id);
        if (!me){
            me = ManagerAgents.getAgent(id, name, agentType, this.grid);
            entry.agent = me
        }
       
        /**
         * on Disconnect
         */
        socket.on('disconnect', () => {
            const tokenToSockets = this.idToAgentAndSockets;
    
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

}

 

module.exports = Authenticator