/**
 * Mutex for exclusive action execution.
 * Ensures only one action runs at a time per instance.
 * Applies a custom callback when concurrent actions are attempted.
 *
 * @example
 * class Agent {
 *     constructor() {
 *         this.actionMutex = new ActionMutex(myClock, {
 *             onConflict: () => {
 *                 this.penalty -= config.PENALTY;
 *                 console.warn(`${this.name} got penalty!`);
 *             }
 *         });
 *     }
 *
 *     async move() {
 *         return await this.actionMutex.execute(() => {
 *             // action logic here
 *         });
 *     }
 * }
 */
export class ActionMutex {
    #isLocked = false;
    #currentAction = null;

    /**
     * @param {object} clock - Clock object with synch() method
     * @param {object} options
     * @param {Function} [options.onConflict] - Callback when action is attempted while locked
     */
    constructor(clock, { onConflict } = {}) {
        this.clock = clock;
        this.onConflict = onConflict;
    }

    /**
     * Execute an action exclusively.
     * Returns false and calls onConflict if already locked.
     *
     * @param {Function} actionFn - The action to execute
     * @returns {Promise<any>}
     */
    async execute(actionFn) {
        if (this.#isLocked) {
            // Immediately apply onConflict callback if provided
            this.onConflict?.();
            return false;
        }
        // Lock immediately to prevent race conditions
        this.#isLocked = true;
        // Ensure the clock is synchronized before executing the action
        // await this.clock.synch();
        const actionPromise = (async () => {
            try {
                return await actionFn();
            } finally {
                this.#isLocked = false;
                this.#currentAction = null;
            }
        })();
        this.#currentAction = actionPromise;
        return actionPromise;
    }

    /**
     * Wait for the current action to complete.
     * Returns immediately if no action is running.
     *
     * @returns {Promise<void>}
     */
    async waitIdle() {
        await this.#currentAction;
    }

    /**
     * @returns {boolean} Whether the mutex is currently locked
     */
    get isLocked() {
        return this.#isLocked;
    }
}
