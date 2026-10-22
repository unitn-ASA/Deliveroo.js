import MissionBase, { MISSION_MASTER_ID } from '../MissionBase.js';

/**
 * QuestionAnswer: bonus for agents answering the mission question
 * correctly, addressing the mission master directly (say) or publicly
 * (shout). Answers are matched after trim and lowercase. With unatantum
 * (default) each agent claims the bonus once.
 */
class QuestionAnswerMission extends MissionBase {

    /** @type {string} */
    #question = '';

    /** @type {string[]} normalized accepted answers */
    #answers = [];

    /**
     * @param {import('../MissionBase.js').MissionDescriptor} descriptor
     * @param {number} index
     */
    constructor(descriptor, index) {
        super(descriptor, index);
        this.#question = descriptor.question ?? '';
        this.#answers = (Array.isArray(descriptor.answers) ? descriptor.answers : [])
            .map((answer) => String(answer ?? '').trim().toLowerCase())
            .filter((answer) => answer.length > 0);
    }

    activate() {
        this.observeMessages();
    }

    /**
     * @param {import('../MissionBase.js').HubMessage} message
     */
    onMsg({ channel, fromId, toId, msg }) {
        if (channel !== 'shout' && !(channel === 'say' && toId === MISSION_MASTER_ID)) return;
        const agent = this.grid.agents.get(fromId);
        if (!agent || !this.canClaim(agent.id)) return;

        const normalized = String(msg ?? '').trim().toLowerCase();
        if (!this.#answers.includes(normalized)) return;

        this.award(agent);
    }

    /**
     * @returns {object}
     */
    describe() {
        return { ...super.describe(), config: { question: this.#question } };
    }

}

export default QuestionAnswerMission;
