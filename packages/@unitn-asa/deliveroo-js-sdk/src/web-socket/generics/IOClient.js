import { IOGenerics } from './IOGenerics.js';

/**
 * @class
 * @template { Record< string, function(...any):void > } onEv events to be listened with .on
 * @template { Record< string, function(...any):void > } emitEv events to be emitted with .emit
 * @extends { IOGenerics<
 *                          onEv,
 *                          emitEv,
 *                          import("socket.io-client").Socket< onEv, emitEv >
 * > }
 */
export class IOClient extends IOGenerics {

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
