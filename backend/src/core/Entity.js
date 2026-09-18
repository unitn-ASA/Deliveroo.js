import SpatialObject from './SpatialObject.js';

/**
 * Plugin-owned spatial entity.
 *
 * Its observable attributes are the only extension state exposed through
 * sensing. Plugin behavior remains private to the plugin that owns it.
 */
class Entity extends SpatialObject {

    /** @type {string} */
    id;
    /** @type {string} */
    kind;

    /**
     * @param {{id: string, kind: string, xy: import('./Xy.js').default, attributes?: {kind: string, value: number, max?: number}[]}} options
     */
    constructor({ id, kind, xy, attributes = [] }) {
        super({ xy, attributes });
        this.id = id;
        this.kind = kind;
    }

    /** @returns {import('@unitn-asa/deliveroo-js-sdk/types/IOEntity.js').IOEntity} */
    toIO() {
        return { id: this.id, kind: this.kind, x: this.x, y: this.y, attributes: this.attributes.toArray() };
    }
}

export default Entity;
