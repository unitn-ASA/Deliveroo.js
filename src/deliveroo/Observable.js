const EventEmitter = require('events');
const myClock = require('./Clock');

/**
 * Observer callback function
 * @callback Observer
 * @param {IterableIterator<Event>} events - Map of eventKeys to eventObject which notification has been triggered
 * @return {void}
 */
// * @callback Observer
// * @typedef {function(Observable): void} Observer



/**
 * Wrap finallyDo function and call it just once every frame.
 * @function postpone
 */
function postponeAtNextFrame ( finallyDo ) {
    var promiseFired = false;
    return async (...args) => {
        promiseFired = false;
        myClock.once('frame', () => {
            if ( !promiseFired ) {
                promiseFired = true;
                finallyDo(...args);
            }
        } );
    }
}



/**
 * Wrap finallyDo function and call it just once every nextTick.
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



/**
 * https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/
 * By using process.nextTick() we guarantee that apiCall() always runs its callback after the rest of the user's code and before the event loop is allowed to proceed.
 * @function postpone Wrap finallyDo function, accumulate arguments, and call once every nextTick with the complete list of arguments.
 */
function accumulate ( finallyDo ) {
    var promiseFired = false;
    var accumulatedArgs = [];
    return async (...args) => {
        promiseFired = false;
        for (let index = 0; index < args.length; index++) {
            const arg = args[index];
            if ( ! accumulatedArgs[index] ) {
                accumulatedArgs.push([]);
                while ( index > 0 && accumulatedArgs[index].length + 1 < accumulatedArgs[index-1].length ) {
                    accumulatedArgs[index].push(undefined);
                }
            }
            accumulatedArgs[index].push(arg)
        }
        process.nextTick( () => { // https://jinoantony.com/blog/setimmediate-vs-process-nexttick-in-nodejs
            if ( !promiseFired ) {
                promiseFired = true;
                var accumulatedArgsTmp = accumulatedArgs;
                accumulatedArgs = []
                finallyDo( ...accumulatedArgsTmp );
            }
        } );
    }
}



class Observable extends EventEmitter {



    postponeAtNextFrame = postponeAtNextFrame;

    postpone = postpone;

    accumulate = accumulate;



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
     * @type {function(string,[]):boolean} Returns true if event triggered, false if event was already triggered before
     */ 
    emitOnePerTick (event, ...args) {
        if ( !this.#postponer.has(event) )
            this.#postponer.set( event, postpone( this.emit.bind(this) ) );
        var postponed = this.#postponer.get(event);
        postponed(event, ...args);
    }



    #postponerAtFrame = new Map()
    emitOnePerFrame (event, ...args) {
        if ( !this.#postponerAtFrame.has(event) )
            this.#postponerAtFrame.set( event, postponeAtNextFrame( this.emit.bind(this) ) );
        var postponed = this.#postponerAtFrame.get(event);
        postponed(event, ...args);
    }



    #accumulator = new Map()
    /**
     * emitAccumulatedAtNextTick (event, ...args)
     * @type {function(string,[]):void}
     */ 
    emitAccumulatedAtNextTick (event, ...args) {
        if ( !this.#accumulator.has(event) )
            this.#accumulator.set( event, accumulate( this.emit.bind(this, event) ) );
        var accumulated = this.#accumulator.get(event);
        accumulated( ...args );
    }


    
}



module.exports = Observable