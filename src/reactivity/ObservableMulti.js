const PostponerEventEmitter = require('./PostponerEventEmitter');

/**
 * @template { Record<keyof T,T[keyof T]> } T
 * @extends T
 */
class ObservableMulti {

    #eventEmitter = new PostponerEventEmitter();

    /** @type { Map<keyof T | 'any', boolean> } */
    #immediately = new Map();

    /**
     * This wraps the property in a getter and setter that will emit the event when the value changes.
     * In the case of a Set or Map, it will wrap the Set in a Proxy that will emit the event when the Set is modified.
     * 
     * When immediately is set to true, this will fire this specific event immediately:
     * - on already registered listeners when start watching,
     * - and on new listeners when registered.
     * @param { keyof T } key
     * @param { boolean } immediately default is false
     * @returns true if created, false if already exists
     */
    watch ( key, immediately = false ) {
        var descriptor = Object.getOwnPropertyDescriptor(this, key)
        if  ( ! descriptor || ! descriptor.set ) {

            var stored = this.#deepTrack( descriptor.value, key );

            Object.defineProperty (this, key, {

                /** @return { T[keyof T] } */
                get: () => stored,

                /** @param { T [ keyof T ] } value */
                set: (value) => {
                    if ( value != stored ) {
                        stored = this.#deepTrack( value, key );
                        this.emit( key );
                    }
                },

                configurable: false
            });

            if ( immediately ) {
                // immediately fire already registered listeners 
                this.#eventEmitter.emit( key.toString(), this );
                // will immediately fire new listeners when registered
                this.#immediately.set( key, true );
            }

            return true;
        }
        return false;
    }

    #deepTrack ( target, key ) {
        const _this = this;
        let stored;
        // if is a Set wrap in a proxy
        if ( target instanceof Set ) {
            stored = new Proxy( target, {
                get ( target, property ) {
                    // console.log('ObservableMulti Proxy on', target, property);
                    if (property === 'add') {
                        // Intercetta il metodo 'add'
                        return function(value) {
                            // console.log('ObservableMulti', `Adding: ${value}`);
                            _this.emit( key);
                            return target.add(value);
                        };
                    }
                    if (property === 'delete') {
                        // Intercetta il metodo 'delete'
                        return function(value) {
                            // console.log('ObservableMulti', `Deleting: ${value}`);
                            _this.emit( key );
                            return target.delete(value);
                        };
                    }
                    else {
                        // Restituisce il metodo originale se esiste
                        if ( target[property] instanceof Function )
                            return target[property].bind( target );
                        else
                            return target[property];
                    }
                }
            } );
        }
        else if ( target instanceof Map ) {
            stored = new Proxy( target, {
                get ( target, property ) {
                    // console.log('ObservableMulti Proxy on', target, property);
                    if (property === 'set') {
                        // Intercetta il metodo 'set'
                        return function(key, value) {
                            // console.log('ObservableMulti', `Setting: ${key} to ${value}`);
                            _this.emit( key );
                            return target.set(key, value);
                        };
                    }
                    if (property === 'delete') {
                        // Intercetta il metodo 'delete'
                        return function(key) {
                            // console.log('ObservableMulti', `Deleting: ${key}`);
                            _this.emit( key );
                            return target.delete(key);
                        };
                    }
                    else {
                        // Restituisce il metodo originale se esiste
                        if ( target[property] instanceof Function )
                            return target[property].bind( target );
                        else
                            return target[property];
                    }
                }
            } );
        }
        // Otherwise, just store the value
        else {
            stored = target;
        }
        return stored;
    }


    /**
     * When immediately is set to true, this will fire the 'any' event immediately:
     * - on already registered listeners when start watching,
     * - and on new listeners when registered.
     * @param { boolean } immediately default is false
     */
    constructor ( immediately = false ) {
        if ( immediately )
            this.#immediately.set( 'any', true );
        else
            this.#immediately.set( 'any', false );
        this.#eventEmitter.setMaxListeners(500);
    }

    /**
     * @param { keyof T } key
     */
    emit ( key ) {
        this.#eventEmitter.emit( key.toString(), this );
        this.#eventEmitter.emitOnePerTick( key.toString() + '.tick', this );
        this.#eventEmitter.emitOnePerFrame( key.toString() + '.frame', this );
        this.#eventEmitter.emit( 'any', this );
        this.#eventEmitter.emitOnePerTick( 'any.tick', this );
        this.#eventEmitter.emitOnePerFrame( 'any.frame', this );
    }

    /**
     * @param { keyof T } key
     * @param { function( T ) : void } callback
     */
    once ( key, callback ) {
        this.#eventEmitter.once( key.toString(), callback );
    }

    /**
     * @param { keyof T | 'any' } key
     * @param { function( T ) : void } callback
     */
    on ( key, callback ) {
        this.#eventEmitter.on( key.toString(), callback );
        if ( this.#immediately.get(key) )
            callback.call( this, this );
    }

    /**
     * @param { keyof T } key
     * @param { function( T ) : void } callback
     */
    onTick ( key, callback ) {
        this.#eventEmitter.emitOnePerTick( key.toString() + '.tick', callback);
        if ( this.#immediately.get(key) )
            callback.call( this );
    }

    /**
     * @param { keyof T } key
     * @param { function( T ) : void } callback
     */
    onFrame ( key, callback ) {
        this.#eventEmitter.on( key.toString() + '.frame', callback );
        if ( this.#immediately.get(key) )
            callback.call( this );
    }

    /**
     * @param { keyof T } key
     * @param { function( T ) : void } callback
     */
    off ( key, callback ) {
        this.#eventEmitter.off( key.toString() + '.immediate', callback );
        this.#eventEmitter.off( key.toString() + '.tick', callback );
        this.#eventEmitter.off( key.toString() + '.frame', callback );
    }

    /**
     * @param { keyof T } key
     */
    removeAllListeners ( key ) {
        this.#eventEmitter.removeAllListeners( key.toString() + '.immediate' );
        this.#eventEmitter.removeAllListeners( key.toString() + '.tick' );
        this.#eventEmitter.removeAllListeners( key.toString() + '.frame' );
    }
    
}

module.exports = ObservableMulti;