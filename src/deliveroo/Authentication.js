const Agent = require('./Agent');
const Grid = require('./Grid');
const jwt = require('jsonwebtoken');

const SUPER_SECRET = process.env.SUPER_SECRET || 'default_token_private_key';



class Authentication {

    /**
     * @type {Map<string,{agent:Agent,sockets:Set<Socket>}>}
     */
    idToAgentAndSockets = new Map();
    
    registerSocketAndGetAgent ( uuid, name, socket ) {

        const db = this.idToAgentAndSockets;
        
        // Get or create entry for uuid
        var entry = db.get( uuid );
        if ( ! entry ) {
            db.set( uuid, { score: 0, sockets: new Set() } );
            entry = db.get( uuid );
        }

        // Register socket
        entry.sockets.add( socket );

        // Get or create agent for uuid
        var me = this.grid.getAgent( uuid );
        if ( ! me ) {
            me = this.grid.createAgent( {id: uuid, name} );
            me.score = db.get( uuid ).score;
            me.on( 'score', (me) => entry.score = me.score )
        }

        return me; // Return agent given the specified uuid
        
    }
    
    getAgent ( uuid ) {

        return ( idToAgentAndSockets.get( uuid ) ? idToAgentAndSockets.get( uuid ).agent : null );
        
    }
    
    getSockets ( uuid ) {

        return function * () {
            if ( this.slicedTokenToSockets.has( uuid ) )
                for ( let s of this.slicedTokenToSockets.get( uuid ).sockets.values )
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
    
        var token = socket.handshake.headers['x-token'];
        var uuid = token.slice(-10);
        var me;
        // Signup
        if ( !token || token=="" ) { // no token provided, generate new one
            let name = socket.handshake.query.name;
            token = jwt.sign( {name}, SUPER_SECRET );
            uuid = token.slice(-10);
            socket.emit( 'token', token, name );
            me = this.registerSocketAndGetAgent( uuid, name, socket );
            console.log( `Socket ${socket.id} signed up as ${me.name}(${me.id}). New token: ...${token.slice(-30)}` );
        }
        // Login
        else { // token provided, validate
            try { // verify token
                var decoded = jwt.verify( token, SUPER_SECRET );
                var {name} = decoded;
                // Agent
                me = this.registerSocketAndGetAgent( uuid, name, socket );
                console.log( `Socket ${socket.id} logged in as ${me.name}(${me.id}) with token: ...${token.slice(-30)}` );
            } catch(err) {
                console.log( `Socket ${socket.id} log in failure. Invalid token provided` );
                socket.disconnect();
                return; // invalid token
            }
        }
    
        
    
        const tokenToSockets = this.idToAgentAndSockets;

        /**
         * on Disconnect
         */
        socket.on('disconnect', () => {

            console.log( `Socket ${socket.id} disconnected from agent ${me.name}(${me.id})` );
            tokenToSockets.get( uuid ).sockets.delete( socket );
    
            if ( tokenToSockets.get( uuid ).sockets.size == 0 ) {
                new Promise( res => setTimeout(res, 10000) ).then( () => {
                    if ( tokenToSockets.get( uuid ) && tokenToSockets.get( uuid ).sockets.size == 0 ) {
                        console.log( `Agent ${me.name}(${me.id}) deleted after 10 seconds of no connections from token ...${uuid}` );
                        this.grid.deleteAgent ( me );
                        // tokenToSockets.delete( uuid );
                    }
                } );
            }
        });

        return me;
    
    }

}

 

module.exports = Authentication