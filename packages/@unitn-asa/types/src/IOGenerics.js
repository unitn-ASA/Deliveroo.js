
/**
 * @class
 * @template { Record< string, function(...any):void > } onEv events to be listened with .on
 * @template { Record< string, function(...any):void > } emitEv events to be emitted with .emit
 * @template { import("socket.io-client").Socket | import("socket.io").Socket } soc the type of the socket
 */
class IOTypedSocketClient {

    /** @type { soc } */
    socket;

    /**
     * @type {string}
     */
    get id () { return this.socket.id }

    disconnect () {
        this.socket.disconnect();
    }

    /**
     * @template {keyof onEv} K
     * @param {K} event
     * @param {onEv[K]} listener
     * @returns {void}
     */
    on ( event, listener ) {
        this.socket.on( event.toString(), listener );
    }

    /**
     * @param {(event:string, ...any)=>void} listener
     * @returns {void}
     */
    onAny ( listener ) {
        this.socket.onAny( listener );
    }

    /**
     * @template {keyof onEv} K
     * @param {K} event
     * @param {onEv[K]} listener
     * @returns {void}
     */
    once ( event, listener ) {
        this.socket.once( event.toString(), listener );
    }
    
    /**
     * @template { keyof emitEv } K
     * @param { K } event
     * @param { Parameters<emitEv[K]> } args
     * @returns { void }
     */
    emit ( event, ...args ) {
        this.socket.emit( event.toString(), ...args );
    }
    
    /**
     * @template { keyof emitEv } K
     * @param { K } event
     * @param { Parameters<emitEv[K]> } args
     * @returns { Promise < any > }
     */
    async emitAndResolveOnAck ( event, ...args ) {
        return this.socket.timeout( 1000 ).emitWithAck( event.toString(), ...args );
    }

    /**
     * @param { soc } socket 
     */
    constructor ( socket ) {
        this.socket = socket;
    }
}

module.exports = IOTypedSocketClient;