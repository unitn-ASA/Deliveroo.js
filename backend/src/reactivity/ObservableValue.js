const PostponerEventEmitter = require('./PostponerEventEmitter');

/**
 * @template T
 */
class ObservableValue {

    /**
     * @type { PostponerEventEmitter<'immediate'|'tick'|'frame'> }
     */
    #eventEmitter = new PostponerEventEmitter();

    /** @type {T} */
    #value;

    /**
     * @returns {T}
     */
    get value() {
        return this.#value;
    }

    /**
     * @param {T} value
     */
    set value(value) {
        if ( value != this.#value ) {
            this.#value = value;
            this.#eventEmitter.emit( 'immediate', this );
            this.#eventEmitter.emitOnePerTick( 'tick', this );
            this.#eventEmitter.emitOnePerFrame( 'frame', this );
        }
    }

    /**
     * @param {T} value
     */
    constructor(value) {
        this.#eventEmitter.setMaxListeners(500);
        this.#value = value;
    }

    /**
     * @param {function(ObservableValue<T>):void} callback
     */
    on ( callback ) {
        this.#eventEmitter.on('immediate', callback);
    }

    /**
     * @param {function(ObservableValue<T>):void} callback
     */
    onTick ( callback ) {
        this.#eventEmitter.on('tick', callback);
    }

    /**
     * @param {function(ObservableValue<T>):void} callback
     */
    onFrame ( callback ) {
        this.#eventEmitter.on('frame', callback);
    }

    /**
     * @param {function(ObservableValue<T>):void} callback
     */
    off ( callback ) {
        this.#eventEmitter.off('immediate', callback);
        this.#eventEmitter.off('tick', callback);
        this.#eventEmitter.off('frame', callback);
    }
    
}

module.exports = ObservableValue;