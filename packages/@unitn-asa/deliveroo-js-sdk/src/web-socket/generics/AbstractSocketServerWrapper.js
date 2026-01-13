import { AbstractSocketWrapper } from './AbstractSocketWrapper.js';



/**
 * @class
 * @template { Record< string, function(...any):void > } onEv events to be listened with .on
 * @template { Record< string, function(...any):void > } emitEv events to be emitted with .emit
 * @extends { AbstractSocketWrapper<
 *                          onEv,
 *                          emitEv,
 *                          import("socket.io").Socket< onEv, emitEv >
 * > }
 */
export class AbstractSocketServerWrapper extends AbstractSocketWrapper {

    /**
     * @param {string} room
     */
    to ( room ) {
        return {
            /**
             * @template {keyof emitEv} K
             * @param {K} event
             * @param {Parameters<emitEv[K]>} args
             */
            emit: ( event, ...args ) => {
                /** @type {any} */ (this.socket).to( room ).emit( event, ...args );
            },
            fetchSockets: () => this.socket.to( room ).fetchSockets()
        };
    }
    
    get broadcast () {

        return {
            /**
             * @template {keyof emitEv} K
             * @param {K} event
             * @param {Parameters<emitEv[K]>} args
             * @returns {boolean}
             */
            emit: ( event, ...args ) =>
                /** @type {any} */ (this.socket).broadcast.emit( event, ...args )
        }
    }

}
