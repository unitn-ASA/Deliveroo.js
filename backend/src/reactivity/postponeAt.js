
/**
 * Postpone execution of a function so that it runs **at most once**
 * in a given asynchronous phase, using the **latest arguments**.
 *
 * Multiple calls before execution will overwrite previous arguments.
 * The wrapped function is invoked only once when the scheduled phase occurs.
 *
 * This is similar to a debounce with zero delay, where the delay is
 * defined by the async boundary (nextTick, setImmediate, promise, etc.).
 *
 * Typical use cases:
 * - batching state changes
 * - flushing ECS change queues
 * - recomputing sensing once per tick
 * - avoiding redundant UI or network updates
 */



/**
 * Wrap a callback so it is executed at most once at nextTick.
 * Multiple calls before execution are coalesced.
 *
 * @template {any[]} A
 * @param {(...args: A) => void} fn
 * @returns {(...args: A) => void}
 */
export function atNextTick(fn) {
    /** @type {A} */
    let lastArgs;

    let scheduled = false;

    return (...args) => {
        lastArgs = args;

        if (scheduled) return;
        scheduled = true;

        process.nextTick(() => {
            scheduled = false;
            fn(...lastArgs);
        });
    };
}

/**
 * Wrap a callback so it is executed at most once at setImmediate.
 * Multiple calls before execution are coalesced.
 *
 * @template {any[]} A
 * @param {(...args: A) => void} fn
 * @returns {(...args: A) => void}
 */
export function atSetImmediate(fn) {
    /** @type {A} */
    let lastArgs;

    let scheduled = false;

    return (...args) => {
        lastArgs = args;

        if (scheduled) return;
        scheduled = true;

        setImmediate(() => {
            scheduled = false;
            fn(...lastArgs);
        });
    }
}

/**
 * Wrap a callback so it is executed at most once at setTimeout(0).
 * Multiple calls before execution are coalesced.
 *
 * @template {any[]} A
 * @param {(...args: A) => void} fn
 * @returns {(...args: A) => void}
 */
export function atSetTimeout(fn) {
    /** @type {A} */
    let lastArgs;

    let scheduled = false;

    return (...args) => {
        lastArgs = args;

        if (scheduled) return;
        scheduled = true;

        setTimeout(() => {
            scheduled = false;
            fn(...lastArgs);
        }, 0);
    }

}

/**
 * Wrap a callback so it is executed at most once when the given promise resolves.
 * Multiple calls before execution are coalesced.
 *
 * @template {any[]} A
 * @param {Promise<any>} promise
 * @param {(...args: A) => void} fn
 * @returns {(...args: A) => void}
 */
export function atPromise(promise, fn) {
    /** @type {A} */
    let lastArgs;

    let scheduled = false;

    return (...args) => {
        lastArgs = args;

        if (scheduled) return;
        scheduled = true;

        promise.then(() => {
            scheduled = false;
            fn(...lastArgs);
        });
    }
}
