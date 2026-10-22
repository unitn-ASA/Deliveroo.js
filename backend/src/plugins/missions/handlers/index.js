import GoToMission from './GoToMission.js';
import DeliverAtMission from './DeliverAtMission.js';
import DeliverExactlyNParcelsMission from './DeliverExactlyNParcelsMission.js';
import DeliverLessValueThanMission from './DeliverLessValueThanMission.js';
import OnePickupAnotherDeliverMission from './OnePickupAnotherDeliverMission.js';
import QuestionAnswerMission from './QuestionAnswerMission.js';
import RedLightGreenLightMission from './RedLightGreenLightMission.js';

/**
 * @typedef {typeof GoToMission | typeof DeliverAtMission | typeof DeliverExactlyNParcelsMission | typeof DeliverLessValueThanMission | typeof OnePickupAnotherDeliverMission | typeof QuestionAnswerMission | typeof RedLightGreenLightMission} MissionClass
 */

/** @type {Readonly<Record<string, MissionClass>>} */
const MISSION_TYPES = Object.freeze({
    goto: GoToMission,
    deliverAt: DeliverAtMission,
    deliverExactlyNParcels: DeliverExactlyNParcelsMission,
    deliverLessValueThan: DeliverLessValueThanMission,
    onePickupAnotherDeliver: OnePickupAnotherDeliverMission,
    questionAnswer: QuestionAnswerMission,
    redLightGreenLight: RedLightGreenLightMission
});

/**
 * @returns {string[]}
 */
function getMissionTypes() {
    return Object.keys(MISSION_TYPES);
}

/**
 * Instantiate the mission handler for a script descriptor.
 * @param {import('../MissionBase.js').MissionDescriptor} descriptor
 * @param {number} index - Position of the mission in the game script
 * @returns {import('../MissionBase.js').default}
 */
function createMission(descriptor, index) {
    if (!descriptor || typeof descriptor !== 'object' || Array.isArray(descriptor)) {
        throw new Error('mission must be an object');
    }
    const MissionClass = descriptor.type ? MISSION_TYPES[descriptor.type] : undefined;
    if (!MissionClass) {
        throw new Error(`unknown mission type '${descriptor.type}' — valid types: ${getMissionTypes().join(', ')}`);
    }
    return new MissionClass(descriptor, index);
}

export { createMission, getMissionTypes, MISSION_TYPES };
