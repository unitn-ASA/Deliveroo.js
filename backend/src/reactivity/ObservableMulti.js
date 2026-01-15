import EventEmitter from 'events';
import EventEmitterOncePerTick from './EventEmitterOncePerTick.js';
import EventEmitterOncePerFrame from './EventEmitterOncePerFrame.js';
import { watchProperty } from './watchProperty.js';

/**
 * @template { Record<keyof T,T[keyof T]> } T
 * @extends T
 */
class ObservableMulti {

    #emitter = new EventEmitter();
    #emitterOncePerTick = new EventEmitterOncePerTick();
    #emitterOncePerFrame = new EventEmitterOncePerFrame();

    /** @type { Map<keyof T | 'any', boolean> } */
    #immediate = new Map();

    /**
     * Watch a property and emit(key) when it changes.
     * 
     * When immediate is set to true, this will emit the event immediately,
     * and will instruct to emit it immediately also to new listeners.
     * 
     * @param { keyof T } key
     * @param { boolean } immediate default is false
     * @returns true if created, false if already exists
     */
    watch(key, immediate = false) {
        if (Object.getOwnPropertyDescriptor(this, key)?.set) return false;

        watchProperty({
            target: this,
            key,
            immediate,
            callback: () => this.emit(key)
        });

        if (immediate) this.#immediate.set(key, true);
        return true;
    }

    /**
     * When immediately is set to true, this will fire the 'any' event immediately:
     * - on already registered listeners when start watching,
     * - and on new listeners when registered.
     * @param { boolean } immediateAny default is false
     */
    constructor ( immediateAny = false ) {
        this.#immediate.set('any', immediateAny);
        this.#emitter.setMaxListeners(500);
        this.#emitterOncePerTick.setMaxListeners(500);
        this.#emitterOncePerFrame.setMaxListeners(500);
    }

    /**
     * @param { keyof T } key
     */
    emit ( key ) {
        const k = key.toString();
        
        this.#emitter.emit(k, this);
        this.#emitter.emit('any', this);

        this.#emitterOncePerTick.emit(k, this);
        this.#emitterOncePerTick.emit('any', this);

        this.#emitterOncePerFrame.emit(k, this);
        this.#emitterOncePerFrame.emit('any', this);
    }

    /**
     * @param { keyof T } key
     * @param { function( T ) : void } callback
     */
    once ( key, callback ) {
        this.#emitter.once( key.toString(), callback );
    }

    /**
     * @param { keyof T | 'any' } key
     * @param { function( T ) : void } callback
     */
    on ( key, callback ) {
        this.#emitter.on( key.toString(), callback );
        if ( this.#immediate.get(key) )
            callback.call( this, this );
    }

    /**
     * @param { keyof T } key
     * @param { function( T ) : void } callback
     */
    onTick ( key, callback ) {
        this.#emitterOncePerTick.on( key.toString(), callback);
        if ( this.#immediate.get(key) )
            callback.call( this );
    }

    /**
     * @param { keyof T } key
     * @param { function( T ) : void } callback
     */
    onFrame ( key, callback ) {
        this.#emitterOncePerFrame.on( key.toString(), callback );
        if ( this.#immediate.get(key) )
            callback.call( this );
    }

    /**
     * @param { keyof T | 'any' } key
     * @param { function( T ) : void } callback
     */
    off ( key, callback ) {
        this.#emitter.off( key.toString(), callback );
        this.#emitterOncePerTick.off( key.toString(), callback );
        this.#emitterOncePerFrame.off( key.toString(), callback );
    }

    /**
     * @param { keyof T } key
     */
    removeAllListeners ( key ) {
        this.#emitter.removeAllListeners( key.toString() );
        this.#emitterOncePerTick.removeAllListeners( key.toString() );
        this.#emitterOncePerFrame.removeAllListeners( key.toString() );
    }
    
}

export default ObservableMulti;