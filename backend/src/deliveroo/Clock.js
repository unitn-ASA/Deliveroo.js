const EventEmitter = require('events');
const {CLOCK} = require('../../config');
const Types = require('./Types');



/**
 * @typedef { Types.ClockEvent } ClockEvent
 */



/**
 * @class Clock
 */
class Clock {

    /** @type {EventEmitter} */
    #eventEmitter = new EventEmitter();

    #base = Number( CLOCK ); // 40ms are 25frame/s
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
     * @arg { ClockEvent } event
     * @arg { function(...any) : void } cb
     */
    on ( event, cb ) {
        this.#eventEmitter.on( event, cb );
    }
    
    /**
     * @arg { ClockEvent } event
     * @arg { ? function(...any) : void } cb
     */
    async once ( event, cb = undefined ) {
        if ( cb )
            this.#eventEmitter.once( event, cb );
        else
            return new Promise( res => this.#eventEmitter.once( event, res ) );
    }

    /**
     * @arg { ClockEvent } event
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
            this.sample();
            const memoryUsage = process.memoryUsage();
            /** always emit frame event */      this.#eventEmitter.emit( 'frame' );
            if ( this.#ms % 1000 == 0 ) {       this.#eventEmitter.emit( '1s' );
                if ( this.#ms % 2000 == 0 )     this.#eventEmitter.emit( '2s' );
                if ( this.#ms % 5000 == 0 ) {   this.#eventEmitter.emit( '5s' );
                    console.log( 'FRAME', `#${this.#frame}`, `@${this.#base}ms`, this.fps(), `fps`, `Heap: ${Math.round(memoryUsage.heapUsed/1000000)}MB used of ${Math.round(memoryUsage.heapTotal/1000000)}MB total` );
                    if ( this.#ms % 10000 == 0 )this.#eventEmitter.emit( '10s' );
                }
            }
            // Esegui immediatamente dopo che l'attuale ciclo di eventi è completato
            setImmediate( () => {
                this.#isSynch = false;
            });
        }, this.#base )
    }

    #samples = [];
    #maxSamples = 100; // Keep only last 100 samples to prevent memory leak

    sample () {
        this.#samples.push( {
            frame: this.frame,
            time: Date.now()
        } );
        // Remove old samples to prevent unbounded memory growth
        if ( this.#samples.length > this.#maxSamples ) {
            this.#samples.shift();
        }
    }

    fps ( back = 10 ) {
        if ( this.#samples.length < 1 )
            return Math.round( this.#frame / ( Date.now() - this.#startTime ) * 1000 * 10 ) / 10;
        let lastI = this.#samples.length - 1;
        let firstI = lastI - back < 0 ? 0 : lastI - back;
        const last = this.#samples[ lastI ];
        const first = this.#samples[ firstI ];
        return Math.round( ( last.frame - first.frame ) / ( last.time - first.time ) * 1000 * 10 ) / 10;
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



module.exports = Clock ;