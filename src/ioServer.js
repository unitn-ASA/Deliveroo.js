const { Server, Namespace, BroadcastOperator, Socket } = require('socket.io');
const Room = require('./deliveroo/Room')
const myClock = require('./deliveroo/Clock');
const Config = require('./deliveroo/Config');
const jwt = require('jsonwebtoken');
const Arena = require('./deliveroo/Arena');
const Agent = require('./deliveroo/Agent');
const Grid = require('./deliveroo/Grid');



/**
 * @typedef { { me:{id,name,team,x,y}, agents:[{id,name,team,x,y,score}], parcels:[{x,y,type}] } } Status
 */

const SUPER_SECRET = process.env.SUPER_SECRET || 'default_token_private_key';



class ioServer {

    /** @type {Config} */
    #config = new Config();

    constructor( httpServer ) {
        
        const defaultRoom = Arena.createRoom(); // with default config
                
        /**
         * Server Socket.IO
         * @type {Server}
         */
        const io = new Server( httpServer, {
            cors: {
                origin: '*',
                credentials: false, // https://socket.io/docs/v4/handling-cors/#credential-is-not-supported-if-the-cors-header-access-control-allow-origin-is-
                allowedHeaders: ["x-token"]
            }
        } );

        /**
         * Check authorization token
         */
        io.engine.use( (req, res, next) => {
            const isHandshake = req._query.sid === undefined;
            if (!isHandshake) {
                return next();
            }
            // console.log( `Check token at Handshake` );
        
            var token = req.headers['x-token'];
        
            if (!token) {
                console.log( `Login failure. Token not provided.` );
                return next(new Error(`Login failure. Token not provided.`));
            }
            
            const socketId = req.id;
            jwt.verify(token, SUPER_SECRET, (err, decoded) => {
                //console.log(decoded);
                if (err) {
                    console.log( `Socket ${socketId} log in failure. Invalid token provided.` );
                } else if ( decoded.id && decoded.name ) {
                    const id = decoded.id
                    const name = decoded.name
                    const teamId = decoded.teamId || null;
                    const teamName = decoded.teamName || null;
                    req.user = { id, name, teamId, teamName, token };
                    // console.log( `Socket ${socketId} connecting as ${name}(${id}). With token: ...${token.slice(-30)}` );
                    next();
                }
                else {
                    console.log( `Socket ${socketId} log in failure. Token is verified but id or name are missing.` );
                }
            });

        } );

        /**
         * https://socket.io/docs/v4/namespaces/#dynamic-namespaces
         * It is possible to dynamically create namespaces.
         * The return value of the of() method is what we call the parent namespace,
         * from which you canregister middlewares.
         * You can have access to the new namespace in the connection event: socket.nsp.
         */
        const parentNamespace = io.of( (name, auth, next) => {

            // console.log( `Check match namespace ${name}` ); // name includes the '/'. Can be accessed through socket.nsp.name.
            const roomId = name.split('/').pop() || "0";

            // if room exists 
            if ( Arena.getRoom( roomId ) ) {
                next(null, true); // or false, when the creation is denied
            }
            else {
                console.log( `/${roomId} connection refused, room does not exist!` );
                return;
            }

        });

        /**
         * The middleware to parentNamespace will automatically be registered on each child namespace.
         */
        parentNamespace.on('connection', async (socket) => {

            const roomNamespace = socket.nsp; // Dynamically created namespace for the room
            const roomId = socket.nsp.name.split('/').pop() || "0";

            const id = socket.request.user.id;
            const name = socket.request.user.name;
            const teamId = socket.request.user.teamId;
            const teamName = socket.request.user.teamName;
            const token = socket.request.user.token;

            // // if room does not exist, socket is disconnected 
            // if(!Arena.getRoom( roomId )){
            //     console.log( `/${roomId}/${name}-${id}-${teamName} connection refused, match does not exist.` );
            //     socket.disconnect();
            //     return;
            // }

            console.log( `/${roomId}/${name}-${id}-${teamName} connecting from socket ${socket.id}, with token ...${token.slice(-30)}` );
            
            await socket.join("agent:"+id);
            await socket.join("team:"+teamId);
            const ioAgent = roomNamespace.in("agent:"+id);
            const ioTeam = roomNamespace.in("team:"+teamId);            
            
            const room = await Arena.getRoom( roomId );
            const me = room.getOrCreateAgent( socket.request.user );

            // let socketsInAgentRoom = await agentRoom.fetchSockets();
            // console.log( socketsInAgentRoom.length, 'sockets in room', "agent:"+id, "at", matchTitle)

            ioServer.listenToGameEventsAndForwardToSocket( me, room, socket, ioAgent, ioTeam, roomNamespace );
            ioServer.listenSocketEventsAndForwardToGame( me, room, socket, ioAgent, ioTeam, roomNamespace );
    
            /**
             * on Disconnect
             */
            socket.on( 'disconnect', async (cause) => {

                try{

                    let socketsLeft = (await ioAgent.fetchSockets()).length;
                    console.log( `/${room.id}/${me.name}-${me.teamName}-${me.id} Socket disconnected.`,
                        socketsLeft ?
                        `Other ${socketsLeft} connections to the agent.` :
                        `No other connections, agent will be removed in ${room.grid.config.AGENT_TIMEOUT/1000} seconds.`
                    );
                    if ( socketsLeft == 0 && room.grid.getAgent(me.id) ) {
                        
                        // console.log( `/${match.id}/${me.name}-${me.team}-${me.id} No connection left. In ${this.#config.AGENT_TIMEOUT/1000} seconds agent will be removed.` );
                        await new Promise( res => setTimeout(res, room.grid.config.AGENT_TIMEOUT) );
                        
                        let socketsLeft = (await ioAgent.fetchSockets()).length;
                        if ( socketsLeft == 0 && room.grid.getAgent(me.id) ) {
                            console.log( `/${room.id}/${me.name}-${me.teamName}-${me.id} Agent deleted after ${this.#config.AGENT_TIMEOUT/1000} seconds of no connections` );
                            room.grid.deleteAgent ( me );
                        };
                    }

                } catch (error) {
                    console.log('Error in the disconection of socket ', socket.id, ' -> ', error);
                }
                
            });
            
        });

        /* Broadcast server log */
        const oldLog = console.log;
        console.log = function ( ...message ) {
            io.emit( 'log', {src: 'server', timestamp: myClock.ms}, ...message );
            oldLog.apply( console, message );
        };

    }



