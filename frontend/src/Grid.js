import { ref, reactive, shallowReactive, watch, computed } from "vue";
import { default as io, Socket } from 'socket.io-client';
import { DjsClientSocket } from "@unitn-asa/deliveroo-js-sdk/client";
import { connection } from "./states/myConnection.js";

/** @typedef {import('./types/UIAgentType.js').UIAgent} UIAgent */
/** @typedef {import('./types/UITileType.js').UITile} UITile */
/** @typedef {import('./types/UIParcelType.js').UIParcel} UIParcel */

/** @typedef {import("@unitn-asa/deliveroo-js-sdk/types/IOInfo.js").IOInfo} IOInfo */



export class Grid {

    /**
     * @type {DjsClientSocket} socket
     */
    socket;

    /**
     * @type {Object} configs
     */
    configs = shallowReactive ({});

    /** @type {import("vue").Ref<IOInfo>} */
    info = ref();

    /** @type {number} */
    width = 0;
    /** @type {number} */
    height = 0;

    /**
     * @type {Map<number,UITile>} tiles
     */
    tiles = reactive (new Map());    /** @type {function(number,number):UITile} */
    
    getTile (x, y) {
        if ( !this.tiles.has(x + y*1000) ) {
            /** @type {UITile} */
            const newTile = {
                x,
                y,
                type: '0',
                hoovered: false,
                selected: false,
                perceivingAgents: false,
                perceivingParcels: false,
                // perceivingAgents: computed( () => {
                //     return ( Math.abs( this.me.value.x - x ) + Math.abs( this.me.value.y - y ) < this.configs.AGENTS_OBSERVATION_DISTANCE ) ? true : false;
                // } ),
                // perceivingParcels: computed( () => {
                //     return ( Math.abs( this.me.value.x - x ) + Math.abs( this.me.value.y - y ) < this.configs.PARCELS_OBSERVATION_DISTANCE ) ? true : false;
                // } )
            };
            this.tiles.set( x + y*1000, newTile );
        }
        return this.tiles.get( x + y*1000 );
    }

    /** 
     * @type {import("vue").Ref<UIAgent>}
     **/
    me = ref(null);

    /**
     * @type {Map<string,UIAgent>} agents
     */
    agents = reactive ( new Map() );

    /**
     * @param {string} id
     * @returns {UIAgent}
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
     * @type {(x:number,y:number)=>UIAgent}
     */
    getAgentAt ( x, y ) {
        return Array.from(this.agents.values()).find( agent => Math.round(agent.x) == x && Math.round(agent.y) == y );
    }

    /**
     * @type {Map<string,UIParcel>} parcels
     */
    parcels = reactive (new Map());

    /**
     * @param {string} id
     * @returns {UIParcel}
     */
    getOrCreateParcel ( id ) {
        // console.debug( 'Grid.js getOrCreateParcel', id );
        var parcel = this.parcels.get(id);
        if ( ! parcel ) {
            /** @type {UIParcel} */
            parcel = {id, x:-1, y:-1, carriedBy:null, reward:-1};
            this.parcels.set( id, parcel );
        }
        return parcel;
    }

    /**
     * @type {(x:number,y:number)=>Array<UIParcel>}
     */
    getParcelsAt ( x, y ) {
        return Array.from(this.parcels.values()).filter( parcel => parcel.x == x && parcel.y == y && parcel.carriedBy == null );
    }



    /** @type {import("vue").Ref<UIAgent|UITile|UIParcel>} */
    hoovered = ref();

    /** @type {import("vue").Ref<UITile>} */
    selectedTile = ref();

    /** @type {import("vue").Ref<UIAgent>} */
    selectedAgent = ref();

    /** @type {import("vue").Ref<UIParcel>} */
    selectedParcel = ref();

    /**
	 * @type {function(String):UIAgent}
	 */
	getAgentByMeshUUID ( uuid ) {
        return Array.from(this.agents.values()).find( agent => agent.mesh?.uuid == uuid );
	}
    /**
	 * @type {function(String):UIParcel}
	 */
	getParcelByMeshUUID ( uuid ) {
        return Array.from(this.parcels.values()).find( parcel => parcel.mesh?.uuid == uuid );
	}
    /**
     * @type {function(String):UITile}
    */
    getTileByMeshUUID ( uuid ) {
        return Array.from(this.tiles.values()).find( tile => tile.mesh?.uuid == uuid )
    }

