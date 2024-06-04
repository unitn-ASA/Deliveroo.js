const EventEmitter = require('events');
const config = require('../../config');



const CLOCK = process.env.CLOCK || config.CLOCK || 50; // 40ms are 25frame/s; 50ms are 20frame/s;



class Clock extends EventEmitter {

    #base = CLOCK; // 40ms are 25frame/s
    #id;
    #ms = 0;
    #isSynch = false;
    
    constructor () {
        super();
        this.setMaxListeners(5000);
        this.start();
    }
    
    get ms () {
        return this.#ms;
    }
    
    stop () {
        clearInterval( this.#id );
        this.#id = undefined;
    }

    start () {
        if ( this.#id )
            return;
        this.#id = setInterval( () => {
            this.#isSynch = true;
            this.#ms += this.#base;
            /** always emit frame event */      this.emit( 'frame' );
            if ( this.#ms % 1000 == 0 ) {       this.emit( '1s' );
                if ( this.#ms % 2000 == 0 )     this.emit( '2s' );
                if ( this.#ms % 5000 == 0 ) {   this.emit( '5s' );
                    if ( this.#ms % 10000 == 0 )this.emit( '10s' );
                }
            }
            setImmediate( () => this.#isSynch = false );
        }, this.#base )
    }

    async synch ( delay = 0 ) {

        if ( ! this.#isSynch )
            await new Promise( res => this.once('frame', res) );

        const initial = this.#ms
        while ( delay > this.#ms - initial ) {
            await new Promise( res => this.once('frame', res) )
        }
        
        return this.#ms;

    }

}

const myClock = new Clock();



module.exports = myClock;