    /**
     * @param {Agent} me
     * @param {Room} room
     * @param {Socket} socket 
     * @param {BroadcastOperator} ioAgent
     * @param {BroadcastOperator} ioTeam
     * @param {Namespace} ioRoom
     */
    static listenToGameEventsAndForwardToSocket ( me, room, socket, ioAgent, ioTeam, ioRoom ) {      
        
        /* Config */
        if ( me.name == 'god' ) { // 'god' mod
            me.config.PARCELS_OBSERVATION_DISTANCE = 'infinite'
            me.config.AGENTS_OBSERVATION_DISTANCE = 'infinite'
        }
        socket.emit( 'config', me.config )
        
        //Emit map (tiles)
        room.grid.on( 'tile', ({x, y, delivery, blocked, parcelSpawner}) => {
            // console.log( 'emit tile', x, y, delivery, parcelSpawner );
            if (!blocked) socket.emit( 'tile', x, y, delivery, parcelSpawner );
            else socket.emit( 'not_tile', x, y );
        } );

        let tiles = []
        for (const {x, y, delivery, blocked, parcelSpawner} of room.grid.getTiles()) {
            if ( !blocked ) {
                socket.emit( 'tile', x, y, delivery, parcelSpawner )
                tiles.push( {x, y, delivery, parcelSpawner} )
            } else
                socket.emit( 'not_tile', x, y );
        }
        let {width, height} = room.grid.getMapSize()
        socket.emit( 'map', width, height, tiles )


        //Emit you
        me.on( 'agent', ({id, name, teamId, teamName, x, y, score}) => {       
            //console.log("Dati agent 1: ", id, name, teamId, teamName, x, y, score)
            socket.emit( 'you', id, name, teamId, teamName, x, y, score );
        } );
        //console.log("Dati agent 2: ", me.id, me.name, me.teamId, me.teamName, me.x, me.y, me.score)
        socket.emit( 'you', me.id, me.name, me.teamId, me.teamName, me.x, me.y, me.score );

        room.grid.on('agent deleted', ( who ) => {
            // console.log("Agent ", who.name + " deleted")
            // if(who.team && this.#teamsAgents.has(who.team)){
            //     this.#teamsAgents.get(who.team).removeAgent(who.id)
            // }
            socket.emit("agent deleted", who.id, who.team)
        })

        
        // TIMER EVENT
        room.on('timer update', (time) => { socket.emit("timer update", time) })
        room.on('timer ended', () => { socket.emit("timer ended") })

              
        /* Emit sensing */
        // Parcels
        me.on( 'parcels sensing', (parcels) => {  // console.log('emit parcels sensing', ...parcels);
            socket.emit('parcels sensing', parcels )
        } );
        me.emitParcelSensing(room.grid);

        // Agents
        me.on( 'agents sensing', (agents) => {  // console.log('emit agents sensing', ...agents); // {id, name, x, y, score}
            socket.emit( 'agents sensing', agents );
        } );
        me.emitAgentSensing(room.grid);

        /* GOD mod */
        if ( me.name == 'god' ) {

            socket.on( 'create parcel', async (x, y) => {
                console.log( 'create parcel', x, y )
                room.grid.createParcel(x, y)
            } );

            socket.on( 'dispose parcel', async (x, y) => {
                console.log( 'dispose parcel', x, y )
                let parcels = Array.from(room.grid.getParcels()).filter( p => p.x == x && p.y == y );
                for ( let p of parcels)
                    room.grid.deleteParcel( p.id )
                room.grid.emit( 'parcel' );
            } );

            socket.on( 'tile', async (x, y) => {
                console.log( 'create/dispose tile', x, y )
                let tile = room.grid.getTile(x, y)
                
                if ( !tile ) return;
                
                if ( tile.blocked ) {
                    tile.delivery = false;
                    tile.parcelSpawner = true;
                    tile.unblock();
                } else if ( tile.parcelSpawner ) {
                    tile.delivery = true;
                    tile.parcelSpawner = false;
                } else if ( tile.delivery ) {
                    tile.delivery = false;
                    tile.parcelSpawner = false;
                } else {
                    tile.delivery = false;
                    tile.parcelSpawner = false;
                    tile.block();
                }
            } );

        }

        // Leaderboard
        room.on( 'match', (match) => {
            socket.emit( 'match', match );
        });
        
        // /* When the match is put on the server have to adise it to all the sockets in order to enable them to menage their leaderbord */
        // room.on('match on', () => { socket.emit('match on'); me.emitAgentSensing(room.grid)})
        // // at the connection time the server check if the match is on, if yes it advice the client to create the leaderbord
        // if(room.match.status == 'on'){ socket.emit('create leaderbord') } 
        // /* When the match is put off the server have to adise it to all the sockets in order to enable them to menage their leaderbord */
        // room.on('match off', () => { socket.emit('match off') })

        /* When the grid is changed*/
        room.on('changed grid', () => {
            socket.emit('changed grid');

            /* When the grid get freeze/unfreeze */
            room.grid.on('freeze', (state) => { socket.emit('grid update', state) });
            room.grid.on('unfreeze', (state) => { socket.emit('grid update', state) });
    
            /* when an agent score and the match is on the server notice the happen to the user sending 
            the update score so the user can update it leaderbords */
            room.grid.on( 'agent reward', async (agent) => {
                
                let agentId = agent.id
                let matchId = room.match.id
    
                // take the information of the score for the agent and its team
                let dataAgent = await Leaderboard.get({matchId, agentId})
                let dataTeam;
    
                // we try to read the score of the team only if the agent has a team
                if(agent.teamName != 'no-team'){
                    //console.log('team:' , agent.teamName)
                    let teamId = agent.teamId
                    dataTeam = ( await Leaderboard.get({matchId, teamId}, ['teamId']) )[0];
                }
    
                //console.log('agent reWard, agent id: ', agent.id + " -> ", dataAgent[0])
                //console.log('team reWard:' , dataTeam)
    
                socket.emit( 'leaderbord', dataAgent[0], dataTeam);
            });
        })

    }



