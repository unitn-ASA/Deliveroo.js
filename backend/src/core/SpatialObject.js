import EventEmitter from 'events';
import { watchProperty } from '../reactivity/watchProperty.js';
import { atNextTick } from '../reactivity/postponeAt.js';
import ObservableAttributes from './ObservableAttributes.js';

/**
 * @typedef {{
 *   xy: [import('./Xy.js').default | undefined],
 *   attributes: [Array<import('@unitn-asa/deliveroo-js-sdk/types/IOAttribute.js').IOAttribute>],
 *   changed: [{object: SpatialObject, key: string}],
 *   deleted: [SpatialObject]
 * }} SpatialObjectEvents
 */

/** Shared observable spatial lifecycle for domain objects. */
class SpatialObject {
    /** @type {EventEmitter<SpatialObjectEvents>} */
    #emitter = new EventEmitter();
    /** @returns {EventEmitter<SpatialObjectEvents>} */
    get emitter() { return this.#emitter; }

    /** @type {import('./Xy.js').default} */
    xy;
    get x() { return this.xy?.x; }
    get y() { return this.xy?.y; }

    /** Plugin-owned observable numeric attributes. */
    attributes = new ObservableAttributes();
    #deleted = false;

    /** @param {{xy?: import('./Xy.js').default, attributes?: {kind: string, value: number | string, max?: number}[]}} [options] */
    constructor({ xy, attributes = [] } = {}) {
        this.#emitter.setMaxListeners(0);
        this.attributes.onChanged((next) => {
            this.#emitter.emit('attributes', next);
            this.#emitter.emit('changed', { object: this, key: 'attributes' });
        });
        watchProperty({
            target: this,
            key: 'xy',
            callback: atNextTick((target, key, value) => {
                target.emitter.emit(key, value);
                target.emitter.emit('changed', { object: target, key });
            })
        });
        this.xy = xy;
        for (const attribute of attributes) {
            this.attributes.set(attribute.kind, attribute.value, attribute.max);
        }
    }

    delete() {
        if (this.#deleted) return;
        this.#deleted = true;
        this.#emitter.emit('deleted', this);
        this.#emitter.removeAllListeners();
    }
}

export default SpatialObject;
