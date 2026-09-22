import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
    adminRest, bootServer, connectClient, disconnectAll, move, poll, rest, sleep,
    setMovementMode, teleport
} from './helpers.mjs';

const GHOST_FIXTURE = new URL('../fixtures/e2e-ghost-default.json', import.meta.url).pathname;
const MODES_FIXTURE = new URL('../fixtures/e2e-movement-modes.json', import.meta.url).pathname;

let server;
let admin;
let a, b;

const modeOf = (s) => s?.attributes?.find((attribute) => attribute.kind === 'movement_mode')?.value;

before(async () => {
    server = await bootServer({ fixture: MODES_FIXTURE });
    await adminRest(server.baseUrl, 'POST', '/api/plugins/npc-spawner/stop');
    admin = await connectClient(server.baseUrl, 'boss', { admin: true });
    a = await connectClient(server.baseUrl, 'agentA');
    b = await connectClient(server.baseUrl, 'agentB');
    await sleep(300);
});

after(async () => {
    disconnectAll(a, b, admin);
    await server.stop();
});

test('agents expose their movement mode as a sensing attribute', async () => {
    assert.equal(modeOf(a.state), 'standard');
    assert.equal(modeOf(b.state), 'standard');
});

test('ghost movement mode passes through walls while standard mode is blocked in the same game', async () => {
    await setMovementMode(server.baseUrl, a.id, 'ghost');
    await setMovementMode(server.baseUrl, b.id, 'standard');
    await poll(async () => modeOf(a.state), (mode) => mode === 'ghost', 1500, 50);
    await sleep(200);

    await teleport(admin.socket, a.id, 1, 1);
    await teleport(admin.socket, b.id, 3, 1);
    await sleep(200);

    const aAck = await move(a.socket, 'right');
    const bAck = await move(b.socket, 'left');
    assert.deepEqual({ x: aAck.x, y: aAck.y }, { x: 2, y: 1 });
    assert.equal(bAck, false);
});

test('standard movement mode blocks walls', async () => {
    await setMovementMode(server.baseUrl, a.id, 'standard');
    await sleep(200);

    await teleport(admin.socket, a.id, 1, 1);
    await sleep(200);

    const penaltyBefore = a.state.penalty;
    const ack = await move(a.socket, 'right');
    assert.equal(ack, false);
    const penalty = await poll(async () => a.state.penalty, (p) => p < penaltyBefore, 1500, 50);
    assert.ok(penalty < penaltyBefore);
});

test('rotation movement mode rotates in place, then forward moves along the facing', async () => {
    await setMovementMode(server.baseUrl, a.id, 'rotation');
    await sleep(200);

    await teleport(admin.socket, a.id, 2, 2);
    await sleep(200);

    const rotated = await move(a.socket, 'right');
    assert.deepEqual({ x: rotated.x, y: rotated.y }, { x: 2, y: 2 });
    const rotation = await poll(async () => a.state.rotation, (r) => r === 1, 1500, 50);
    assert.equal(rotation, 1);

    const forward = await move(a.socket, 'up');
    assert.deepEqual({ x: forward.x, y: forward.y }, { x: 3, y: 2 });

    // 'down' (backward) is rejected in rotation mode: the agent must turn
    // around with 'left'/'right' to face the other way
    const backward = await move(a.socket, 'down');
    assert.equal(backward, false);
    await sleep(200);
    await poll(async () => a.state, (s) => s.x === 3 && s.y === 2, 1500, 50);
    assert.deepEqual({ x: a.state.x, y: a.state.y }, { x: 3, y: 2 });
});

test('config movement_mode ghost attaches ghost movement by default', async () => {
    const legacy = await bootServer({ fixture: GHOST_FIXTURE });
    try {
        const agent = await connectClient(legacy.baseUrl, 'legacy-ghost');
        await sleep(300);

        const admin2 = await connectClient(legacy.baseUrl, 'legacy-boss', { admin: true });
        await sleep(200);
        await teleport(admin2.socket, agent.id, 1, 1);
        await sleep(200);
        const ack = await move(agent.socket, 'right');
        assert.deepEqual({ x: ack.x, y: ack.y }, { x: 2, y: 1 });
        disconnectAll(agent, admin2);
    } finally {
        await legacy.stop();
    }
});

test('unknown mode name is accepted but leaves the standard movement active', async () => {
    await setMovementMode(server.baseUrl, a.id, 'standard');
    const { status, body } = await setMovementMode(server.baseUrl, a.id, 'teleport');
    assert.equal(status, 200);
    const mode = body.attributes?.find((attribute) => attribute.kind === 'movement_mode')?.value;
    assert.equal(mode, 'teleport');
    await sleep(200);

    await teleport(admin.socket, a.id, 1, 1);
    await sleep(200);
    const blocked = await move(a.socket, 'right');
    assert.equal(blocked, false);

    // Back to a provided mode for the following tests
    await setMovementMode(server.baseUrl, a.id, 'standard');
});

test('ghost is still stopped by the map boundary', async () => {
    await setMovementMode(server.baseUrl, a.id, 'ghost');
    await sleep(200);

    await teleport(admin.socket, a.id, 4, 2);
    await sleep(200);
    const ack = await move(a.socket, 'right');
    assert.equal(ack, false);
});

test('stopping the mode plugin leaves the attribute observable but the standard movement active', async () => {
    // Drop 'ghost' from the configured plugins: the plugin stops, its
    // components release the 'move' claim and the standard movement
    // self-heals the slot
    const patch = await adminRest(server.baseUrl, 'PATCH', '/api/configs', { GAME: { plugins: ['push', 'rotation'] } });
    assert.equal(patch.status, 200, `patch failed: ${JSON.stringify(patch.body)}`);

    const ghostStatus = async () =>
        (await rest(server.baseUrl, 'GET', '/api/plugins')).body.plugins.find((p) => p.id === 'ghost')?.status;
    await poll(ghostStatus, (status) => status !== 'running', 5000, 200);

    // The attribute write is still accepted and observable...
    const { status, body } = await setMovementMode(server.baseUrl, a.id, 'ghost');
    assert.equal(status, 200);
    const mode = body.attributes?.find((attribute) => attribute.kind === 'movement_mode')?.value;
    assert.equal(mode, 'ghost');

    // ...but with no plugin claiming the mode, the standard movement stays
    await sleep(200);
    await teleport(admin.socket, a.id, 1, 1);
    await sleep(200);
    const blocked = await move(a.socket, 'right');
    assert.equal(blocked, false);

    // Restore the mode plugins for any subsequent use
    const restore = await adminRest(server.baseUrl, 'PATCH', '/api/configs', { GAME: { plugins: ['ghost', 'push', 'rotation'] } });
    assert.equal(restore.status, 200);
    await poll(ghostStatus, (status) => status === 'running', 5000, 200);
    await setMovementMode(server.baseUrl, a.id, 'standard');
});
