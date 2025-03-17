import { ref, reactive, shallowReactive, watch, computed } from "vue";
import { default as io, Socket } from 'socket.io-client';
import ioClientSocket from "../../packages/@unitn-asa/deliveroo-js-client/lib/ioClientSocket.js";
import { connection } from "./states/myConnection.js";



/**
 * @typedef Tile
 * @type {{
*         x: number,y: number,
*         type: string,
*         mesh?: import('three').Mesh,
*         hoovered?: boolean,
*         selected?: boolean,
*         perceivingAgents?: import('vue').ComputedRef<boolean>,
*         perceivingParcels?: import('vue').ComputedRef<boolean>
* }}
*/

/**
 * @typedef Agent
 * @type {{id: string,
*         name: string,
*         teamId: string
*         teamName: string,
*         x: number,y: number,
*         score: number,
*         penalty: number,
*         carrying?: Array<string>,
*         mesh?: import('three').Mesh,
*         opacity?: number,
*         status?: string,
*         hoovered?: boolean,
*         selected?: import('vue').ComputedRef<boolean>
* }}
*/

/**
 * @typedef Parcel
 * @type {{id:string,
*         x:number,y:number,
*         reward:number,
*         carriedBy?:string,
*         mesh?: import('three').Mesh,
*         hoovered?: boolean,
*         selected?: boolean
* }}
*/



export class Grid {

    /**
     * @type {ioClientSocket} socket
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

    /** @type {number} */
    width = 0;
    /** @type {number} */
    height = 0;

    /**
     * @type {Map<number,Tile>} tiles
     */
    tiles = reactive (new Map());

    /** @type {function(number,number):Tile} */
    getTile (x, y) {
        if ( !this.tiles.has(x + y*1000) ) {
            this.tiles.set( x + y*1000, {
                x,
                y,
                type: '0',
                hoovered: false,
                selected: false,
                perceivingAgents: computed( () => {
                    return ( Math.abs( this.me.value.x - x ) + Math.abs( this.me.value.y - y ) < this.configs.AGENTS_OBSERVATION_DISTANCE ) ? true : false;
                } ),
                perceivingParcels: computed( () => {
                    return ( Math.abs( this.me.value.x - x ) + Math.abs( this.me.value.y - y ) < this.configs.PARCELS_OBSERVATION_DISTANCE ) ? true : false;
                } )
            } );
        }
        return this.tiles.get( x + y*1000 );
    }

    /** 
     * @type {import("vue").Ref<Agent>}
     **/
    me = ref(null);

    /**
     * @type {Map<string,Agent>} agents
     */
    agents = reactive ( new Map() );

    /**
     * @param {string} id
     * @returns {Agent}
     */
    getOrCreateAgent ( id ) {
        // console.error( 'Grid.js getOrCreateAgent', id );
        var agent = this.agents.get(id);
        if ( ! agent ) {    
            agent = {
                id,
                name:'unknown',
                teamId:'unknown',
                teamName:'unknown',
                x: undefined, y: undefined, score: -1, penalty: 0,
                carrying: new Array(),
                hoovered: false,
                selected: computed({
                    get: () => this.selectedAgent.value?.id == id,
                    set: (value) => (value ? this.selectedAgent.value = agent : this.selectedAgent.value = undefined)
                })
            };
            this.agents.set( id, agent );
            // console.log('Grid.js getOrCreateAgent added agent', agent.id)
        }
        return agent;
    }

    /**
     * @type {Map<string,Parcel>} parcels
     */
    parcels = reactive (new Map());

    /**
     * @param {string} id
     * @returns {Parcel}
     */
    getOrCreateParcel ( id ) {
        // console.debug( 'Grid.js getOrCreateParcel', id );
        var parcel = this.parcels.get(id);
        if ( ! parcel ) {
            parcel = {id, x:-1, y:-1, carriedBy:null, reward:-1};
            this.parcels.set( id, parcel );
        }
        return parcel;
    }

    /**
     * @type {(x:number,y:number)=>Array<Parcel>}
     */
    getParcelsAt ( x, y ) {
        return Array.from(this.parcels.values()).filter( parcel => parcel.x == x && parcel.y == y && parcel.carriedBy == null );
    }



