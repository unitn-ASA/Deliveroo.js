const EventEmitter = require('events');
const {CLOCK} = require('../../config');



/**
 * @typedef { 'frame' | '1s' | '2s' | '5s' | '10s' } ClockEvents
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
        this.#eventEmitter.setMaxListeners(8000);
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
     * @arg { ClockEvents } event
     * @arg { function(...any) : void } cb
     */
    on ( event, cb ) {
        this.#eventEmitter.on( event, cb );
    }
    
    /**
     * @arg { ClockEvents } event
     * @arg { function(...any) : void } cb
     */
    once ( event, cb ) {
        this.#eventEmitter.once( event, cb );
    }

    /**
     * @arg { ClockEvents } event
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
            /** always emit frame event */      this.#eventEmitter.emit( 'frame' );
            if ( this.#ms % 1000 == 0 ) {       this.#eventEmitter.emit( '1s' );
                                                console.log( 'FRAME', `#${this.#frame}`, `@${this.#base}ms`, this.fps(), `fps` );
                if ( this.#ms % 2000 == 0 )     this.#eventEmitter.emit( '2s' );
                if ( this.#ms % 5000 == 0 ) {   this.#eventEmitter.emit( '5s' );
                    if ( this.#ms % 10000 == 0 )this.#eventEmitter.emit( '10s' );
                }
            }
            setImmediate( () => this.#isSynch = false );
        }, this.#base )
    }

    #samples = [];

    sample () {
        this.#samples.push( {
            frame: this.frame,
            time: Date.now()
        } );
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
        while ( delay > this.#ms - initial ) {
            await new Promise( res => this.#eventEmitter.once('frame', res) )
        }
        
        return this.#ms;

    }

}

const myClock = new Clock();



module.exports = myClock;