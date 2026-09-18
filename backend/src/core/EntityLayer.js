import Entity from './Entity.js';
import SpatialLayer from './SpatialLayer.js';

/** A SpatialLayer specialized in constructing plugin-owned Entity objects. */
class EntityLayer extends SpatialLayer {

    #lastId = 0;

    /**
     * @param {{kind: string, xy: import('./Xy.js').default, attributes?: {kind: string, value: number, max?: number}[]}} descriptor
     * @returns {Entity}
     */
    create({ kind, xy, attributes }) {
        return this.add(new Entity({
            id: `${this.id}:${++this.#lastId}`,
            kind,
            xy,
            attributes
        }));
    }
}

export default EntityLayer;
