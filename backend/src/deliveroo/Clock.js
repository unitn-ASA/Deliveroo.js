import EventEmitter from 'events';
import { config } from '../config/config.js';



/**
 * @typedef { import('@unitn-asa/deliveroo-js-sdk/types/IOClockEvent.js').IOClockEvent } IOClockEvent
 */

/**
 * @typedef {import("@unitn-asa/deliveroo-js-sdk/types/IOInfo.js").IOInfo} IOInfo
 */



/**
 * @class Clock
 */
class Clock {

    /** @type {EventEmitter} */
    #eventEmitter = new EventEmitter();

    #base = Number( config.CLOCK ); // 40ms are 25frame/s
    #id;
    #ms = 0;
    #frame = 0;
    #startTime = 0;
    #isSynch = false;

    constructor () {
        // (node:77250) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 5001 frame listeners added to [EventEmitter]. Use emitter.setMaxListeners() to increase limit
        // (Use `node --trace-warnings ...` to show where the warning was created)
        this.#eventEmitter.setMaxListeners(20000);
        this.start();
    }
    
    /**
     * @type {Number} ms
     */
    get ms () {
        return this.#ms;
    }

    /**
     * @type {Number} frame
     */
    get frame () {
        return this.#frame;
    }

    /**
     * @arg { IOClockEvent } event
     * @arg { function(...any) : void } cb
     */
    on ( event, cb ) {
        this.#eventEmitter.on( event, cb );
    }
    
    /**
     * @arg { IOClockEvent } event
     * @arg { ? function(...any) : void } cb
     */
    async once ( event, cb = undefined ) {
        if ( cb )
            this.#eventEmitter.once( event, cb );
        else
            return new Promise( res => this.#eventEmitter.once( event, res ) );
    }

    /**
     * @arg { IOClockEvent } event
     * @arg { function(...any) : void } cb
     */
    off ( event, cb ) {
        this.#eventEmitter.off( event, cb );
    }
    
    stop () {
        clearInterval( this.#id );
        this.#id = undefined;
    }

    start () {
        if ( this.#id )
            return;
        this.#startTime = Date.now();
        this.#id = setInterval( () => {
            this.#isSynch = true;
            this.#ms += this.#base;
            this.#frame += 1;
            /** always emit frame event */      this.#eventEmitter.emit( 'frame' );
            if ( this.#ms % 1000 == 0 ) {       this.#eventEmitter.emit( '1s' );
                if ( this.#ms % 2000 == 0 )     this.#eventEmitter.emit( '2s' );
                if ( this.#ms % 5000 == 0 ) {   this.#eventEmitter.emit( '5s' );
                    if ( this.#ms % 10000 == 0 )this.#eventEmitter.emit( '10s' );
                }
            }
            // Esegui immediatamente dopo che l'attuale ciclo di eventi è completato
            setImmediate( () => {
                this.#isSynch = false;
            });
        }, this.#base )
    }

    async synch ( delay = 0 ) {

        if ( ! this.#isSynch )
            await new Promise( res => this.#eventEmitter.once('frame', res) );

        const initial = this.#ms
        while ( delay > ( this.#ms - initial ) ) {
            await new Promise( res => this.#eventEmitter.once('frame', res) )
        }

        return this.#ms;

    }

}



export default Clock;