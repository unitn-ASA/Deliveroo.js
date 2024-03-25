const { Server, Namespace } = require('socket.io');
const Match = require('./deliveroo/Match')
const myClock = require('./deliveroo/Clock');
const Config = require('./deliveroo/Config');
const jwt = require('jsonwebtoken');
const Arena = require('./deliveroo/Arena');
const Agent = require('./deliveroo/Agent');
const Grid = require('./deliveroo/Grid');
const Leaderboard = require('./deliveroo/Leaderboard');



/**
 * @typedef { { me:{id,name,team,x,y}, agents:[{id,name,team,x,y,score}], parcels:[{x,y,type}] } } Status
 */

const SUPER_SECRET = process.env.SUPER_SECRET || 'default_token_private_key';



class ioServer {

    /** @type {Config} */
    #config = new Config();

    /** @type {Server} */
    #io;

    constructor( httpServer ) {
        
        const defaultMatch = Arena.getOrCreateMatch( { id: 0 } ); // with default config
        defaultMatch.startStop();
        
        /**
         * Server Socket.IO
         */
        const io = this.#io = new Server( httpServer, {
            cors: {
                origin: ['http://localhost:5173'], // http://localhost:3000",
                // origin: (_req, callback) => {
                //     callback(null, true);
                // },
                credentials: true,
                allowedHeaders: ["x-token", "*"],
                methods: ["GET", "POST"]
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
         * Listen to match namespaces
         * https://socket.io/docs/v4/server-api/#namespace
         */
        const parentNamespace = io.of( (name, auth, next) => {
            // console.log( `Check match namespace ${name}` ); // name includes the '/'. Can be accessed through socket.nsp.name.
            next(null, true); // or false, when the creation is denied
        }).on('connection', async (socket) => {

            const id = socket.request.user.id;
            const name = socket.request.user.name;
            const teamId = socket.request.user.teamId;
            const teamName = socket.request.user.teamName;
            const token = socket.request.user.token;
            const matchTitle = ( socket.nsp.name != '/null' && socket.nsp.name != '/' ? socket.nsp.name.split('/').pop() : 0 );

            // if the socket try to connect to a match that does not exist, we block the connection 
            if (!Arena.getMatch( matchTitle )) {
                console.log( `/${matchTitle}/${name}-${id}-${teamName} connection refused, match does not exist.` );
                socket.disconnect();
                return;
            }

            console.log( `/${matchTitle}/${name}-${id}-${teamName} connecting from socket ${socket.id}, with token ...${token.slice(-30)}` );
            
            await socket.join("team:"+teamId);
            await socket.join("agent:"+id);
            const matchRoom = socket.nsp.in("match:"+matchTitle);
            const teamRoom = socket.nsp.in("team:"+teamId);
            const agentRoom = socket.nsp.in("agent:"+id);

            const match = Arena.getOrCreateMatch( { id: matchTitle } ); // with default config
            const me = match.getOrCreateAgent( socket.request.user );

            // let socketsInAgentRoom = await agentRoom.fetchSockets();
            // console.log( socketsInAgentRoom.length, 'sockets in room', "agent:"+id, "at", matchTitle)

            ioServer.listenToGameEventsAndForwardToSocket( me, match, socket, agentRoom, teamRoom, matchRoom );
            ioServer.listenSocketEventsAndForwardToGame( me, match, socket, agentRoom, teamRoom, matchRoom );

            /**
             * on Disconnect
             */
            socket.on( 'disconnect', async (cause) => {
                
                // if the disconection is occured becouse the match is ended
                if (cause === 'server namespace disconnect') {
                    console.log( `/${match.id}/${me.name}-${me.team}-${me.id} Socket disconnected. Match ended.` );
                    return;
                }

                try{

                    let socketsLeft = (await agentRoom.fetchSockets()).length;
                    console.log( `/${match.id}/${me.name}-${me.team}-${me.id} Socket disconnected.`,
                        socketsLeft ?
                        `Other ${socketsLeft} connections to the agent.` :
                        `No other connections, agent will be removed in ${this.#config.AGENT_TIMEOUT/1000} seconds.`
                    );
                    if ( socketsLeft == 0 && match.grid.getAgent(me.id) ) {
                        
                        // console.log( `/${match.id}/${me.name}-${me.team}-${me.id} No connection left. In ${this.#config.AGENT_TIMEOUT/1000} seconds agent will be removed.` );
                        await new Promise( res => setTimeout(res, this.#config.AGENT_TIMEOUT) );
                        
                        // if in this 10 seconds the match end we stop the action
                        if(match.status == 'end'){/*console.log('interrupt action, match ended')*/; return}

                        let socketsLeft = (await agentRoom.fetchSockets()).length;
                        if ( socketsLeft == 0 && match.grid.getAgent(me.id) ) {
                            console.log( `/${match.id}/${me.name}-${me.team}-${me.id} Agent deleted after ${this.#config.AGENT_TIMEOUT/1000} seconds of no connections` );
                            match.grid.deleteAgent ( me );
                        };
                    }

                } catch (error) {
                    console.log('Error in the disconection of socket ', socket.id, ' -> ', error);
                }
                
            });
            
        });

        /**
         * Broadcast server log
         */
        const oldLog = console.log;
        console.log = function ( ...message ) {
            io.emit( 'log', {src: 'server', timestamp: myClock.ms}, ...message );
            oldLog.apply( console, message );
        };

    }



    /**
     * @function listenToGameEventsAndForwardToSocket
     * @param {Agent} me
     * @param {Match} match
     * @param {Socket} socket
     * @param {BroadcastOperator} agentRoom
     * @param {BroadcastOperator} teamRoom
     * @param {BroadcastOperator} matchRoom
     */
    static listenToGameEventsAndForwardToSocket ( me, match, socket, agentRoom, teamRoom, matchRoom ) {

        const grid = match.grid;

        /**
         * Config
         */
        if ( me.name == 'god' ) { // 'god' mod
            me.config.PARCELS_OBSERVATION_DISTANCE = 'infinite'
            me.config.AGENTS_OBSERVATION_DISTANCE = 'infinite'
        }
        socket.emit( 'config', me.config )
        
        //Emit map (tiles)
        grid.on( 'tile', ({x, y, delivery, blocked, parcelSpawner}) => {
            // console.log( 'emit tile', x, y, delivery, parcelSpawner );
            if (!blocked)
                socket.emit( 'tile', x, y, delivery, parcelSpawner );
            else
                socket.emit( 'not_tile', x, y );
        } );

        let tiles = []
        for (const {x, y, delivery, blocked, parcelSpawner} of grid.getTiles()) {
            if ( !blocked ) {
                socket.emit( 'tile', x, y, delivery, parcelSpawner )
                tiles.push( {x, y, delivery, parcelSpawner} )
            } else
                socket.emit( 'not_tile', x, y );
        }
        let {width, height} = grid.getMapSize()
        socket.emit( 'map', width, height, tiles )


        //Emit you
        me.on( 'agent', ({id, name, teamId, teamName, x, y, score}) => {       
            //console.log("Dati agent 1: ", id, name, teamId, teamName, x, y, score)
            socket.emit( 'you', id, name, teamId, teamName, x, y, score );
        } );
        
        //console.log("Dati agent 2: ", me.id, me.name, me.teamId, me.teamName, me.x, me.y, me.score)
        socket.emit( 'you', me.id, me.name, me.teamId, me.teamName, me.x, me.y, me.score );

        // passo le informazione dei punteggi di tutti i team ed agent per la leaderboard, anche eventuali delet
        // this.on('agent info', (id, name, team, score) => {
        //     socket.emit("agent info", id, name, team, score)
        // })
        // this.on('team info', (name, score) => {
        //     socket.emit("team info", name, score)
        // })
        grid.on('agent deleted', ( who ) => {
            // console.log("Agent ", who.name + " deleted")
            // if(who.team && this.#teamsAgents.has(who.team)){
            //     this.#teamsAgents.get(who.team).removeAgent(who.id)
            // }
            socket.emit("agent deleted", who.id, who.team)
        })

        socket.emit("timer update", match.timer.remainingTime)
        grid.on('timer update', (time) => {
            socket.emit("timer update", time)
        })

        grid.on('match ended', async () => {
            socket.emit("match ended")
        })

        grid.on('disconect socket', async (disconnectionPromise) =>{
            await socket.disconnect();
            disconnectionPromise; 
        })
       
        // this.on('team deleted', (name)=>{
        //     // console.log("Team ", name + " deleted")
        //     socket.emit("team deleted", name)
        // })

              

        /**
         * Emit sensing
         */

        // Parcels
        me.on( 'parcels sensing', (parcels) => {
            // console.log('emit parcels sensing', ...parcels);
            socket.emit('parcels sensing', parcels )
        } );
        me.emitParcelSensing();

        // Agents
        me.on( 'agents sensing', (agents) => {
            // console.log('emit agents sensing', ...agents); // {id, name, x, y, score}
            socket.emit( 'agents sensing', agents );
        } );
        me.emitAgentSensing();

        /**
         * GOD mod
         */
        if ( me.name == 'god' ) {

            socket.on( 'create parcel', async (x, y) => {
                console.log( 'create parcel', x, y )
                grid.createParcel(x, y)
            } );

            socket.on( 'dispose parcel', async (x, y) => {
                console.log( 'dispose parcel', x, y )
                let parcels = Array.from(grid.getParcels()).filter( p => p.x == x && p.y == y );
                for ( p of parcels)
                    grid.deleteParcel( p.id )
                grid.emit( 'parcel' );
            } );

            socket.on( 'tile', async (x, y) => {
                console.log( 'create/dispose tile', x, y )
                let tile = grid.getTile(x, y)
                
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
        grid.on( 'agent rewarded', async (agent, reward) => {
            //console.log('CHIAMATA REWARD')
            let matchId = match.id
            let agentId = agent.id
            let dataAgent = ( await Leaderboard.get({matchId, agentId}, ['agentId']) )[0]
            let dataTeam;

            if(agent.teamName != 'no-team'){
                //console.log('team:' , agent.teamName)
                let teamId = agent.teamId
                dataTeam = ( await Leaderboard.get({matchId, teamId}, ['teamId']) )[0];
            }

            //console.log('agent reWard, agent id: ', agent.id + " -> ", dataAgent[0])
            //console.log('team reWard:' , dataTeam)

            socket.emit( 'leaderboard', dataAgent, dataTeam );
        });

    }



    /**
     * @function listenSocketEventsAndForwardToGame
     * @param {Agent} me
     * @param {Match} match
     * @param {Socket} socket
     * @param {BroadcastOperator} agentRoom
     * @param {BroadcastOperator} teamRoom
     * @param {BroadcastOperator} matchRoom
     */
    static listenSocketEventsAndForwardToGame ( me, match, socket, agentRoom, teamRoom, matchRoom ) {
        
        
        /**
         * Actions
         */
        
        socket.on('move', async (direction, acknowledgementCallback) => {

            // Check if the match is STOP status
            if( match.status == Match.Status.STOP ) {
                console.log( `/${match.id}/${me.name}-${me.id}-${me.teamName} Cannot move, match is in STOP` );
                if ( acknowledgementCallback )
                    acknowledgementCallback( 'Match is in STOP' );
                return;
            };

            // console.log( `${match.id}/${me.name}-${me.id}-${me.teamName}`, me.x, me.y, direction );
            try {
                const moving = me[direction]();
                if ( acknowledgementCallback )
                    acknowledgementCallback( await moving ); //.bind(me)()
            } catch (error) { console.error(direction, 'is not a method of agent'); console.error(error) }
        });

        socket.on('pickup', async (acknowledgementCallback) => {

            // Check if the match is STOP status
            if( match.status == Match.Status.STOP ) {
                console.log( `/${match.id}/${me.name}-${me.id}-${me.teamName} Cannot pickup, match is in STOP` );
                if ( acknowledgementCallback )
                    acknowledgementCallback( 'Match is in STOP' );
                return;
            };

            const picked = await me.pickUp()
            
            console.log( `${matchRoom.name}/${me.name}-${me.id}-${me.teamName} pickup ${picked.length} parcels` );
            
            if ( acknowledgementCallback )
                try {
                    acknowledgementCallback( picked )
                } catch (error) { console.error(error) }
        });

        socket.on('putdown', async (selected, acknowledgementCallback) => {

            // Check if the match is STOP status
            if( match.status == Match.Status.STOP ) {
                console.log( `/${match.id}/${me.name}-${me.id}-${me.teamName} Cannot putdown, match is in STOP` );
                if ( acknowledgementCallback )
                    acknowledgementCallback( 'Match is in STOP' );
                return;
            };

            const {dropped, reward} = await me.putDown( selected );

            console.log( `${matchRoom.name}/${me.name}-${me.id}-${me.teamName} putdown ${dropped.length} parcels (+ ${reward} pti -> ${me.score} pti)` );
            
            if ( acknowledgementCallback )
                try {
                    acknowledgementCallback( dropped )
                } catch (error) { console.error(error) }
        });



        /**
         * Communication
         */

        socket.on( 'say', (toId, msg, acknowledgementCallback) => {
            
            console.log( `${matchRoom.name}/${me.name}-${me.id}-${me.teamName}`, 'say ', toId, msg );

            matchRoom
            .in("agent:"+toId)
            .emit( 'msg', me.id, me.name, me.teamId, msg );

            try {
                if (acknowledgementCallback) acknowledgementCallback( 'successful' )
            } catch (error) { console.log( me.id, 'acknowledgement of \'say\' not possible' ) }

        } )

        socket.on( 'ask', (toId, msg, replyCallback) => {
            console.log( `${matchRoom.name}/${me.name}-${me.id}-${me.teamName}`, 'ask', toId, msg );

            matchRoom
            .in("agent:"+toId)
            .emit( 'msg', me.id, me.name, me.teamId, msg, (reply) => {
                try {
                    console.log( toId, 'replied', reply );
                    replyCallback( reply )
                } catch (error) { console.log( me.id, 'error while trying to acknowledge reply' ) }
            } );

        } )

        socket.on( 'shout', (msg, acknowledgementCallback) => {

            console.log( `${matchRoom.name}/${me.name}-${me.id}-${me.teamName}`, 'shout', msg );

            matchRoom
            .emit( 'msg', me.id, me.name, msg );

            try {
                if (acknowledgementCallback) acknowledgementCallback( 'successful' )
            } catch (error) { console.log( me.id, 'acknowledgement of \'shout\' not possible' ) }
            
        } )


        
        /**
         * Path
         */
        
        socket.on( 'path', ( path ) => {
            agentRoom.emit( 'path', path );
        } )


        
        /**
         * Bradcast client log
         */
        socket.on( 'log', ( ...message ) => {
            matchRoom.emit( 'log', {src: 'client', timestamp: myClock.ms, socket: socket.id, id: me.id, name: me.name}, ...message )
        } )




        socket.on( 'draw', async (bufferPng) => {
            // console.log( 'draw' );
            
            matchRoom
            .in("agent:"+toId)
            .emit( 'draw', {src: 'client', timestamp: myClock.ms, socket: socket.id, id: me.id, name: me.name}, bufferPng );
            
        } );

    }


}



module.exports = ioServer;