    /** @type {import("vue").Ref<Agent|Tile|Parcel>} */
    hoovered = ref();

    /** @type {import("vue").Ref<Tile>} */
    selectedTile = ref();

    /** @type {import("vue").Ref<Agent>} */
    selectedAgent = ref();

    /** @type {import("vue").Ref<Parcel>} */
    selectedParcel = ref();

    /**
	 * @type {function(import('three').Mesh):Agent|Tile|Parcel}
	 */
	getByMesh ( mesh ) {
        // console.log( 'Grid.js getByMesh', mesh, this.agents.values() );
        let byMesh = Array.from(this.agents.values()).find( agent => agent.mesh == mesh )
                    || Array.from(this.tiles.values()).find( tile => tile.mesh == mesh )
                    || Array.from(this.parcels.values()).find( parcel => parcel.mesh == mesh );
		return byMesh;
	}

    hooverByMesh ( mesh ) {
        // console.log( 'Grid.js hooverByMesh', mesh );
        let byMesh = this.getByMesh( mesh );
        if ( byMesh?.hoovered ) return; // already hoovered, return
        if ( this.hoovered.value ) this.hoovered.value.hoovered = false; // unhoover previous
        this.hoovered.value = this.getByMesh( mesh ); // set newly hoovered
        if ( this.hoovered.value ) this.hoovered.value.hoovered = true; // hoover new
    }

    selectByMesh ( mesh ) {

        function setSelected ( s, ref ) {
            if ( s && s.selected ) {
                s.selected = false;
                ref.value = undefined;
            } else if ( s && ! s.selected ) {
                if ( ref.value ) ref.value.selected = false;
                ref.value = s;
                if ( ref.value ) ref.value.selected = true;
            }
        }

        let agent = Array.from(this.agents.values()).find( agent => agent.mesh == mesh )
        this.selectedAgent.value = this.selectedAgent.value == agent ? undefined : agent;
        if ( agent ) return;
        
        let tile = Array.from(this.tiles.values()).find( tile => tile.mesh == mesh )
        setSelected( tile, this.selectedTile );
        if ( tile ) return;

        let parcel = Array.from(this.parcels.values()).find( parcel => parcel.mesh == mesh )
        setSelected( parcel, this.selectedParcel );
        if ( parcel ) return;
        
    }

