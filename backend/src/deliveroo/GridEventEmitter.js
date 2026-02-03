import EventEmitter from 'events';
import Tile from './Tile.js';
import Agent from './Agent.js';
import Parcel from './Parcel.js';
import Crate from './Crate.js';



/**
 * @class GridEventEmitter
 * @extends {EventEmitter<{tile: [Tile], parcel: [Parcel], crate: [Crate], agent: [agentEvent, Agent]}>}
 */
class GridEventEmitter extends EventEmitter {

    /**
     * @constructor
     */
    constructor ( ) {
        super();
        this.setMaxListeners(0); // unlimited listeners
    }
    


    /**
     * @param { Tile } tile 
     */
    emitTile ( tile ) {
        this.emit('tile', tile);
    }

    /**
     * @param { function ( Tile ) : void } callback 
     */
    onTile ( callback ) {
        this.on('tile', callback);
    }

    /**
     * @param { function ( Tile ) : void } callback 
     */
    offTile ( callback ) {
        this.off('tile', callback);
    }



    /**
     * @param { Parcel } parcel 
     */
    emitParcel ( parcel ) {
        this.emit('parcel', parcel);
    }

    /**
     * @param { function ( Parcel ) : void } callback
     **/
    onParcel ( callback ) {
        this.on('parcel', callback);
    }

    /**
     * @param { function ( Parcel ) : void } callback
     **/
    offParcel ( callback ) {
        this.off('parcel', callback);
    }



    /**
     * @param { Crate } crate
     */
    emitCrate ( crate ) {
        this.emit('crate', crate);
    }

    /**
     * @param { function ( Crate ) : void } callback
     **/
    onCrate ( callback ) {
        this.on('crate', callback);
    }

    /**
     * @param { function ( Crate ) : void } callback
     **/
    offCrate ( callback ) {
        this.off('crate', callback);
    }



    /**
     * @typedef { 'created' | 'xy' | 'score' | 'deleted' } agentEvent 
     */

    /**
     * @param { agentEvent } agentEvent
     * @param { Agent } agent
     */
    emitAgent ( agentEvent, agent ) {
        this.emit('agent', agentEvent, agent);
    }

    /**
     * @param { agentEvent } agentEvent
     * @param { function ( agentEvent, Agent ) : void } callback 
     */
    onAgent ( agentEvent, callback ) {
        this.on('agent', (ev, agent) => ( ev == agentEvent ? callback(ev, agent) : () => {} ) );
    }

    /**
     * @param { function ( agentEvent, Agent ) : void } callback 
     */
    offAgent ( callback ) {
        this.off('agent', callback);
    }

}


export default GridEventEmitter;