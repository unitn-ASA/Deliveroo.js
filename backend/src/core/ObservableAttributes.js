import EventEmitter from 'events';

/**
 * Observable numeric attributes owned by plugins.
 *
 * An owner can only update or remove attributes it created. This keeps
 * plugin shutdown local: deleteByOwner(pluginId) cannot erase another
 * plugin's state.
 */
class ObservableAttributes extends EventEmitter {

    /** @type {Map<string, [{kind: string, value: number, max?: number}, string | undefined]>} */
    #attributes = new Map();

    constructor() {
        super();
        this.setMaxListeners(0);
    }

    /**
     * @param {string} kind
     * @param {number} value
     * @param {number} [max]
     * @param {{owner?: string}} [options]
     */
    set(kind, value, max, { owner } = {}) {
        const existing = this.#attributes.get(kind);
        if (existing && existing[1] !== owner) {
            throw new Error(`Attribute '${kind}' is owned by '${existing[1] ?? 'core'}'`);
        }
        this.#attributes.set(kind, [{ kind, value, ...(max === undefined ? {} : { max }) }, owner]);
        this.emit('changed', this.toArray());
    }

    /**
     * @param {string} kind
     * @returns {{kind: string, value: number, max?: number} | undefined}
     */
    get(kind) {
        const attribute = this.#attributes.get(kind)?.[0];
        return attribute && { ...attribute };
    }

    /**
     * @param {string} kind
     * @param {{owner?: string}} [options]
     */
    delete(kind, { owner } = {}) {
        const existing = this.#attributes.get(kind);
        if (!existing) return false;
        if (existing[1] !== owner) {
            throw new Error(`Attribute '${kind}' is owned by '${existing[1] ?? 'core'}'`);
        }
        this.#attributes.delete(kind);
        this.emit('changed', this.toArray());
        return true;
    }

    /** @param {string} owner */
    deleteByOwner(owner) {
        let changed = false;
        for (const [kind, [, attributeOwner]] of this.#attributes) {
            if (attributeOwner === owner) {
                this.#attributes.delete(kind);
                changed = true;
            }
        }
        if (changed) this.emit('changed', this.toArray());
        return changed;
    }

    /** @returns {{kind: string, value: number, max?: number}[]} */
    toArray() {
        return Array.from(this.#attributes.values(), ([attribute]) => ({ ...attribute }));
    }

    /** @param {(attributes: {kind: string, value: number, max?: number}[]) => void} callback */
    onChanged(callback) {
        this.on('changed', callback);
    }

    /** @param {(attributes: {kind: string, value: number, max?: number}[]) => void} callback */
    offChanged(callback) {
        this.off('changed', callback);
    }
}

export default ObservableAttributes;
