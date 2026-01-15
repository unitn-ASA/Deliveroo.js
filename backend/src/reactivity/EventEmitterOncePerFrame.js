import EventEmitter from 'events';
import myClock from '../myClock.js';



/**
 * EventEmitter that coalesces multiple emits of the same event
 * into a single emission per clock frame.
 *
 * @template { Record<keyof T, T[keyof T]> } T
 * @extends { EventEmitter<Record<keyof T, T[keyof T]>> }
 */
export default class EventEmitterOncePerFrame extends EventEmitter {

    /** @type {Set<keyof T>} */
    #scheduled = new Set()
    
    /**
     * Emit an event at most once per clock.frame
     * If the same event is triggered multiple times in the same frame,
     * only the first one is emitted.
     * 
     * @param {keyof T} event
     * @param {T[keyof T]} args
     * @returns {void}
     */ 
    // @ts-ignore
    emit (event, ...args) {
        if (this.#scheduled.has(event)) return;

        this.#scheduled.add(event);

        myClock.once('frame', () => {
            this.#scheduled.delete(event);
            // @ts-ignore
            super.emit(event, ...args);
        });
    }

}
