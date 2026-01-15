
import { trackMutations } from './trackMutations.js';


/**
 * @typedef {Object} WatchPropertyOptions
 * @property {Object} target - The object containing the property to watch
 * @property {string | number | symbol} key - The property key to watch
 * @property {function(string | number | symbol):any} callback - Called when the property changes, with the key as argument
 * @property {boolean} [immediate=false] - Whether to emit immediately upon setup
 */

/**
 * Watch the target property (identified by the key) and call the callback(key) function when it changes.
 * 
 * This is done by wrapping target property with a setter.
 * In the case of a Set or Map, it will also track for mutations (add, delete, clear, set).
 * 
 * @param {WatchPropertyOptions} watchPropertyOptions 
 */
export function watchProperty({
    target,
    key,
    callback,
    immediate = false
}) {
    const descriptor = Object.getOwnPropertyDescriptor(target, key);
    let stored = trackMutations(descriptor?.value, () => callback(key));

    Object.defineProperty(target, key, {
        get() {
            return stored;
        },
        set(value) {
            if (value !== stored) {
                stored = trackMutations(value, () => callback(key));
                callback(key);
            }
        },
        configurable: true
    });

    if (immediate) callback(key);
}
