


/**
 * Utility function to listen to an event on an emitter, emit it immediately,
 * and ensure the listener is removed when the socket disconnects.
 * @template {string} EventName
 * @param {{on(ev: 'disconnect', lst: ()=>void) : void}} socket - Enhanced socket
 * @param {{on:function(EventName,()=>any):void, off:function(EventName,()=>any):void}} emitter - Emitter to listen to
 * @param {EventName} event - event to listen to (must be string)
 * @param {()=>any} listener - listener function to call on event
 */
export function emitNowAndListenToEmitterUntilDisconnect(socket, emitter, event, listener) {
    try {
        // Listen to the event
        emitter.on(event, listener);

        // Cleanup listener to prevent memory leak
        socket.on('disconnect', () => {
            emitter.off(event, listener);
        });

        // Emit the event immediately if it has already occurred
        listener();
    } catch (error) {
        console.error('[emitNowAndListenToEmitterUntilDisconnect.js] Error setting up listener:', error.message);
    }
}


/**
 * Utility function to listen to an event on an emitter, emit it immediately,
 * and ensure the listener is removed when the socket disconnects, with a more fluent API.
 * @template {string} EventName
 * @param {{on:function(EventName,()=>any):void, off:function(EventName,()=>any):void}} emitter - Emitter to listen to
 * @returns {{
 *      on: function(EventName, ()=>any): {
 *              untilDisconnect: function({on(ev: 'disconnect', lst: ()=>void) : void}): {
 *                      emitNow: function(): void }
 *      }
 * }}
 */
export function enhanceEmitter(emitter) {
    return {
        /**
         * @param {EventName} event - event to listen to (must be string)
         * @param {()=>any} listener - listener function to call on event
         */
        on: function listenToEmitter(event, listener) {
            const listenerWrapper = () => {
                try {
                    listener();
                } catch (error) {
                    console.error('[emitNowAndListenToEmitterUntilDisconnect.js] Error calling listener:', error.message);
                }
            };
            try {
                // Listen to the event
                emitter.on(event, listenerWrapper);

                return {
                    /**
                     * @param {{on(ev: 'disconnect', lst: ()=>void) : void}} socket - Enhanced socket
                     */
                    untilDisconnect: (socket) => {
                        try {
                            // Cleanup listener to prevent memory leak
                            socket.on('disconnect', () => {
                                emitter.off(event, listenerWrapper);
                            });

                            return {
                                emitNow() {
                                    // Emit the event immediately if it has already occurred
                                    listenerWrapper();
                                }
                            };
                        } catch (error) {
                            console.error('[emitNowAndListenToEmitterUntilDisconnect.js] Error setting up disconnect listener:', error.message);
                        }
                    }
                };
            } catch (error) {
                console.error('[emitNowAndListenToEmitterUntilDisconnect.js] Error setting up listener:', error.message);
            }
        }
    }
}



// emitNowAndListenToEmitterUntilDisconnect(
//     { on: (event, callback) => console.log(`Socket listening to ${event}`) },
//     { on: (event, callback) => console.log(`Emitter listening to ${event}`),
//       off: (event, callback) => console.log(`Emitter stopped listening to ${event}`)
//     },
//     'penalty',
//     () => console.log('Penalty event emitted')
// );

// listenToEmitter(
//     { on: (event, callback) => console.log(`Emitter listening to ${event}`),
//       off: (event, callback) => console.log(`Emitter stopped listening to ${event}`)
//     },
//     'penalty',
//     () => console.log('Penalty event emitted')
// ).untilDisconnect(
//     { on: (event, callback) => console.log(`Socket listening to ${event}`) }
// ).emitNow();
