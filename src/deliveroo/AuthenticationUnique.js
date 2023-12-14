const jwt = require('jsonwebtoken');
const {generateToken,decodeToken} = require('./Token')

const SUPER_SECRET = process.env.SUPER_SECRET || 'default_token_private_key';
const AGENT_TIMEOUT = process.env.AGENT_TIMEOUT || 10000;

class AuthenticationUnique{

    authenticate ( game , socket ) {
    
        var id;
        var name;
        var token = socket.handshake.headers['x-token'];

        // No token provided, generate new one
        if ( !token || token=="" ) { // no token provided, generate new one

            token = generateToken(socket.handshake.headers['name'])
            socket.emit( 'token', token );
            const decoded = decodeToken(token);
            if ( decoded.id && decoded.name ) {
                id = decoded.id
                name = decoded.name
                console.log( `Socket ${socket.id} connected as ${name}(${id}) to the game ${game.id}. With token: ...${token.slice(-30)}` );
            }
            else {
                throw `Socket ${socket.id} log in failure. Token is verified but id or name are missing.`
            }
            
        }

        // Token provided
        else {
            try {

                // Verify and decode payload
                const decoded = decodeToken(token);
                if ( decoded.id && decoded.name ) {
                    id = decoded.id
                    name = decoded.name
                    console.log( `Socket ${socket.id} connected as ${name}(${id}) to the game ${game.id}. With token: ...${token.slice(-30)}` );
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
        const me = game.registerSocketAndGetAgent( id, name, socket );
    
        

        /**
         * on Disconnect
         */
        socket.on( 'disconnect', () => {

            const tokenToSockets = game.idToAgentAndSockets;

            console.log( `Socket ${socket.id} disconnected from agent ${me.name}(${me.id})` );
            tokenToSockets.get( id ).sockets.delete( socket );
    
            if ( tokenToSockets.get( id ).sockets.size == 0 ) {
                new Promise( res => setTimeout(res, AGENT_TIMEOUT) ).then( () => {
                    if ( tokenToSockets.get( id ) && tokenToSockets.get( id ).sockets.size == 0 ) {
                        console.log( `Agent ${me.name}(${me.id}) deleted after 10 seconds of no connections from token ...${token.slice(-30)}` );
                        game.grid.deleteAgent ( me );
                        // tokenToSockets.delete( id );
                    }
                } );
            }

        });

        return me;
    
    }

}

module.exports = AuthenticationUnique