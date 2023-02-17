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
    


    // /**
    //  * @type {function(IterableIterator<Event>):number} Returns number of events triggered, events already triggered are not counted
    //  */
    // triggerEvents (events) {
    //     var count = 0;
    //     for ( const ev of events ) {
    //         if ( !this.#events.has(ev) ) {
    //             this.#events.add(ev);
    //             count++;
    //         }
    //     }
    //     if ( count > 0 ) this.notify();
    //     return count;
    // }


    // /**
    //  * @type {function(Observer,...function(Event):boolean):Observable}
    //  * @returns {Observable} Use returned (wrapped) observer to unsubscribe
    //  */
    // observe (observer, ...conditions) {
    //     if ( typeof(observer) != 'function' )
    //         throw new Error('Observer.observe requires first parameter to be an observer callback function')
        
    //     if (conditions.length>0) {
    //         /**
    //          * @type {function(IterableIterator<T>,...function(T):boolean):IterableIterator<T>}
    //          * @template T Event
    //         */
    //         function* eventsIteratorFilteredOnConditions( events, ...conditions ) {
    //             let iterationCount = 0;
    //             for ( const ev of events ) {
    //                 var matched = false
    //                 for (const c of conditions) {
    //                     if ( c(ev) ) {
    //                         matched = true;
    //                         break;
    //                     }
    //                 }
    //                 if (matched) {
    //                     iterationCount++;
    //                     yield ev;
    //                 }
    //             }
    //             return iterationCount;
    //         }
    //         /** @type {Observer} */
    //         var wrappedObserver = (events) => {
    //             const iterator = eventsIteratorFilteredOnConditions(events, ...conditions);
    //             observer(iterator);
    //         }
    //         this.#observers.add( wrappedObserver );
    //         return wrappedObserver;
    //     }

    //     this.#observers.add(observer);
    //     return observer;
    // }

    // /**
    //  * @type {function(string,Observer)}
    //  * @returns {boolean} Returns true if an element in the Set has been removed, or false if the element does not exist.
    //  */
    // unobserve (observer) {
    //     // if (!this.#observers.has(key)) this.#observers.set(key, new Set());
    //     return this.#observers.delete(observer);
    // }
    
    // /**
    //  * @returns {Promise} Promise that resolves after changes with final value
    //  */
    //  async onChange (observerWrapperFunction) {
    //     return new Promise( res => {
    //         var useToUnsubscribeTmpObs;
    //         /** @type Observer */
    //         var tmpObs = (...args) => {
    //             this.unobserve(useToUnsubscribeTmpObs);
    //             res(...args);
    //         }
    //         useToUnsubscribeTmpObs = this.observe(tmpObs, ...events);
    //     }).catch( err => console.error(err) );
    // }

}



module.exports = Observable