    hooverByMesh ( mesh ) {
        // console.log( 'Grid.js hooverByMesh', mesh );
        /** @type {UIAgent|UIParcel|UITile|undefined} */
        let byMesh = this.getAgentByMeshUUID( mesh?.uuid ) || this.getParcelByMeshUUID( mesh?.uuid ) || this.getTileByMeshUUID( mesh?.uuid );
        if (byMesh && 'hoovered' in byMesh && byMesh.hoovered) return; // null or already hoovered, return
        if ( this.hoovered.value && 'hoovered' in this.hoovered.value ) this.hoovered.value.hoovered = false; // unhoover previous
        this.hoovered.value = byMesh; // set newly hoovered
        if ( this.hoovered.value && 'hoovered' in this.hoovered.value ) this.hoovered.value.hoovered = true; // hoover new
    }

    selectByMesh ( mesh ) {
        // console.log( 'Grid.js selectByMesh', mesh );        

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

        let agent = this.getAgentByMeshUUID( mesh?.uuid );
        this.selectedAgent.value = this.selectedAgent.value == agent ? undefined : agent;
        if ( agent ) return;

        let tile = this.getTileByMeshUUID( mesh?.uuid );
        setSelected( tile, this.selectedTile );
        if ( tile ) return;

        let parcel = this.getParcelByMeshUUID( mesh?.uuid );
        setSelected( parcel, this.selectedParcel );
        if ( parcel ) return;
        
    }

    /**
     * Socket constructor
     * @param {DjsClientSocket} socket
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

        socket.on( "tile", ({x, y, type}, {ms, frame, fps}) => {
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

        this.socket.on( "you", ( { id, name, teamId, teamName, x, y, score, penalty }, info ) => {
            // console.log( "Grid.js socket.on(you)", id, name, teamId, teamName, x, y, score, clock )

            this.info.value = info;

            let me = this.me.value = this.getOrCreateAgent( id );
            me.name = name;
            me.teamId = teamId;
            me.teamName = teamName;
            me.x = x
            me.y = y
            me.score = score
            me.penalty = penalty

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

        socket.on("agents sensing", (arrayOfSensing, info) => {

            // console.log("agents sensing", arrayOfSensing.filter( s => s.agent != undefined ).length, 'out of', arrayOfSensing.length, 'tiles' )

            this.info.value = info;

            // /** @type {IOSensing[]} */
            // var arrayOfSensing = Array.from(sensedReceived)
            
            // for all tiles on the grid, check if sensed and update 'perceivingAgents' flag
            for ( const tile of this.tiles.values() ) {
                let theSensing = arrayOfSensing.find( s => s.x == tile.x && s.y == tile.y );
                // let isMytile = ( tile.x == this.me.value.x && tile.y == this.me.value.y );
                // if ( sensing ) console.log('Grid.js agents sensing', tile.x, tile.y, isMytile?'(my tile)':'', tile.perceivingAgents?'already':'not yet', 'perceiving');
                tile.perceivingAgents = theSensing ? true : false;
            }

            // for all known agents on the grid, if not sensed set status in 'out of range'
            for ( const agent of this.agents.values() ) {
                if ( agent.id != this.me.value.id ) {
                    let sensedAgent = arrayOfSensing.find( s => s.agent?.id == agent.id );
                    if ( ! sensedAgent ) {
                        // agent.opacity = 0;
                        // this.agents.delete( agent.id );
                        if ( agent.status == 'online' ) agent.status = 'out of range';
                    }
                }
            }

            // for all sensed agents, update or create
            for ( const {agent} of arrayOfSensing ) {
                // console.log('Grid.js agents sensing loop', agent, agent?.id)
                if ( agent && agent.id ) {
                    const {id, name, teamId, teamName, x, y, score, penalty} = agent;
                    var sensedAgent = this.getOrCreateAgent( id )
                    sensedAgent.name = name;
                    sensedAgent.teamId = teamId
                    sensedAgent.teamName = teamName;
                    sensedAgent.x = x;
                    sensedAgent.y = y;
                    sensedAgent.score = score;
                    sensedAgent.penalty = penalty;
                    sensedAgent.opacity = 1;
                    sensedAgent.status = 'online';
                    // console.log('Grid.js sensed agent', id, name, 'at', x, y);
                }
            }

        });

        socket.on("parcels sensing", (arrayOfSensing, info) => {

            // console.log("parcels sensing", arrayOfSensing.length)

            this.info.value = info;

            // /** @type {IOSensing[]} */
            // var arrayOfSensing = Array.from(arrayOfSensing)

            // for all known tile, update perceivingParcels flag
            for ( const tile of this.tiles.values() ) {
                let oneSensing = arrayOfSensing.find( s => s.x == tile.x && s.y == tile.y );
                tile.perceivingParcels = oneSensing ? true : false;
            }

            // for all known parcels, if not in sensed, remove
            var sensed_ids = arrayOfSensing.map( ({parcel}) => parcel?.id ).filter( id => id !== undefined )
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

            // for all sensed parcels, update or create
            for ( const {x, y, parcel} of arrayOfSensing ) {
                if ( ! parcel ) continue;
                const {id, carriedBy, reward} = parcel;

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
