import EventEmitter from 'events';

/**
 * Observable attributes exposed through sensing.
 *
 * Whoever knows a kind name may read, update or remove it: collisions
 * between producers are prevented by kind naming conventions, not by
 * enforcement. This lets configurations seed values that plugins later
 * adopt and manage at runtime.
 */
class ObservableAttributes extends EventEmitter {

    /** @type {Map<string, {kind: string, value: number | string, max?: number}>} */
    #attributes = new Map();

    constructor() {
        super();
        this.setMaxListeners(0);
    }

    /**
     * @param {string} kind
     * @param {number | string} value
     * @param {number} [max] - Only allowed when the value is numeric
     */
    set(kind, value, max) {
        if (typeof value !== 'number' && typeof value !== 'string') {
            throw new Error(`Attribute '${kind}' must have a number or string value`);
        }
        if (max !== undefined && typeof value !== 'number') {
            throw new Error(`Attribute '${kind}' can only have a max when its value is numeric`);
        }
        this.#attributes.set(kind, { kind, value, ...(max === undefined ? {} : { max }) });
        this.emit('changed', this.toArray());
    }

    /**
     * @param {string} kind
     * @returns {{kind: string, value: number | string, max?: number} | undefined}
     */
    get(kind) {
        const attribute = this.#attributes.get(kind);
        return attribute && { ...attribute };
    }

    /**
     * @param {string} kind
     */
    delete(kind) {
        const deleted = this.#attributes.delete(kind);
        if (deleted) this.emit('changed', this.toArray());
        return deleted;
    }

    /** @returns {{kind: string, value: number | string, max?: number}[]} */
    toArray() {
        return Array.from(this.#attributes.values(), (attribute) => ({ ...attribute }));
    }

    /** @param {(attributes: {kind: string, value: number | string, max?: number}[]) => void} callback */
    onChanged(callback) {
        this.on('changed', callback);
    }

    /** @param {(attributes: {kind: string, value: number | string, max?: number}[]) => void} callback */
    offChanged(callback) {
        this.off('changed', callback);
    }
}

export default ObservableAttributes;