    /**
     * Socket constructor
     * @param {ioClientSocket} socket
     */
    constructor ( socket ) {

        // watch ( this.hoovered, ( current, old ) => {
        //     if ( current != old ) {
        //         if ( current ) {
        //             current.hoovered = true;
        //         }
        //         if ( old ) {
        //             old.hoovered = false;
        //         }
        //     }
        // } );

        // function updateSelected ( current, old ) {
        //     if ( old ) {
        //         old.selected = false;
        //         // old.mesh?.scale.set( 1, 1, 1 );
        //     }
        //     if ( current ) {
        //         current.selected = true;
        //         // current.mesh?.scale.set( 1.5, 1.5, 1.5 );
        //     }
        // }
        
        // watch ( this.selectedTile, updateSelected);
        // watch ( this.selectedAgent, updateSelected);
        // watch ( this.selectedParcel, updateSelected);

        this.socket = socket;
        
        // socket.on( 'not_tile', (x, y) => {
        //     this.getTile(x, y).type = 0;
        //     // this.tiles.delete( x + y*1000 ); // delete to avoid blocks from old maps
        // });

        socket.on( "tile", ({x, y, type}, {ms, frame}) => {
            // console.log( 'Grid.js tile', x, y, type );
            this.getTile(x, y).type = type;
            // if ( delivery )
            //     this.getTile(x, y).type = 2;
            // else if ( parcelSpawner )
            //     this.getTile(x, y).type = 1;
            // else
            //     this.getTile(x, y).type = 3;
        });

        socket.on( "map", (width, height, tiles) => {
            // console.log( 'Grid.js map: width', width, 'height', height );
            this.width = width;
            this.height = height;
        });

        // let PARCELS_OBSERVATION_DISTANCE;
        // let AGENTS_OBSERVATION_DISTANCE;

        // this.socket.on( "config", ( config ) => {
        //     PARCELS_OBSERVATION_DISTANCE = config.PARCELS_OBSERVATION_DISTANCE;
        //     AGENTS_OBSERVATION_DISTANCE = config.AGENTS_OBSERVATION_DISTANCE;
        // } )

        this.socket.on( "you", ( { id, name, teamId, teamName, x, y, score, penalty }, clock ) => {
            // console.log( "Grid.js socket.on(you)", id, name, teamId, teamName, x, y, score, clock )

            this.clock.ms = clock.ms;
            this.clock.frame = clock.frame;

            let me = this.me.value = this.getOrCreateAgent( id );
            me.name = name;
            me.teamId = teamId;
            me.teamName = teamName;
            me.x = x
            me.y = y
            me.score = score
            me.penalty = penalty

            // // when arrived
            // if ( x % 1 == 0 && y % 1 == 0 ) {
            //     for ( var tile of this.tiles.values() ) {
            //         var distance = Math.abs(x-tile.x) + Math.abs(y-tile.y);
            //         let opacity = 0.1;
            //         if ( !( distance >= PARCELS_OBSERVATION_DISTANCE ) ) opacity += 0.2;
            //         if ( !( distance >= AGENTS_OBSERVATION_DISTANCE ) ) opacity += 0.2;
            //         tile.opacity = ( opacity > 0.4 ? 1 : opacity );
            //     }
            // } else { // when moving
            //     // me.animateMove(x, y)
            // }

            //updateLeaderboard( me );

        });

        socket.on( "controller", ( action, {id, name, teamId, teamName, score} ) => {
            // console.log( "Grid.js socket.on(agent", action, agent )
            var agent = this.getOrCreateAgent( id );
            agent.name = name;
            agent.teamId = teamId;
            agent.teamName = teamName;
            agent.score = score;
            agent.status = action == 'connected' ? "online" : "offline";
        });
        // this.socket.on( "agent disconnected", (agent) => {
        //     // console.log( "Grid.js socket.on(agent disconnected)", agent )
        //     this.getOrCreateAgent(agent.id).status = "offline";
        // });


        socket.on("agents sensing", (sensedReceived, clock) => {

            //console.log("agents sensing", ...sensed)//, sensed.length)

            this.clock.ms = clock.ms;
            this.clock.frame = clock.frame;

            var sensed = Array.from(sensedReceived)
            
            var sensed_ids = sensed.map( ({id}) => id )
            for ( const [id, agent] of this.agents.entries() ) {
                if ( id != this.me.value.id && ! sensed_ids.includes( id ) ) {
                    // agent.opacity = 0;
                    // this.agents.delete( agent.id );
                    if ( agent.status == 'online' ) agent.status = 'out of range';
                }
            }

            for ( const sensed_agent of sensed ) {
                const {id, name, teamId, teamName, x, y, score, penalty} = sensed_agent;
                var agent = this.getOrCreateAgent( id )
                agent.name = name;
                agent.teamId = teamId
                agent.teamName = teamName;
                agent.x = x;
                agent.y = y;
                agent.score = score;
                agent.penalty = penalty;
                agent.opacity = 1;
                agent.status = 'online';
            }

        });

        socket.on("parcels sensing", (sensedReceived, clock) => {

            // console.log("parcels sensing", ...sensed)//, sensed.length)

            this.clock.ms = clock.ms;
            this.clock.frame = clock.frame;

            var sensed = Array.from(sensedReceived)

            var sensed_ids = sensed.map( ({id}) => id )
            for ( const [id, was] of this.parcels.entries() ) {
                if ( ! sensed_ids.includes( was.id ) ) {
                    // console.log('no more sensing parcel', knownId)
                    this.parcels.delete( was.id );
                    if ( was.carriedBy ) {
                        var agent = this.getOrCreateAgent( was.carriedBy );
                        // agent.carrying.delete( id );
                        agent.carrying.splice( agent.carrying.indexOf(id), 1 );
                    }
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
                        agent.carrying.splice( agent.carrying.indexOf(id), 1 );
                    }
                    if ( carriedBy ) {
                        var agent = this.getOrCreateAgent( carriedBy );
                        agent.carrying.push( id );
                    }
                    was.carriedBy = carriedBy;
                }

            }

        });

    }

}
