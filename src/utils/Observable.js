
/**
 * Observer callback function
 * @callback Observer
 * @param {IterableIterator<Event>} events - Map of eventKeys to eventObject which notification has been triggered
 * @return {void}
 */
// * @callback Observer
// * @typedef {function(Observable): void} Observer



/**
 * Decorator to aggregate function calls and reduce to one at every microtask loop when promises resolve
 * @type {function(Class, string, Object): Object}
 */
function postponeDecorator ( target, name, descriptor ) {
    descriptor.value = postpone(descriptor.value);
    return descriptor;
}
/**
 * Aggregate at Promise and do once. Based on Promise resolution. When first notify resolves, "notified" is called once.
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
 * @class Observable
 * @extends Observable
 */
class Observable {



    /**
     * @class Event
     */
    static Event = class Event {
    
        name;
        object;
        subject;
    
        constructor(name, object, subject, init = {}) {
            this.name = name;
            this.object = object;
            this.subject = subject;
            for (const key in init) {
                this[key] = init[key]
            }
        }
    
    }

    /** @type {Set<Observer>} Observers */
    #observers = new Set();

    /** @type {Set<Event>} Events */
    #events = new Set();
    


    /**
     * @constructor Observable
     */
    constructor ( keys = [] ) {
        for (const key of keys) {
            this.interceptValueSet(key)
        }
        // if ( this != Observable.#dispatcher )
        //     this.observe( Observable.Observable.#dispatcher.notify(observed) );
        this.notify = postpone( this.notify.bind(this) );
    }
    


    /**
     * @function string
     * @returns true if created, false if already exists
     */
    interceptValueSet (field) {
        var descriptor = Object.getOwnPropertyDescriptor(this, field)
        if (!descriptor || !descriptor.set) {
            var value = ( descriptor && descriptor.value ? descriptor.value : null );
            var mySetEvent = new Observable.Event( 'set', field, this );
            var myChangedEvent = new Observable.Event( 'changed', field, this );
            Object.defineProperty (this, field, {
                get: () => value,
                set: (v) => {
                    // console.log('setting field', key, 'of', this.toString(), 'to', v)
                    this.triggerEvent(mySetEvent); //this.triggerEvent('set ' + field, this);
                    if ( v != value )
                        this.triggerEvent(myChangedEvent); //this.triggerEvent('changed ' + field, this);
                    value = v;
                },
                configurable: false
            });
            return true;
        }
        return false;
    }

    // getEvents () {
    //     var copy = new Set();
    //     this.#events.forEach( (ev) => copy.add(ev) )
    //     return copy;
    // }

    /**
     * @type {function(Event):boolean} Returns true if event triggered, false if event was already triggered before
     */
    triggerEvent (event) {
        if ( !this.#events.has(event) ) {
            this.#events.add(event);
            this.notify();
            return true;
        }
        return false;
    }

    /**
     * @type {function(IterableIterator<Event>):number} Returns number of events triggered, events already triggered are not counted
     */
    triggerEvents (events) {
        var count = 0;
        for ( const ev of events ) {
            if ( !this.#events.has(ev) ) {
                this.#events.add(ev);
                count++;
            }
        }
        if ( count > 0 ) this.notify();
        return count;
    }

    notifyCounter = 1
    // @postpone
    /**
     * @type {function():void} All call of #notify must behave the same, so no argument are supported. Only one will get called by postpone wrapper.
     */
    async notify () {
        // console.log('notifying', this.#observers.size, 'observers for the', this.notifyCounter++, 'th time')
        this.#observers.forEach( obs => { if (obs) obs(this.#events.values()) } );
        // if ( this != Observable.dispatcher )
        //     Observable.dispatcher.notifyAll(observed);
        this.#events.clear()
    }

    /**
     * @type {function(Observer,...function(Event):boolean):Observable}
     * @returns {Observable} Use returned (wrapped) observer to unsubscribe
     */
    observe (observer, ...conditions) {
        if ( typeof(observer) != 'function' )
            throw new Error('Observer.observe requires first parameter to be an observer callback function')
        
        if (conditions.length>0) {
            /**
             * @type {function(IterableIterator<T>,...function(T):boolean):IterableIterator<T>}
             * @template T Event
            */
            function* eventsIteratorFilteredOnConditions( events, ...conditions ) {
                let iterationCount = 0;
                for ( const ev of events ) {
                    var matched = false
                    for (const c of conditions) {
                        if ( c(ev) ) {
                            matched = true;
                            break;
                        }
                    }
                    if (matched) {
                        iterationCount++;
                        yield ev;
                    }
                }
                return iterationCount;
            }
            /** @type {Observer} */
            var wrappedObserver = (events) => {
                const iterator = eventsIteratorFilteredOnConditions(events, ...conditions);
                observer(iterator);
            }
            this.#observers.add( wrappedObserver );
            return wrappedObserver;
        }

        this.#observers.add(observer);
        return observer;
    }

    /**
     * @type {function(string,Observer)}
     * @returns {boolean} Returns true if an element in the Set has been removed, or false if the element does not exist.
     */
    unobserve (observer) {
        // if (!this.#observers.has(key)) this.#observers.set(key, new Set());
        return this.#observers.delete(observer);
    }
    
    /**
     * @returns {Promise} Promise that resolves after changes with final value
     */
     async onChange (observerWrapperFunction) {
        return new Promise( res => {
            var useToUnsubscribeTmpObs;
            /** @type Observer */
            var tmpObs = (...args) => {
                this.unobserve(useToUnsubscribeTmpObs);
                res(...args);
            }
            useToUnsubscribeTmpObs = this.observe(tmpObs, ...events);
        }).catch( err => console.error(err) );
    }

    // /**
    //  * @param {*} key
    //  * @returns {Observable} Promise that resolves on changed Observable
    //  */
    // async onAnyChange (...keys) {
    //     var promises = [];
    //     for ( let key of keys ) {
    //         promises.add( this.onChange(key) );
    //     }
    //     return Promise.any( promises ).catch( err => console.error(err) );
    // }

}



module.exports = Observable