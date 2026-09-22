/** Direction name -> tile delta (game convention: up = +y, right = +x). */
export const DELTAS = { up: [0, 1], down: [0, -1], left: [-1, 0], right: [1, 0] };

/** Direction names as explicit movement commands on the agent command bus. */
export const DIRECTIONS = /** @type {('up'|'down'|'left'|'right')[]} */ (Object.keys(DELTAS));

/** Direction name -> facing value (0 = up/North, 1 = right/East, 2 = down/South, 3 = left/West). */
export const ROTATIONS = { up: 0, right: 1, down: 2, left: 3 };

/** Facing value -> direction name: which way an agent with that facing looks. */
export const FORWARD = { 0: 'up', 1: 'right', 2: 'down', 3: 'left' };
