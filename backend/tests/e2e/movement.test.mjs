import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { adminRest, bootServer, connectClient, disconnectAll, move, poll, rest, sleep, teleport, withTimeout } from './helpers.mjs';

/**
 * Movement contract under the standard movement component:
 * every action gets an acknowledgement, penalties land on the actor,
 * successful moves autorotate the agent to the movement direction.
 */

let server;
let admin;
let client;

before(async () => {
    server = await bootServer();
    // the wandering NPC would make deterministic placement impossible
    await adminRest(server.baseUrl, 'POST', '/api/plugins/npc-spawner/stop');
    admin = await connectClient(server.baseUrl, 'boss', { admin: true });
    client = await connectClient(server.baseUrl, 'mover');
    await sleep(300);
});

after(async () => {
    disconnectAll(admin, client);
    await server?.stop();
});

test('agent spawns facing up (rotation 0, never undefined)', () => {
    assert.equal(client.state.rotation, 0);
});

test('every direction acknowledges (position or false), never hangs', async () => {
    for (const direction of ['up', 'down', 'left', 'right']) {
        const ack = await move(client.socket, direction);
        assert.ok(ack === false || (typeof ack === 'object' && ack !== null),
            `move '${direction}' must ack with a position or false, got ${JSON.stringify(ack)}`);
        await sleep(120);
    }
});

test('invalid direction is penalized and acked false', async () => {
    const penaltyBefore = client.state.penalty;
    const ack = await move(client.socket, 'diagonal');
    assert.equal(ack, false, 'invalid direction acks false');
    // the penalty reaches the client through the next sensing snapshot: wait for it
    const penalty = await poll(
        async () => client.state.penalty,
        (p) => p < penaltyBefore,
        1500, 50
    );
    assert.ok(penalty < penaltyBefore,
        `penalty must decrease (${penaltyBefore} -> ${penalty})`);
});

test('non-string direction is penalized and acked false', async () => {
    const penaltyBefore = client.state.penalty;
    // deliberately invalid non-string input
    const ack = await move(client.socket, /** @type {any} */ (42));
    assert.equal(ack, false, 'non-string direction acks false');
    const penalty = await poll(
        async () => client.state.penalty,
        (p) => p < penaltyBefore,
        1500, 50
    );
    assert.ok(penalty < penaltyBefore);
});

test('parallel moves both acknowledge; the conflict is rejected', async () => {
    const acks = await Promise.all([
        move(client.socket, 'right'),
        move(client.socket, 'up')
    ]);
    for (const ack of acks) {
        assert.ok(ack !== undefined, 'both parallel moves must acknowledge');
    }
    // at most one of the two conflicting actions succeeded
    const successes = acks.filter((ack) => ack !== false).length;
    assert.ok(successes <= 1, `at most one parallel move may succeed, got ${successes}`);
});

test('standard movement autorotates the agent; failed moves do not turn it', async () => {
    // open corridor y=0, wall at (2,1)
    await teleport(admin.socket, client.id, 1, 0);
    await sleep(200);

    const right = await move(client.socket, 'right');
    assert.notEqual(right, false);
    let rotation = await poll(async () => client.state.rotation, (r) => r === 1, 1500, 50);
    assert.equal(rotation, 1);

    // the wall at (2,1): a failed move must not turn the agent
    const blocked = await move(client.socket, 'up');
    assert.equal(blocked, false);
    await sleep(200);
    assert.equal(client.state.rotation, 1);

    const left = await move(client.socket, 'left');
    assert.notEqual(left, false);
    rotation = await poll(async () => client.state.rotation, (r) => r === 3, 1500, 50);
    assert.equal(rotation, 3);

    // out of bounds: a failed move must not turn the agent
    const blockedDown = await move(client.socket, 'down');
    assert.equal(blockedDown, false);
    await sleep(200);
    assert.equal(client.state.rotation, 3);
});

test('pickup is handled by the agent parcel component', async () => {
    const ack = await withTimeout(
        new Promise((resolve) => client.socket.emit('pickup', resolve)),
        3000, 'pickup acknowledgement'
    );
    assert.ok(Array.isArray(ack), 'pickup acks with an array');
});
