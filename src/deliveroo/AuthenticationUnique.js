const jwt = require('jsonwebtoken');
const {generateToken,decodeToken} = require('./Token')

const AGENT_TIMEOUT = process.env.AGENT_TIMEOUT || 10000;

class AuthenticationUnique{

    authenticate ( match , socket ) {
    
        var id;
        var name;
        var team;
        var token = socket.handshake.headers['x-token'];
        // var team = socket.handshake.headers['team'];

    
        // No token provided, generate new one
        if ( !token || token=="" ) { // no token provided
            console.log(`Socket ${socket.id} log in failure. Token not provided.`)  
            return  
        }
        // Token provided
        else {
            try {
                // Verify and decode payload
                const decoded = decodeToken(token);
                if ( decoded.id && decoded.name) {
                    id = decoded.id
                    name = decoded.name
                    team = decoded.team || null
                    console.log( `Socket ${socket.id} connected as ${name}(${id}), team:${team}, to the match ${match.id}. With token: ...${token.slice(-30)}` );
                }
                else {
                    throw `Socket ${socket.id} log in failure. Token is verified but id or name ot team are missing.`
                }
                
            } catch(err) {

                console.log( `Socket ${socket.id} log in failure. Invalid token provided.` );
                socket.disconnect();
                return; // invalid token

            }
        }

        // Agent
        const me = match.registerSocketAndGetAgent( id, name, team, socket );
    
        

        /**
         * on Disconnect
         */
        socket.on( 'disconnect', () => {

            const tokenToSockets = match.idToAgentAndSockets;

            console.log( `Socket ${socket.id} disconnected from agent ${me.name}(${me.id})` );
            tokenToSockets.get( id ).sockets.delete( socket );
    
            if ( tokenToSockets.get( id ).sockets.size == 0 ) {
                new Promise( res => setTimeout(res, AGENT_TIMEOUT) ).then( () => {
                    if ( tokenToSockets.get( id ) && tokenToSockets.get( id ).sockets.size == 0 ) {
                        console.log( `Agent ${me.name}(${me.id}) deleted after 10 seconds of no connections from token ...${token.slice(-30)}` );
                        match.grid.deleteAgent ( me );
                        // tokenToSockets.delete( id );
                    }
                } );
            }

        });

        return me;
    
    }

}

module.exports = AuthenticationUnique