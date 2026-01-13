import { AbstractSocketWrapper } from './AbstractSocketWrapper.js';

/**
 * @class
 * @template { Record< string, function(...any):void > } onEv events to be listened with .on
 * @template { Record< string, function(...any):void > } emitEv events to be emitted with .emit
 * @extends { AbstractSocketWrapper<
 *                          onEv,
 *                          emitEv,
 *                          import("socket.io-client").Socket< onEv, emitEv >
 * > }
 */
export class AbstractSocketClientWrapper extends AbstractSocketWrapper {

    /**
     * @param { import("socket.io-client").Socket< onEv, emitEv > } socket 
     */
    constructor ( socket ) {
        super( socket );
    }



    connect () {
        // console.log( "Connection.connect() connecting to", HOST, "with token:", this.token.slice(0,10)+'...' );
        return this.socket.connect();
    }

}
