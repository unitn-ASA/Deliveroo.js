import SpatialRegistry from './SpatialRegistry.js';
import EventEmitter from 'events';

/**
 * Minimum spatial object contract managed by a SpatialLayer.
 * @typedef {{
 *   id: string,
 *   xy: import('./Xy.js').default,
 *   x: number,
 *   y: number,
 *   emitter: EventEmitter<any>
 * }} SpatialLayerObject
 */

/**
 * @template T
 * @typedef {{layer: SpatialLayer<any>, object: T | null, type: 'added' | 'changed' | 'removed'}} SpatialLayerChange
 */

/**
 * @template T
 * @typedef {{changed: [SpatialLayerChange<T>]}} SpatialLayerEvents
 */
/**
 * A registry of observable spatial objects.
 *
 * Layers own indexing and change propagation, not object construction. A
 * specialized layer such as EntityLayer decides how objects are created,
 * then adds them here for lifecycle management.
 *
 * @template {SpatialLayerObject} T
 * @class SpatialLayer
 */
class SpatialLayer {

    /** @type {string} */
    #id;
    /** @type {SpatialRegistry} */
    #registry = new SpatialRegistry();
    /** @type {EventEmitter<SpatialLayerEvents<T>>} */
    #emitter = new EventEmitter();
    /** @type {Map<string, {xy: () => void, changed: () => void, deleted: () => void}>} */
    #listeners = new Map();

    /**
     * @param {Object} options
     * @param {string} options.id - Layer id (usually "pluginId:name")
     */
    constructor({ id }) {
        this.#id = id;
        this.#emitter.setMaxListeners(0); // unlimited listeners
    }

    /** @type {string} */
    get id() { return this.#id; }

    /**
     * Register an existing spatial object and begin forwarding its changes.
     * @param {T} object
     * @returns {T}
     */
    add(object) {
        if (!object?.id || !object.emitter) {
            throw new Error('SpatialLayer: object must have an id and emitter');
        }
        if (this.#listeners.has(object.id)) {
            throw new Error(`SpatialLayer: object '${object.id}' is already registered`);
        }

        this.#registry.updateSpatialIndex(object);
        const changed = () => {
            this.#emitter.emit('changed', { layer: this, object, type: 'changed' });
        };
        const xy = () => this.#registry.updateSpatialIndex(object);
        const deleted = () => this.remove(object);
        object.emitter.on('xy', xy);
        object.emitter.on('changed', changed);
        object.emitter.once('deleted', deleted);
        this.#listeners.set(object.id, { xy, changed, deleted });
        this.#emitter.emit('changed', { layer: this, object, type: 'added' });
        return object;
    }

    /**
     * Remove an object from this layer without deleting the object itself.
     * @param {T | string} object
     * @returns {boolean}
     */
    remove(object) {
        const id = typeof object === 'string' ? object : object.id;
        const stored = this.#registry.get(id);
        const listeners = this.#listeners.get(id);
        if (!stored || !listeners) return false;
        stored.emitter.off('xy', listeners.xy);
        stored.emitter.off('changed', listeners.changed);
        stored.emitter.off('deleted', listeners.deleted);
        this.#listeners.delete(id);
        this.#registry.remove(id);
        this.#emitter.emit('changed', { layer: this, object: stored, type: 'removed' });
        return true;
    }

    /** @param {string} id @returns {T | undefined} */
    get(id) {
        return this.#registry.get(id);
    }

    /**
     * @param {any} xy
     * @returns {T | undefined}
     */
    getOneByXy(xy) {
        return this.#registry.getOneByXy(xy);
    }

    /**
     * @param {any} xy
     * @returns {Array<T>}
     */
    getByXy(xy) {
        return this.#registry.getByXy(xy);
    }

    /**
     * @returns {Iterable<T>}
     */
    getIterator() {
        return this.#registry.getIterator();
    }

    getSize() { return this.#registry.getSize(); }
    getMaxX() { return this.#registry.getMaxX(); }
    getMaxY() { return this.#registry.getMaxY(); }
    getMaxXy() { return this.#registry.getMaxXy(); }

    /**
     * Delete every object that supports deletion; otherwise remove it.
        */
    clear() {
        for (const object of Array.from(this.getIterator())) {
            const deletable = /** @type {{delete?: () => void}} */ (object);
            if (typeof deletable.delete === 'function') deletable.delete();
            else this.remove(object);
        }
    }

    /**
     * @param {(event: {layer: SpatialLayer, object: T | null, type: 'added' | 'changed' | 'removed'}) => void} callback
     */
    onChanged(callback) {
        this.#emitter.on('changed', callback);
    }

    /**
     * @param {(event: {layer: SpatialLayer, object: T | null, type: 'added' | 'changed' | 'removed'}) => void} callback
     */
    offChanged(callback) {
        this.#emitter.off('changed', callback);
    }

}

export default SpatialLayer;
