import MissionBase, { MISSION_MASTER_ID, MISSION_MASTER_NAME } from '../MissionBase.js';
import { communicationsHub } from '../../../ioServer/communicationsHub.js';

/**
 * RedLightGreenLight: the mission master alternates green, yellow and red
 * light phases, announcing every switch in chat. The yellow light warns
 * that the red is coming, so agents have the time to interpret the message
 * and stop; every movement during a red phase costs the (usually negative)
 * bonus, while moving during yellow is still allowed. 'rounds' counts red
 * phases (0 = endless). The cycle restarts on re-arm (new tournament round).
 */
class RedLightGreenLightMission extends MissionBase {

    /** @type {number} */
    #greenMs;

    /** @type {number} */
    #yellowMs;

    /** @type {number} */
    #redMs;

    /** @type {number} */
    #rounds;

    /** @type {'idle'|'green'|'yellow'|'red'|'done'} */
    #phase = 'idle';

    /** @type {number} red phases still to come */
    #roundsLeft = 0;

    /** @type {NodeJS.Timeout | null} */
    #timer = null;

    /**
     * @param {import('../MissionBase.js').MissionDescriptor} descriptor
     * @param {number} index
     */
    constructor(descriptor, index) {
        super(descriptor, index);
        // Penalties apply to every move during red: not a one-shot mission
        if (descriptor.unatantum === undefined) {
            this.unatantum = false;
        }
        this.#greenMs = Math.max(1000, Number(descriptor.greenMs ?? 5000));
        this.#yellowMs = Math.max(1000, Number(descriptor.yellowMs ?? 2000));
        this.#redMs = Math.max(1000, Number(descriptor.redMs ?? 1000));
        const rounds = Number(descriptor.rounds ?? 0);
        this.#rounds = Number.isFinite(rounds) && rounds > 0 ? Math.floor(rounds) : 0;
    }

    activate() {
        this.observeMoves();
        this.#roundsLeft = this.#rounds;
        this.#switchTo('green');
    }

    onReArm() {
        this.#clearTimer();
        this.#phase = 'idle';
        this.activate();
    }

    /**
     * @param {import('../MissionBase.js').MoveHookContext} context
     */
    onMove({ agent }) {
        if (this.#phase !== 'red' || !this.canClaim(agent.id)) return;
        this.award(agent, 'moved during red light');
    }

    dispose() {
        this.#clearTimer();
        this.#phase = 'done';
        super.dispose();
    }

    /**
     * @param {'green'|'yellow'|'red'} phase
     */
    #switchTo(phase) {
        this.#phase = phase;
        if (this.announce) {
            this.#announceInChat(phase === 'green'
                ? '🟢 GREEN LIGHT — move!'
                : phase === 'yellow'
                    ? '🟡 YELLOW LIGHT — red is coming, stop!'
                    : '🔴 RED LIGHT — do not move!');
        }
        this.#timer = setTimeout(() => this.#onPhaseEnd(phase), this.#phaseDuration(phase));
        this.#timer.unref?.();
    }

    /**
     * @param {'green'|'yellow'|'red'} phase
     * @returns {number}
     */
    #phaseDuration(phase) {
        return phase === 'green' ? this.#greenMs : phase === 'yellow' ? this.#yellowMs : this.#redMs;
    }

    /**
     * @param {'green'|'yellow'|'red'} endedPhase
     */
    #onPhaseEnd(endedPhase) {
        this.#timer = null;
        if (this.#phase !== endedPhase) return;

        if (endedPhase === 'green') {
            this.#switchTo('yellow');
            return;
        }
        if (endedPhase === 'yellow') {
            this.#switchTo('red');
            return;
        }

        if (this.#rounds > 0) {
            this.#roundsLeft -= 1;
            if (this.#roundsLeft <= 0) {
                this.#phase = 'done';
                if (this.announce) {
                    this.#announceInChat('🏁 Red light green light is over');
                }
                return;
            }
        }
        this.#switchTo('green');
    }

    #clearTimer() {
        if (this.#timer) {
            clearTimeout(this.#timer);
            this.#timer = null;
        }
    }

    /**
     * @param {string} msg
     */
    #announceInChat(msg) {
        communicationsHub.announce({ fromId: MISSION_MASTER_ID, fromName: MISSION_MASTER_NAME, msg });
    }

    /**
     * @returns {object}
     */
    describe() {
        return {
            ...super.describe(),
            config: { greenMs: this.#greenMs, yellowMs: this.#yellowMs, redMs: this.#redMs, rounds: this.#rounds },
            phase: this.#phase
        };
    }

}

export default RedLightGreenLightMission;
