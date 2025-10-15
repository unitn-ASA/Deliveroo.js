const PostponerEventEmitter =  require('../reactivity/PostponerEventEmitter')
const Tile =  require('./Tile')
const Agent =  require('./Agent')
const Parcel = require('./Parcel');



class GridEventEmitter {

    /** @type {PostponerEventEmitter} */
    #eventEmitter;

    /**
     * @constructor GridEventEmitter
     */
    constructor ( ) {
        this.#eventEmitter = new PostponerEventEmitter();
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


module.exports = GridEventEmitter;