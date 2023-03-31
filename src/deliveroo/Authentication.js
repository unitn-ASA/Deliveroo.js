const Agent = require('./Agent');
const Grid = require('./Grid');
const jwt = require('jsonwebtoken');
const { uid } = require('uid');

const SUPER_SECRET = process.env.SUPER_SECRET || 'default_token_private_key';


/**
 * @class Authentication
 */
class Authentication {

    /**
     * @type {Map<string,{agent:Agent,sockets:Set<Socket>}>} idToAgentAndSockets
     */
    idToAgentAndSockets = new Map();
    
    registerSocketAndGetAgent ( id, name, socket ) {

        const db = this.idToAgentAndSockets;
        
        // Get or create entry for id
        var entry = db.get( id );
        if ( ! entry ) {
            db.set( id, { score: 0, sockets: new Set() } );
            entry = db.get( id );
        }

        // Register socket
        entry.sockets.add( socket );

        // Get or create agent for id
        var me = this.grid.getAgent( id );
        if ( ! me ) {
            me = this.grid.createAgent( {id: id, name} );
            me.score = db.get( id ).score;
            me.on( 'score', (me) => entry.score = me.score )
        }

        return me; // Return agent given the specified id
        
    }
    
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
        var token = socket.handshake.headers['x-token'];

        // No token provided, generate new one
        if ( !token || token=="" ) { // no token provided, generate new one

            id = uid();
            name = socket.handshake.query.name;
            token = jwt.sign( {id, name}, SUPER_SECRET );
            socket.emit( 'token', token );
            console.log( `Socket ${socket.id} connected as ${name}(${id}). New token created: ...${token.slice(-30)}` );

        }

        // Token provided
        else {
            try {

                // Verify and decode payload
                const decoded = jwt.verify( token, SUPER_SECRET );
                if ( decoded.id && decoded.name ) {
                    id = decoded.id
                    name = decoded.name
                    console.log( `Socket ${socket.id} connected as ${name}(${id}). With token: ...${token.slice(-30)}` );
                }
                else {
                    throw `Socket ${socket.id} log in failure. Token is verified but id or name are missing.`
                }
                
            } catch(err) {

                console.log( `Socket ${socket.id} log in failure. Invalid token provided.` );
                socket.disconnect();
                return; // invalid token

            }
        }

        // Agent
        const me = this.registerSocketAndGetAgent( id, name, socket );
    
        

        /**
         * on Disconnect
         */
        socket.on( 'disconnect', () => {

            const tokenToSockets = this.idToAgentAndSockets;

            console.log( `Socket ${socket.id} disconnected from agent ${me.name}(${me.id})` );
            tokenToSockets.get( id ).sockets.delete( socket );
    
            if ( tokenToSockets.get( id ).sockets.size == 0 ) {
                new Promise( res => setTimeout(res, 10000) ).then( () => {
                    if ( tokenToSockets.get( id ) && tokenToSockets.get( id ).sockets.size == 0 ) {
                        console.log( `Agent ${me.name}(${me.id}) deleted after 10 seconds of no connections from token ...${token.slice(-30)}` );
                        this.grid.deleteAgent ( me );
                        // tokenToSockets.delete( id );
                    }
                } );
            }

        });

        return me;
    
    }

}

 

module.exports = Authentication