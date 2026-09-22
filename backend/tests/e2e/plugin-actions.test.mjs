import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { adminRest, bootServer, connectClient, disconnectAll, poll, rest, sleep, teleport, withTimeout } from './helpers.mjs';

/**
 * Joystick-like command surface: parameterless commands (explicit
 * directional ones, pickup, putdown, plugin ones) registered on every
 * agent's command bus; clients discover them through the REST API
 * (GET /api/agents/:id/commands, readable by the agent itself or an admin)
 * and invoke them through the generic 'action' socket event, acknowledged
 * once at completion with the IOActionEnvelope.
 */

const FIXTURE = new URL('../fixtures/e2e-plugin-actions.json', import.meta.url).pathname;

let server;
let admin;
let player;
let other;

const pluginStatus = async (id) => {
    const res = await rest(server.baseUrl, 'GET', '/api/plugins');
    return res.body.plugins.find((p) => p.id === id)?.status;
};

const waitFor = async (predicate, what, timeout = 5000) => {
    for (let elapsed = 0; elapsed < timeout; elapsed += 200) {
        if (await predicate()) return true;
        await sleep(200);
    }
    throw new Error(`Timeout waiting for ${what}`);
};

const commandsOf = (agent) =>
    fetch(`${server.baseUrl}/api/agents/${agent.id}/commands`, {
        headers: { 'x-token': agent.token }
    }).then(async (res) => ({ status: res.status, body: await res.json() }));

/** Invoke a command through the generic 'action' event, resolve the envelope. */
const action = (name, ...rest) =>
    withTimeout(
        new Promise((resolve) => player.socket.emit('action', name, ...rest, resolve)),
        3000, `'${name}' action acknowledgement`
    );

before(async () => {
    server = await bootServer({ fixture: FIXTURE });
    admin = await connectClient(server.baseUrl, 'boss', { admin: true });
    player = await connectClient(server.baseUrl, 'shooter');
    other = await connectClient(server.baseUrl, 'bystander');
});

after(async () => {
    disconnectAll(admin, player, other);
    await server?.stop();
});

test('the command list is discoverable via REST, native commands included', async () => {
    const { status, body } = await commandsOf(player);
    assert.equal(status, 200);
    const names = body.commands.map(({ command }) => command);
    // native commands are part of the discovery surface...
    for (const native of ['up', 'down', 'left', 'right', 'pickup', 'putdown']) {
        assert.ok(names.includes(native), `${native} listed`);
    }
    // ...together with the plugin one
    assert.ok(names.includes('shoot'), 'shoot listed');

    // descriptors are documentation: names and descriptions
    const up = body.commands.find(({ command }) => command === 'up');
    assert.equal(up.description, 'Move one tile up');
    const shoot = body.commands.find(({ command }) => command === 'shoot');
    assert.ok(shoot.description.includes('facing'), `shoot describes its behavior: ${shoot.description}`);
});

test('the command list is denied to other players and to anonymous callers', async () => {
    const res = await fetch(`${server.baseUrl}/api/agents/${player.id}/commands`, {
        headers: { 'x-token': other.token }
    });
    assert.equal(res.status, 403);

    const anonymous = await rest(server.baseUrl, 'GET', `/api/agents/${player.id}/commands`);
    assert.equal(anonymous.status, 403);

    const missing = await adminRest(server.baseUrl, 'GET', '/api/agents/no-such-agent/commands');
    assert.equal(missing.status, 404);
});

test('directional commands acknowledge the envelope at completion', async () => {
    // Deterministic start position: from (0,0) only 'up' is walkable
    await teleport(admin.socket, player.id, 0, 0);
    await sleep(100);

    const ack = await action('up');
    assert.deepEqual(ack, { success: true, result: { x: 0, y: 1 } });
});

test('a blocked directional command acknowledges the envelope failure', async () => {
    await teleport(admin.socket, player.id, 0, 0);
    await sleep(100);

    // (0,-1) does not exist: 'down' hits the map boundary
    const ack = await action('down');
    assert.equal(ack.success, false);
    assert.match(ack.error, /down blocked/);
});

test('pickup and putdown acknowledge the affected parcels through the envelope', async () => {
    await teleport(admin.socket, player.id, 0, 0);
    await sleep(100);

    assert.deepEqual(await action('pickup'), { success: true, result: [] });
    assert.deepEqual(await action('putdown'), { success: true, result: [] });
});

test('unknown commands acknowledge the envelope failure', async () => {
    const ack = await action('dance');
    assert.equal(ack.success, false);
    assert.match(ack.error, /unknown command 'dance'/);
});

test('the wire tolerates legacy three-argument action emits (params ignored)', async () => {
    await teleport(admin.socket, player.id, 0, 0);
    await sleep(100);

    const ack = await action('up', {});
    assert.deepEqual(ack, { success: true, result: { x: 0, y: 1 } });
});

test('the parameterless shoot fires along the agent facing', async () => {
    // Same open row: shooter at (0,2), bystander at (2,2)
    await teleport(admin.socket, player.id, 0, 2);
    await teleport(admin.socket, other.id, 2, 2);
    await sleep(100);

    // A successful move autorotates the agent: facing becomes 'right'
    const stepped = await action('right');
    assert.deepEqual(stepped, { success: true, result: { x: 1, y: 2 } });

    const ack = await action('shoot');
    assert.equal(ack.success, true);
    assert.equal(ack.result.shot, true);
    assert.equal(ack.result.direction, 'right');
    assert.equal(ack.result.hit?.id, other.id, 'the first agent in line is hit');
    assert.equal(ack.result.length, 1);
    assert.ok(ack.result.from.x === 1 && ack.result.from.y === 2);

    // The victim loses one point
    const score = await poll(async () => other.state.score, (s) => s < 0, 2000, 50);
    assert.ok(score < 0, `hit agent score decreases (${score})`);
});

test('stopping the plugin revokes the action and the discovery lists it no more', async () => {
    const stop = await adminRest(server.baseUrl, 'PATCH', '/api/configs', { GAME: { plugins: [] } });
    assert.equal(stop.status, 200);
    await waitFor(async () => (await pluginStatus('shooter')) !== 'running', 'shooter to stop');

    const { status, body } = await commandsOf(player);
    assert.equal(status, 200);
    // only the native commands remain
    assert.deepEqual(body.commands.map(({ command }) => command).sort(),
        ['down', 'left', 'pickup', 'putdown', 'right', 'up']);
    const ack = await action('shoot');
    assert.equal(ack.success, false);
    assert.match(ack.error, /unknown command 'shoot'/);
});
