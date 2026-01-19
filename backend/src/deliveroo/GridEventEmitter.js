import EventEmitter from 'events';
import Tile from './Tile.js';
import Agent from './Agent.js';
import Parcel from './Parcel.js';
import Crate from './Crate.js';



class GridEventEmitter {

    // with EventEmitterOncePerFrame I was getting only one tile update per frame, all the others were lost!
    /** @type {EventEmitter} */
    #eventEmitter;

    /**
     * @constructor GridEventEmitter
     */
    constructor ( ) {
        this.#eventEmitter = new EventEmitter();
        this.#eventEmitter.setMaxListeners(500);
    }
    


    /**
     * @param { Tile } tile 
     */
    emitTile ( tile ) {
        this.#eventEmitter.emit('tile', tile);
    }

    /**
     * @param { function ( Tile ) : void } callback 
     */
    onTile ( callback ) {
        this.#eventEmitter.on('tile', callback);
    }

    /**
     * @param { function ( Tile ) : void } callback 
     */
    offTile ( callback ) {
        this.#eventEmitter.off('tile', callback);
    }



    /**
     * @param { Parcel } parcel 
     */
    emitParcel ( parcel ) {
        this.#eventEmitter.emit('parcel', parcel);
    }

    /**
     * @param { function ( Parcel ) : void } callback
     **/
    onParcel ( callback ) {
        this.#eventEmitter.on('parcel', callback);
    }

    /**
     * @param { function ( Parcel ) : void } callback
     **/
    offParcel ( callback ) {
        this.#eventEmitter.off('parcel', callback);
    }



    /**
     * @param { Crate } crate
     */
    emitCrate ( crate ) {
        this.#eventEmitter.emit('crate', crate);
    }

    /**
     * @param { function ( Crate ) : void } callback
     **/
    onCrate ( callback ) {
        this.#eventEmitter.on('crate', callback);
    }

    /**
     * @param { function ( Crate ) : void } callback
     **/
    offCrate ( callback ) {
        this.#eventEmitter.off('crate', callback);
    }



    /**
     * @typedef { 'created' | 'xy' | 'score' | 'deleted' } agentEvent 
     */

    /**
     * @param { agentEvent } agentEvent
     * @param { Agent } agent
     */
    emitAgent ( agentEvent, agent ) {
        this.#eventEmitter.emit('agent', agentEvent, agent);
        this.#eventEmitter.emit('agent ' + agentEvent, agentEvent, agent);
    }

    /**
     * @param { agentEvent } agentEvent
     * @param { function ( agentEvent, Agent ) : void } callback 
     */
    onAgent ( agentEvent, callback ) {
        if ( agentEvent ) {
            this.#eventEmitter.on('agent ' + agentEvent, callback);
        } else {
            this.#eventEmitter.on('agent', callback);
        }
    }

    /**
     * @param { agentEvent } agentEvent
     * @param { function ( agentEvent, Agent ) : void } callback 
     */
    offAgent ( agentEvent, callback ) {
        if ( agentEvent ) {
            this.#eventEmitter.off('agent ' + agentEvent, callback);
        } else {
            this.#eventEmitter.off('agent', callback);
        }
    }

}


export default GridEventEmitter;