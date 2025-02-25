const ObservableMulti = require('./ObservableMulti');



/**
 * @class Tracker
 * @template { ObservableMulti } T
 */
class Tracker {

    /** @property { ObservableMulti<ObservableMulti<T>> } observable */
    observable;

    /**
     * @param { ObservableMulti<ObservableMulti<T>> } observable
     */
    constructor ( observable ) {
        this.observable = observable;
    }

    /**
     * 
     * @param {keyof ObservableMulti<T>} key key of the observable 
     * @param {keyof T} key2 key of the tracked value
     * @param {function} cb
     */
    track ( key, key2, cb ) {
    
        var last = this.observable[key];
    
        this.observable.on( key, () => {
            if ( last )
                last.off( key2, cb );
            if ( this.observable[key] )
                this.observable[key].on( key2, cb );
            last = this.observable[key];
        } );

    }

}