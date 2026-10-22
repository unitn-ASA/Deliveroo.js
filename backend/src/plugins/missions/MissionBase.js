import { communicationsHub } from '../../ioServer/communicationsHub.js';
import PluginBase from '../PluginBase.js';
import { actionHooks } from '../../core/actions/ActionHooks.js';

/**
 * Identity the missions announcements are sent from.
 */
export const MISSION_MASTER_ID = 'mission-master';
export const MISSION_MASTER_NAME = 'Mission Master';

/**
 * @typedef {Object} MissionDescriptor
 * @property {string} type - Mission type (see handlers/index.js)
 * @property {string} [prompt] - Prompt announced in chat
 * @property {number} [bonus] - Points awarded (negative for penalties)
 * @property {boolean} [unatantum] - Claimable at most once per agent (per round when the tournament re-arms)
 * @property {boolean} [announce] - Announce assignments in chat
 * @property {number} [startAfter] - Delay in seconds before the mission activates (default 0: immediately)
 * @property {{x: number, y: number}[]} [coordinates] - goto/deliverAt target tiles
 * @property {boolean} [requireDelivery] - deliverAt: require the delivery tile to score
 * @property {number} [parcels] - deliverExactlyNParcels: exact number of delivered parcels
 * @property {number} [threshold] - deliverLessValueThan: carrying value must stay below
 * @property {string} [question] - questionAnswer: question announced in chat
 * @property {string[]} [answers] - questionAnswer: accepted answers (case/trim insensitive)
 * @property {number} [greenMs] - redLightGreenLight: green phase duration
 * @property {number} [yellowMs] - redLightGreenLight: yellow (warning before red) phase duration
 * @property {number} [redMs] - redLightGreenLight: red phase duration
 * @property {number} [rounds] - redLightGreenLight: number of cycles (0 = until disposed)
 */

/**
 * @typedef {Object} MoveHookContext
 * @property {import('../../core/Agent.js').default} agent
 * @property {'up'|'down'|'left'|'right'} direction
 * @property {number} dx
 * @property {number} dy
 * @property {import('../../core/Tile.js').default | undefined} toTile
 * @property {import('../../core/Grid.js').default} grid
 * @property {any} [moved]
 */

/**
 * @typedef {Object} PickupHookContext
 * @property {import('../../core/Agent.js').default} agent
 * @property {import('../../core/Grid.js').default} grid
 * @property {any} xy
 * @property {any} [result]
 */

/**
 * @typedef {Object} PutdownHookContext
 * @property {import('../../core/Agent.js').default} agent
 * @property {import('../../core/Grid.js').default} grid
 * @property {string[]} selected
 * @property {any} [result]
 */

/**
 * @typedef {Object} HubMessage
 * @property {'say'|'shout'|'ask'} channel
 * @property {string} fromId
 * @property {string} fromName
 * @property {string | null} toId
 * @property {any} msg
 */

/**
 * Common mission behavior: prompt announcement, per-agent claim tracking,
 * score assignment with chat announcement and re-arming on a new
 * tournament round.
 */
class MissionBase extends PluginBase {