    /**
     * @function listenSocketEventsAndForwardToGame
     * @param {Agent} me
     * @param {Room} room
     * @param {Socket} socket
     * @param {BroadcastOperator} ioAgent
     * @param {BroadcastOperator} ioTeam
     * @param {Namespace} ioRoom
     */
    static listenSocketEventsAndForwardToGame ( me, room, socket, ioAgent, ioTeam, ioRoom ) {
        
        const roomId = room.id;
        
        /**
         * Actions
         */
        socket.on('move', async (direction, acknowledgementCallback) => {

            // if the grid is freezed the agent can't move
            let errorFreezeLog =  `grid of the room: ${roomId} freezed, the agent can not move `
            if(room.grid.freezed) { 
                // console.log(errorFreezeLog); 
                if ( acknowledgementCallback )
                try { acknowledgementCallback(errorFreezeLog); } 
                catch (error) { console.error(error) }
                return
            };

            console.log( `/${room.id}/${me.name}-${me.teamName}-${me.id}`, me.x, me.y, direction );
            try {
                const moving = me[direction]();
                if ( acknowledgementCallback )
                    acknowledgementCallback( await moving ); //.bind(me)()
            } catch (error) { console.error(direction, 'is not a method of agent'); console.error(error) }
        });

        socket.on('pickup', async (acknowledgementCallback) => {

            // if the grid is freezed the agent can't move
            let errorFreezeLog =  `grid of the room: ${roomId} freezed, the agent can not pickup `
            if(room.grid.freezed) { 
                // console.log(errorFreezeLog); 
                if ( acknowledgementCallback )
                try { acknowledgementCallback(errorFreezeLog); } 
                catch (error) { console.error(error) }
                return
            };

            const picked = await me.pickUp()
            
            console.log( `/${roomId}/${me.name}-${me.teamName}-${me.id} pickup ${picked.length} parcels` );
            
            if ( acknowledgementCallback )
                try {
                    acknowledgementCallback( picked )
                } catch (error) { console.error(error) }
        });
        
        socket.on('putdown', async (selected, acknowledgementCallback) => {

            // if freezed return
            if ( room.grid.freezed ) {
                console.log( `/${roomId}/${me.name}-${me.teamName}-${me.id} room freezed` );
                return;
            };
            
            const {dropped, reward} = await me.putDown( selected );
            
            console.log( `/${roomId}/${me.name}-${me.teamName}-${me.id} putdown ${dropped.length} parcels (+ ${reward} pti -> ${me.score} pti)` );
            
            if ( acknowledgementCallback )
                try {
                    acknowledgementCallback( dropped )
                } catch (error) { console.error(error) }
        });



        /**
         * Communication
         */

        socket.on( 'say', (toId, msg, acknowledgementCallback) => {
            
            console.log( `${roomId}/${me.name}-${me.id}-${me.teamName}`, 'say ', toId, msg );

            ioRoom
            .in("agent:"+toId)
            .emit( 'msg', me.id, me.name, me.teamId, msg );

            try {
                if (acknowledgementCallback) acknowledgementCallback( 'successful' )
            } catch (error) { console.log( me.id, 'acknowledgement of \'say\' not possible' ) }

        } )

        socket.on( 'ask', (toId, msg, replyCallback) => {
            console.log( `${roomId}/${me.name}-${me.id}-${me.teamName}`, 'ask', toId, msg );

            ioRoom
            .in("agent:"+toId)
            .emit( 'msg', me.id, me.name, me.teamId, msg, (reply) => {
                try {
                    console.log( toId, 'replied', reply );
                    replyCallback( reply )
                } catch (error) { console.log( me.id, 'error while trying to acknowledge reply' ) }
            } );

        } )

        socket.on( 'shout', (msg, acknowledgementCallback) => {

            console.log( `${roomId}/${me.name}-${me.id}-${me.teamName}`, 'shout', msg );

            ioRoom.emit( 'msg', me.id, me.name, me.teamId, msg );

            try {
                if (acknowledgementCallback) acknowledgementCallback( 'successful' )
            } catch (error) { console.log( me.id, 'acknowledgement of \'shout\' not possible' ) }
            
        } )

  
        /**
         * Path
         */
        
        socket.on( 'path', ( path ) => {
            ioAgent.emit( 'path', path );
        } )


        /**
         * Bradcast client log
         */
        socket.on( 'log', ( ...message ) => {
            ioRoom.emit( 'log', {src: 'client', timestamp: myClock.ms, socket: socket.id, id: me.id, name: me.name}, ...message )
        } )

        socket.on( 'draw', async (bufferPng) => {
            // console.log( 'draw' );
            
            ioAgent
            .emit( 'draw', {src: 'client', timestamp: myClock.ms, socket: socket.id, id: me.id, name: me.name}, bufferPng );
            
        } );

    }


}



module.exports = ioServer;