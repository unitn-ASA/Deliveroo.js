import { ref, reactive, shallowReactive } from "vue";
import { default as io, Socket } from 'socket.io-client';

export class Grid {

    /**
     * @type {Socket} socket
     */
    socket;

    /**
     * @type {Object} configs
     */
    configs = shallowReactive ({});

    /** @type {{ms:number,frame:number}} */
    clock = {
        ms: 0,
        frame: 0
    };

    /**
     * @typedef Tile
     * @type {{
     *         x: number,y: number,
     *         type:number,
     *         mesh?: import('three').Mesh
     * }}
    */
    /**
     * @type {Map<number,Tile>} tiles
     */
    tiles = reactive (new Map());

    /** @type {function(number,number):Tile} */
    getTile (x, y) {
        if ( !this.tiles.has(x + y*1000) ) {
            this.tiles.set( x + y*1000, {x, y, type: 0, opacity:1} );
        }
        return this.tiles.get( x + y*1000 );
    }

    /**
     * @typedef Agent
     * @type {{id: string,
     *         name: string,
     *         teamId: string
     *         teamName: string,
     *         x: number,y: number,
     *         score: number,
     *         opacity?: number,
     *         carrying?: Set<string>,
     *         mesh?: import('three').Mesh
     * }}
     */

    /** 
     * @type {import("vue").Ref<Agent>}
     **/
    me = ref('not known yet');

    /**
     * @type {Map<string,Agent>} agents
     */
    agents = reactive ( new Map() );

    /**
     * @param {string} id
     * @returns {Agent}
     */
    getOrCreateAgent ( id ) {
        var agent = this.agents.get(id);
        if ( ! agent ) {    
            agent = {id, name:'unknown', teamId:'unknown', teamName:'unknown',
                x: -1, y: -1, score: -1, opacity: 1, carrying: new Set()
            };
            this.agents.set( id, agent );
            // console.log('Grid.js getOrCreateAgent added agent', agent.id)
        }
        return agent;
    }

    /**
     * @typedef Parcel
     * @type {{id:string,
     *         x:number,y:number,
     *         reward:number,
     *         carriedBy?:string,
    *         mesh?: import('three').Mesh
     * }}
     */

    /**
     * @type {Map<string,Parcel>} parcels
     */
    parcels = reactive (new Map());

    /**
     * @param {string} id
     * @returns {Parcel}
     */
    getOrCreateParcel ( id ) {
        var parcel = this.parcels.get(id);
        if ( ! parcel ) {
            parcel = {id, x:-1, y:-1, carriedBy:null, reward:-1};
            this.parcels.set( id, parcel );
        }
        return parcel;
    }

    /**
     * Socket constructor
     * @param {Socket} socket
     */
    constructor ( socket ) {

        this.socket = socket;
        
        socket.on( 'not_tile', (x, y) => {
            this.getTile(x, y).type = 0;
        });

        socket.on( "tile", (x, y, delivery, parcelSpawner) => {
            if ( delivery )
                this.getTile(x, y).type = 2;
            else if ( parcelSpawner )
                this.getTile(x, y).type = 1;
            else
                this.getTile(x, y).type = 3;
        });

        socket.on( "map", (width, height, tiles) => {
            console.log( 'Grid.js map: width', width, 'height', height );
        });

        let PARCELS_OBSERVATION_DISTANCE;
        let AGENTS_OBSERVATION_DISTANCE;

        this.socket.on( "config", ( config ) => {
            PARCELS_OBSERVATION_DISTANCE = config.PARCELS_OBSERVATION_DISTANCE;
            AGENTS_OBSERVATION_DISTANCE = config.AGENTS_OBSERVATION_DISTANCE;
        } )

        this.socket.on( "you", ( { id, name, teamId, teamName, x, y, score }, clock ) => {
            // console.log( "Grid.js socket.on(you)", id, name, teamId, teamName, x, y, score, clock )

            this.clock.ms = clock.ms;
            this.clock.frame = clock.frame;

            let me = this.getOrCreateAgent( id );
            if ( me.name != name ) {
                me.name = name;
                me.teamId = teamId;
                me.teamName = teamName;
                this.me.value = me
            }
            this.me.value.x = x
            this.me.value.y = y
            this.me.value.score = score

            // when arrived
            if ( x % 1 == 0 && y % 1 == 0 ) {
                for ( var tile of this.tiles.values() ) {
                    var distance = Math.abs(x-tile.x) + Math.abs(y-tile.y);
                    let opacity = 0.1;
                    if ( !( distance >= PARCELS_OBSERVATION_DISTANCE ) ) opacity += 0.2;
                    if ( !( distance >= AGENTS_OBSERVATION_DISTANCE ) ) opacity += 0.2;
                    tile.opacity = ( opacity > 0.4 ? 1 : opacity );
                }
            } else { // when moving
                // me.animateMove(x, y)
            }

            //updateLeaderboard( me );

        });

        socket.on("agents sensing", (sensedReceived) => {

            //console.log("agents sensing", ...sensed)//, sensed.length)

            var sensed = Array.from(sensedReceived)
            
            var sensed_ids = sensed.map( ({id}) => id )
            for ( const [id, agent] of this.agents.entries() ) {
                if ( id != this.me.value.id && ! sensed_ids.includes( id ) ) {
                    agent.opacity = 0;
                    this.agents.delete( agent.id );
                }
            }

            for ( const sensed_agent of sensed ) {
                const {id, name, teamId, teamName, x, y, score} = sensed_agent;
                var agent = this.getOrCreateAgent( id )
                agent.name = name;
                agent.teamId = teamId
                agent.teamName = teamName;
                agent.x = x;
                agent.y = y;
                agent.score = score;
                agent.opacity = 1;
            }

        });

        socket.on("parcels sensing", (sensedReceived) => {

            // console.log("parcels sensing", ...sensed)//, sensed.length)

            var sensed = Array.from(sensedReceived)

            var sensed_ids = sensed.map( ({id}) => id )
            for ( const [id, was] of this.parcels.entries() ) {
                if ( ! sensed_ids.includes( was.id ) ) {
                    // console.log('no more sensing parcel', knownId)
                    this.parcels.delete( was.id );
                }
            }

            for ( const {id, x, y, carriedBy, reward} of sensed ) {
                
                const was = this.getOrCreateParcel( id );
                was.x = x;
                was.y = y;
                was.reward = reward;

                if ( carriedBy != was.carriedBy ) {
                    if ( was.carriedBy ) {
                        var agent = this.getOrCreateAgent( was.carriedBy );
                        agent.carrying.delete( id );
                    }
                    if ( was.carriedBy ) {
                        var agent = this.getOrCreateAgent( was.carriedBy.id || carriedBy );
                        agent.carrying.add( id );
                    }
                    was.carriedBy = carriedBy;
                }

            }

        });

    }

}
