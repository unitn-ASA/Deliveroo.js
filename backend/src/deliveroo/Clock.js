import EventEmitter from 'events';
import { config } from '../config/config.js';



/**
 * @typedef { import('@unitn-asa/deliveroo-js-sdk/types/IOClockEvent.js').IOClockEvent } IOClockEvent
 */



/**
 * @class Clock
 */
class Clock {

    /** @type {EventEmitter<{[K in IOClockEvent]: []}>} */
    #eventEmitter = new EventEmitter();

    #base = Number( config.CLOCK ); // 40ms are 25frame/s
    #id;
    #ms = 0;
    #frame = 0;
    #startTime = 0;
    #isSynch = false;
    
    #ms1s = 0;
    #ms2s = 0;
    #ms5s = 0;
    #ms10s = 0;
    #ms1m = 0;
    #ms1h = 0;

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
     * @arg { function(...any) : void } cb
     * @returns {Promise<void>}
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

        this.#ms1s = 0;
        this.#ms2s = 0;
        this.#ms5s = 0;
        this.#ms10s = 0;
        this.#ms1m = 0;
        this.#ms1h = 0;

        this.#id = setInterval( () => {

            this.#isSynch = true;
            this.#ms += this.#base;
            this.#frame += 1;
            
            // always emit frame event
            this.#eventEmitter.emit( 'frame' );
            
            if ( this.#ms - this.#ms1s >= 1000 ) {
                this.#ms1s = this.#ms;
                this.#eventEmitter.emit( '1s' );

                if ( this.#ms - this.#ms2s >= 2000 ) {
                    this.#ms2s = this.#ms;
                    this.#eventEmitter.emit( '2s' );

                    if ( this.#ms - this.#ms5s >= 5000 ) {
                        this.#ms5s = this.#ms;
                        this.#eventEmitter.emit( '5s' );

                        if ( this.#ms - this.#ms10s >= 10000 ) {
                            this.#ms10s = this.#ms;
                            this.#eventEmitter.emit( '10s' );

                            if ( this.#ms - this.#ms1m >= 60000 ) {
                                this.#ms1m = this.#ms;
                                this.#eventEmitter.emit( '1m' );

                                if ( this.#ms - this.#ms1h >= 3600000 ) {
                                    this.#ms1h = this.#ms;
                                    this.#eventEmitter.emit( '1h' );
                                }
                            }
                        }
                    }
                }
            }
            
            // Esegui immediatamente dopo che l'attuale ciclo di eventi è completato
            process.nextTick( () => {
                this.#isSynch = false;
            } );

        }, this.#base )
    }

    /**
     * Synchronize with the clock. Returns a promise that resolves when the clock has reached at least the specified delay in frames since the last synchronization point.
     * @param {number} frames - minimum delay in frames to wait before resolving - 0 means wait for the next frame, 1 means wait for the next frame after the next, etc.
     * @returns {Promise<number>} ms
     */
    async synchFrame ( frames = 0 ) {

        if ( ! this.#isSynch )
            await new Promise( res => this.#eventEmitter.once('frame', ()=>res()) );

        const initialFrame = this.#frame;
        while ( frames > ( this.#frame - initialFrame ) ) {
            await new Promise( res => this.#eventEmitter.once('frame', ()=>res()) )
        }

        return this.#ms;

    }

    /**
     * Synchronize with the clock and then delay.
     * Returns a promise that resolves in a 'delay' time after the current frame
     * @param {number} delay - minimum delay in ms to wait before resolving
     * @returns {Promise<void>}
     */
    async synch ( delay = 0 ) {
        
        // const t0 = Date.now();
        if ( ! this.#isSynch )
            await new Promise( res => this.#eventEmitter.once('frame', ()=>res()) );
        
        // const t1 = Date.now();
        await new Promise( res => setTimeout(res, delay) );
        
        // const t2 = Date.now();
        // console.log( `Clock.synch() - clock:${this.#base} delay:${delay}ms, ${t1 - t0}ms + ${t2 - t1}ms` );

    }

}



export default Clock;