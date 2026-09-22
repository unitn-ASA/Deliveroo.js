import { EventEmitter } from 'events';

/**
 * CommandBus executes commands through the handler registered on this bus.
 *
 * Unlike the grid emitter (which broadcasts game-state facts to any number of
 * listeners), a command has exactly one handler. This guarantees a command is
 * executed and acknowledged once, never twice.
 *
 * Commands are joystick-like buttons: parameterless in practice. A handler
 * receives the dispatch payload `{ ...params, ack }` and native commands never
 * use params, but the wire keeps an optional params object for future plugin
 * commands. An optional descriptor documents the command for the REST
 * discovery (GET /api/agents/:id/commands).
 *
 * claim() atomically displaces the current handler: it is how attribute-driven
 * mode components take over command slots. Every registration change emits
 * 'changed' with the registered command list: the default command providers
 * (e.g. the standard movement) listen to it and self-heal freed slots.
 */
class CommandBus extends EventEmitter {

    /** @type {Map<string, {owner: string, handler: Function, descriptor: {description?: string, params?: Record<string, string>} | null}>} */
    #handlers = new Map();

    constructor() {
        super();
        this.setMaxListeners(0);
    }

    /**
     * Register the single handler for a command on this bus.
     * @param {string} command - Command name, e.g. 'up' or 'pickup'
     * @param {Function} handler - Handler function receiving the command payload
     * @param {string} owner - Id of the component taking ownership (e.g. plugin id)
     * @param {{description?: string, params?: Record<string, string>}} [descriptor] - Documentation for the REST discovery
     */
    handle ( command, handler, owner, descriptor ) {
        if ( typeof handler !== 'function' ) {
            throw new Error( `CommandBus: handler for '${command}' must be a function` );
        }
        if ( this.#handlers.has( command ) ) {
            throw new Error( `CommandBus: handler for '${command}' is already registered` );
        }
        this.#handlers.set( command, { owner, handler, descriptor: descriptor ?? null } );
        this.emit( 'changed', this.getRegisteredCommands() );
    }

    /**
     * Atomically take over a command slot, displacing any current handler.
     * Unlike handle(), never throws on an existing handler.
     * @param {string} command
     * @param {string} owner
     * @param {Function} handler
     * @param {{description?: string, params?: Record<string, string>}} [descriptor]
     */
    claim ( command, owner, handler, descriptor ) {
        if ( typeof handler !== 'function' ) {
            throw new Error( `CommandBus: handler for '${command}' must be a function` );
        }
        this.#handlers.set( command, { owner, handler, descriptor: descriptor ?? null } );
        this.emit( 'changed', this.getRegisteredCommands() );
    }

    /**
     * Remove the handler for a command, but only if it is owned by `owner`.
     * @param {string} command
     * @param {string} owner
     */
    release ( command, owner ) {
        const current = this.#handlers.get( command );
        if ( current && current.owner === owner ) {
            this.#handlers.delete( command );
            this.emit( 'changed', this.getRegisteredCommands() );
        }
    }

    /**
     * @param {string} command
     * @returns {boolean}
     */
    hasHandler ( command ) {
        return this.#handlers.has( command );
    }

    /**
     * Dispatch a command payload to its handler.
     * @param {string} command
     * @param {object} payload
     * @returns {boolean} true if a handler was found and invoked, false otherwise
     */
    dispatch ( command, payload ) {
        const entry = this.#handlers.get( command );
        if ( ! entry ) {
            return false;
        }
        entry.handler( payload );
        return true;
    }

    /**
     * Dispatch a query-like command to an optional handler method. This keeps
     * callers owner-agnostic while still allowing components to expose cheap
     * checks such as movement plausibility.
     * @param {string} command
     * @param {string} method
     * @param {object} payload
     * @param {any} [fallback]
     * @returns {any}
     */
    ask ( command, method, payload, fallback = undefined ) {
        const entry = this.#handlers.get( command );
        const fn = entry?.handler?.[method];
        if ( typeof fn !== 'function' ) {
            return fallback;
        }
        return fn( payload );
    }

    /**
     * Dispatch a command and resolve with the acknowledgement value.
     * Useful for internal actors that should use the same replaceable command
     * path as sockets, without manually wiring callbacks every time.
     * @param {string} command
     * @param {object} payload
     * @param {any} [fallback]
     * @returns {Promise<any>}
     */
    execute ( command, payload, fallback = undefined ) {
        return new Promise( (resolve) => {
            const dispatched = this.dispatch( command, { ...payload, ack: resolve } );
            if ( ! dispatched ) {
                resolve( fallback );
            }
        } );
    }

    /**
     * @param {string} command
     * @returns {string | null}
     */
    getOwner ( command ) {
        return this.#handlers.get( command )?.owner ?? null;
    }

    /**
     * @returns {{command: string, owner: string, description?: string, params?: Record<string, string>}[]}
     */
    getRegisteredCommands () {
        return Array.from( this.#handlers.entries() )
            .map( ( [ command, { owner, descriptor } ] ) => ( {
                command,
                owner,
                ...( descriptor?.description ? { description: descriptor.description } : {} ),
                ...( descriptor?.params ? { params: descriptor.params } : {} )
            } ) );
    }

}

export { CommandBus };
export default CommandBus;
