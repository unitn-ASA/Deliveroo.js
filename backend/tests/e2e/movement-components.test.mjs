import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
    bootServer, connectClient, disconnectAll, move, poll, rest,
    setAgentPreset, sleep, teleport
} from './helpers.mjs';

const GHOST_FIXTURE = new URL('../fixtures/e2e-ghost-default.json', import.meta.url).pathname;

let server;
let admin;
let a, b;

before(async () => {
    server = await bootServer();
    await rest(server.baseUrl, 'POST', '/api/plugins/npc-spawner/stop');
    admin = await connectClient(server.baseUrl, 'boss', { admin: true });
    a = await connectClient(server.baseUrl, 'agentA');
    b = await connectClient(server.baseUrl, 'agentB');
    await sleep(300);
});

after(async () => {
    disconnectAll(a, b, admin);
    await server.stop();
});

test('GET /api/agent-presets lists built-in presets', async () => {
    const { status, body } = await rest(server.baseUrl, 'GET', '/api/agent-presets');
    assert.equal(status, 200);
    assert.deepEqual(body.presets.sort(), ['ghost', 'push', 'rotation', 'standard']);
});

test('ghost preset passes through walls while standard preset is blocked in the same game', async () => {
    await setAgentPreset(server.baseUrl, a.id, 'ghost');
    await setAgentPreset(server.baseUrl, b.id, 'standard');

    await teleport(admin.socket, a.id, 1, 1);
    await teleport(admin.socket, b.id, 3, 1);
    await sleep(200);

    const aAck = await move(a.socket, 'right');
    const bAck = await move(b.socket, 'left');
    assert.deepEqual({ x: aAck.x, y: aAck.y }, { x: 2, y: 1 });
    assert.equal(bAck, false);
});

test('standard preset blocks walls', async () => {
    await setAgentPreset(server.baseUrl, a.id, 'standard');
    await teleport(admin.socket, a.id, 1, 1);
    await sleep(200);

    const penaltyBefore = a.state.penalty;
    const ack = await move(a.socket, 'right');
    assert.equal(ack, false);
    const penalty = await poll(async () => a.state.penalty, (p) => p < penaltyBefore, 1500, 50);
    assert.ok(penalty < penaltyBefore);
});

test('rotation preset rotates in place, then forward moves along the facing', async () => {
    await setAgentPreset(server.baseUrl, a.id, 'rotation');
    await teleport(admin.socket, a.id, 2, 2);
    await sleep(200);

    const rotated = await move(a.socket, 'right');
    assert.deepEqual({ x: rotated.x, y: rotated.y }, { x: 2, y: 2 });
    const rotation = await poll(async () => a.state.rotation, (r) => r === 1, 1500, 50);
    assert.equal(rotation, 1);

    const forward = await move(a.socket, 'up');
    assert.deepEqual({ x: forward.x, y: forward.y }, { x: 3, y: 2 });
});

test('config agent_preset ghost attaches ghost movement by default', async () => {
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

test('invalid preset name is rejected and behavior is unchanged', async () => {
    await setAgentPreset(server.baseUrl, a.id, 'standard');
    const { status, body } = await setAgentPreset(server.baseUrl, a.id, 'teleport');
    assert.equal(status, 400);
    assert.match(body.message, /Unknown agent preset/);

    await teleport(admin.socket, a.id, 1, 1);
    await sleep(200);
    const blocked = await move(a.socket, 'right');
    assert.equal(blocked, false);
});

test('ghost is still stopped by the map boundary', async () => {
    await setAgentPreset(server.baseUrl, a.id, 'ghost');
    await teleport(admin.socket, a.id, 4, 2);
    await sleep(200);
    const ack = await move(a.socket, 'right');
    assert.equal(ack, false);
});
