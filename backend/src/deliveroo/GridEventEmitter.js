import EventEmitter from 'events';
import Tile from './Tile.js';
import Agent from './Agent.js';
import Parcel from './Parcel.js';
import Crate from './Crate.js';



/**
 * @class GridEventEmitter
 * @extends {EventEmitter<{tile: [Tile], parcel: [Parcel], crate: [Crate], "agent created": [Agent], "agent xy": [Agent], "agent score": [Agent], "agent deleted": [Agent]}>}
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
     * @param { Agent } agent
     */
    emitAgentCreated ( agent ) {
        this.emit('agent created', agent);
    }

    /**
     * @param { function ( Agent ) : void } callback
     */
    onAgentCreated ( callback ) {
        return this.on('agent created', callback);
    }

    /**
     * @param { function ( Agent ) : void } callback
     */
    offAgentCreated ( callback ) {
        this.off('agent created', callback );
    }



    /**
     * @param { Agent } agent
     */
    emitAgentDeleted ( agent ) {
        this.emit('agent deleted', agent);
    }

    /**
     * @param { function ( Agent ) : void } callback
     */
    onAgentDeleted ( callback ) {
        return this.on('agent deleted', callback);
    }

    /**
     * @param { function ( Agent ) : void } callback
     */
    offAgentDeleted ( callback ) {
        this.off('agent deleted', callback );
    }



    /**
     * @param { Agent } agent
     */
    emitAgentXy ( agent ) {
        this.emit('agent xy', agent);
    }

    /**
     * @param { function ( Agent ) : void } callback
     */
    onAgentXy ( callback ) {
        return this.on('agent xy', callback);
    }

    /**
     * @param { function ( Agent ) : void } callback
     */
    offAgentXy ( callback ) {
        this.off('agent xy', callback );
    }

    

    /**
     * @param { Agent } agent
     */
    emitAgentScore ( agent ) {
        this.emit('agent score', agent);
    }

    /**
     * @param { function ( Agent ) : void } callback
     */
    onAgentScore ( callback ) {
        return this.on('agent score', callback);
    }

    /**
     * @param { function ( Agent ) : void } callback
     */
    offAgentScore ( callback ) {
        this.off('agent score', callback );
    }

}


export default GridEventEmitter;