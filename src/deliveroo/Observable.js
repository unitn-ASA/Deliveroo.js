const EventEmitter = require('events');

/**
 * Observer callback function
 * @callback Observer
 * @param {IterableIterator<Event>} events - Map of eventKeys to eventObject which notification has been triggered
 * @return {void}
 */
// * @callback Observer
// * @typedef {function(Observable): void} Observer



/**
 * Call wrapped function just once every nextTick.
 * @function postpone
 */
function postpone ( finallyDo ) {
    var promiseFired = false;
    return async (...args) => {
        promiseFired = false;
        process.nextTick( () => { // https://jinoantony.com/blog/setimmediate-vs-process-nexttick-in-nodejs
            if ( !promiseFired ) {
                promiseFired = true;
                finallyDo(...args);
            }
        } );
    }
}



class Observable extends EventEmitter {

    /**
     * @constructor Observable
     */
    constructor () {
        super();
    }
    


    /**
     * @function string
     * @returns true if created, false if already exists
     */
    interceptValueSet (field, emitEvent = undefined) {
        var descriptor = Object.getOwnPropertyDescriptor(this, field)
        if (!descriptor || !descriptor.set) {
            var value = descriptor.value;
            Object.defineProperty (this, field, {
                get: () => value,
                set: (v) => {
                    // console.log('setting field', key, 'of', this.toString(), 'to', v)
                    if ( v != value )
                        this.emitOnePerTick( ( emitEvent ? emitEvent : field ), this);
                    value = v;
                },
                configurable: false
            });
            return true;
        }
        return false;
    }



    #postponer = new Map()
    /**
     * @type {function(Event):boolean} Returns true if event triggered, false if event was already triggered before
     */ 
    emitOnePerTick (event, ...args) {
        if ( !this.#postponer.has(event) )
            this.#postponer.set( event, postpone(this.emit.bind(this)) );
        var postponed = this.#postponer.get(event);
        postponed(event, ...args);
    }


    
}



module.exports = Observable