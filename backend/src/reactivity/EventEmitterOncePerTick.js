import EventEmitter from 'events';



/**
 * EventEmitter that coalesces multiple emits of the same event
 * into a single emission per Node.js tick.
 *
 * @template { Record<keyof T, T[keyof T]> } T
 * @extends { EventEmitter<Record<keyof T, T[keyof T]>> }
 */
export default class EventEmitterOncePerTick extends EventEmitter {

    /** @type {Set<keyof T>} */
    #scheduled = new Set()
    
    /**
     * Emit an event at most once per Node.js tick.
     * If the same event is triggered multiple times in the same tick,
     * only the first one is emitted.
     * 
     * @inheritdoc
     * @param {keyof T} eventName
     * @param {T[keyof T]} args
     * @returns {boolean}
     */ 
    // @ts-ignore
    emit (eventName, ...args) {
        if (this.#scheduled.has(eventName)) return true;

        this.#scheduled.add(eventName);

        process.nextTick(() => {
            this.#scheduled.delete(eventName);
            // @ts-ignore
            super.emit(eventName, ...args);
        });

        return true;
    }

}



// Example usage:
// 
// /** @type {EventEmitter<{log: [string,number]}>} */
// const ev = new EventEmitter();
// ev.on('log', (a,b) => {a;b;} );
// ev.emit('log', 'hi', 123);

// /** @type {EventEmitterOncePerTick<{log: [string,number]}>} */
// const emitter = new EventEmitterOncePerTick();
// emitter.on('log', (a,b) => {a; b;} );
// emitter.emit('log', 'hi', 123);
// // emitter.emitOnePerTick('log', 'hi', 2);
// emitter.addListener('log', (a,b) => {a; b;} );