    /**
     * @param {MissionDescriptor} descriptor
     * @param {number} index - Position of the mission in the game script
     */
    constructor(descriptor, index) {
        super({
            id: `mission:${index}:${descriptor.type}`,
            name: `Mission ${index + 1}: ${descriptor.type}`,
            version: '1.0.0',
            description: descriptor.prompt ?? `Mission ${descriptor.type}`
        }, descriptor);
        this.internal = true;
        this.type = descriptor.type;
        this.prompt = descriptor.prompt ?? '';
        this.bonus = Number(descriptor.bonus ?? 100);
        this.unatantum = descriptor.unatantum ?? true;
        this.announce = descriptor.announce ?? true;
        this.index = index;
        this.grid = null;
        const startAfter = Number(descriptor.startAfter ?? 0);
        this.startAfterMs = Number.isFinite(startAfter) && startAfter > 0 ? Math.floor(startAfter * 1000) : 0;

        /** Until the start timer fires the mission ignores every game fact */
        this.active = false;

        /** @type {number | null} epoch ms when the start timer fires, null once active */
        this.startsAt = null;

        /** @type {NodeJS.Timeout | null} */
        this.startTimer = null;

        /** @type {Set<string>} agents that already claimed this mission */
        this.claimed = new Set();

        this.stats = { awards: 0 };

        this.#roundStartedListener = () => {
            if (this.active) this.reArm();
        };
        this.#msgListener = (message) => this.onMsg(message);
    }

    /** @type {() => void} */
    #roundStartedListener;

    /** @type {(message: HubMessage) => void} */
    #msgListener;

    /** @param {import('../PluginBase.js').PluginContext} context */
    async init(context) {
        this.grid = context.grid;
        this.grid.emitter.on('tournament:round_started', this.#roundStartedListener);
        this.start(() => this.#announceStart());
        return true;
    }

    /** @param {import('../PluginBase.js').PluginContext} context */
    async shutdown(context) {
        void context;
        this.grid?.emitter.off('tournament:round_started', this.#roundStartedListener);
        this.dispose();
        this.grid = null;
        return true;
    }

    /**
     * Schedule the mission activation: after the descriptor startAfter
     * delay (in seconds) the mission becomes active and every game fact
     * starts reaching it. Missions with no delay activate immediately.
     * The timers start when the map loads and are not restarted by the
     * tournament round re-arm.
     * @param {() => void} [onStarted] runs when the mission becomes active
     */
    start(onStarted = null) {
        this.#clearStartTimer();
        this.active = false;
        if (this.startAfterMs <= 0) {
            this.#begin(onStarted);
            return;
        }
        this.startsAt = Date.now() + this.startAfterMs;
        this.startTimer = setTimeout(() => this.#begin(onStarted), this.startAfterMs);
        this.startTimer.unref?.();
    }

    /**
     * @param {() => void} [onStarted]
     */
    #begin(onStarted) {
        this.startTimer = null;
        this.startsAt = null;
        this.active = true;
        this.activate();
        onStarted?.();
    }

    #clearStartTimer() {
        if (this.startTimer) {
            clearTimeout(this.startTimer);
            this.startTimer = null;
        }
        this.startsAt = null;
    }

    /**
     * @param {string} agentId
     * @returns {boolean}
     */
    canClaim(agentId) {
        return !this.unatantum || !this.claimed.has(agentId);
    }

    /**
     * Assign the bonus/penalty to an agent: score mutation (sensing picks it
     * up), claim bookkeeping and chat announcement.
     * @param {import('../../core/Agent.js').default} agent
     * @param {string} [reason]
     */
    award(agent, reason = '') {
        this.claimed.add(agent.id);
        this.stats.awards += 1;
        agent.score += this.bonus;
        if (this.announce) {
            communicationsHub.announce({
                fromId: MISSION_MASTER_ID,
                fromName: MISSION_MASTER_NAME,
                msg: `🏅 [Mission] ${agent.name}: ${this.bonus >= 0 ? '+' : ''}${this.bonus} points${this.prompt ? ` — ${this.prompt}` : ''}${reason ? ` (${reason})` : ''}`
            });
        }
        console.log(`[Missions] ${this.type}#${this.index}: ${agent.name}(${agent.id}) awarded ${this.bonus} points, new score ${agent.score}`);
    }

    /**
     * Re-arm for a new tournament round: forget claims and mission state.
     */
    reArm() {
        this.claimed.clear();
        this.onReArm();
    }

    /** Called by reArm() after claims are cleared; subclasses reset their state here. */
    onReArm() {}

    /** Register this mission instance for movement facts. */
    observeMoves() {
        actionHooks.afterMove(this.id, 50, (ctx) => this.onMove(ctx));
    }

    /** Register this mission instance for pickup facts. */
    observePickups() {
        actionHooks.afterPickup(this.id, 50, (ctx) => this.onPickup(ctx));
    }

    /** Register this mission instance for putdown facts. */
    observePutdowns() {
        actionHooks.afterPutdown(this.id, 50, (ctx) => this.onPutdown(ctx));
    }

    /** Register this mission instance for communications-hub messages. */
    observeMessages() {
        communicationsHub.on('msg', this.#msgListener);
    }

    /** Started on activation; subclasses register only the facts they need. */
    activate() {}

    /**
     * @param {MoveHookContext} context
     */
    onMove(context) { void context; }

    /**
     * @param {PickupHookContext & {result: any}} context
     */
    onPickup(context) { void context; }

    /**
     * @param {PutdownHookContext & {result: any}} context
     */
    onPutdown(context) { void context; }

    /**
     * @param {HubMessage} message
     */
    onMsg(message) { void message; }

    /** Release resources (timers); called on plugin shutdown. */
    dispose() {
        this.#clearStartTimer();
        actionHooks.offAfterMove(this.id);
        actionHooks.offAfterPickup(this.id);
        actionHooks.offAfterPutdown(this.id);
        communicationsHub.off('msg', this.#msgListener);
        this.active = false;
    }

    #announceStart() {
        if (!this.announce || !this.prompt) return;
        communicationsHub.announce({
            fromId: MISSION_MASTER_ID,
            fromName: MISSION_MASTER_NAME,
            msg: `🎯 [Mission] ${this.prompt}`
        });
    }

    /**
     * REST-facing description.
     * @returns {object}
     */
    describe() {
        return {
            index: this.index,
            type: this.type,
            prompt: this.prompt,
            bonus: this.bonus,
            unatantum: this.unatantum,
            active: this.active,
            startsAt: this.startsAt,
            stats: { awards: this.stats.awards }
        };
    }

}

export default MissionBase;
