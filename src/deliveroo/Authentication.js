const Agent = require('./Agent');
const jwt = require('jsonwebtoken');

const SUPER_SECRET = process.env.SUPER_SECRET || 'default_token_private_key';



class Authentication {

    /**
     * @type {Map<string,{agent:Agent,sockets:Set<Socket>}>}
     */
    tokenToSockets = new Map();
    
    registerSocketAndGetAgent ( token, name, socket ) {

        const tokenToSockets = this.tokenToSockets;
        
        if ( !tokenToSockets.has( token ) ) { // Create new agent and register socket
            tokenToSockets.set( token, { agent: this.grid.createAgent( name ), sockets: new Set( [socket] ) } );
        } else { // Register socket
            tokenToSockets.get( token ).sockets.add( socket );
        }
        return tokenToSockets.get( token ).agent; // Return agent given the associated token
        
    }

    /** @type {Grid} */
    grid;

    constructor ( grid ) {
        this.grid = grid;
    }

    /** @type {function(Socket):Agent} */
    authenticate (socket) {
    
        var token = socket.handshake.headers['x-token'];
        var me;
        // Signup
        if ( !token || token=="" ) { // no token provided, generate new one
            let name = socket.handshake.query.name;
            token = jwt.sign( {name}, SUPER_SECRET );
            socket.emit( 'token', token, name );
            me = this.registerSocketAndGetAgent( token, name, socket );
            console.log( `Socket ${socket.id} signed up as ${me.name}(${me.id}). New token: ...${token.slice(-5)}` );
        }
        // Login
        else { // token provided, validate
            try { // verify token
                var decoded = jwt.verify( token, SUPER_SECRET );
                var {name} = decoded;
                // Agent
                me = this.registerSocketAndGetAgent( token, name, socket );
                console.log( `Socket ${socket.id} logged in as ${me.name}(${me.id}) with token: ...${token.slice(-5)}` );
            } catch(err) {
                console.log( `Socket ${socket.id} log in failure. Invalid token provided` );
                socket.disconnect();
                return; // invalid token
            }
        }
    
        
    
        const tokenToSockets = this.tokenToSockets;

        /**
         * on Disconnect
         */
        socket.on('disconnect', () => {

            console.log( `Socket ${socket.id} disconnected from agent ${me.name}(${me.id})` );
            tokenToSockets.get( token ).sockets.delete( socket );
    
            if ( tokenToSockets.get( token ).sockets.size == 0 ) {
                new Promise( res => setTimeout(res, 10000) ).then( () => {
                    if ( tokenToSockets.get( token ) && tokenToSockets.get( token ).sockets.size == 0 ) {
                        console.log( `Agent ${me.name}(${me.id}) deleted after 10 seconds of no connections from token ...${token.slice(-5)}` );
                        tokenToSockets.delete( token ); 
                        this.grid.deleteAgent ( me );
                        me.removeAllListeners('agents sensing');
                        me.removeAllListeners('parcels sensing');
                    }
                } );
            }
        });

        return me;
    
    }

}

 

module.exports = Authentication