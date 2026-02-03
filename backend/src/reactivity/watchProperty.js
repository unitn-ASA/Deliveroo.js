
import { trackMutations } from './trackMutations.js';


/**
 * @template {{}} T
 * @template {keyof T} K
 * @typedef {Object} WatchPropertyOptions
 * @property {T} target - The object containing the property to watch
 * @property {K} key - The property key to watch
 * @property {function(T, K, T[K]):void} callback - Called when the property changes, with arguments (target, key, newValue)
 */

/**
 * Watch the target property (identified by the key) and call the callback(key) function when it changes.
 * 
 * This is done by wrapping target property with a setter.
 * In the case of a Set or Map, it will also track for mutations (add, delete, clear, set).
 * 
 * @template {{}} T
 * @template {keyof T} K
 * @function watchProperty
 * @param {WatchPropertyOptions<T, K>} watchPropertyOptions 
 */
export function watchProperty({
    target,
    key,
    callback
}) {
    const descriptor = Object.getOwnPropertyDescriptor(target, key);
    let stored = trackMutations(descriptor?.value, () => callback(target, key, descriptor?.value));

    Object.defineProperty(target, key, {
        get() {
            return stored;
        },
        set(value) {
            if (value !== stored) {
                stored = trackMutations(value, () => callback(target, key, descriptor?.value));
                callback(target, key, value);
            }
        },
        configurable: true
    });
}
