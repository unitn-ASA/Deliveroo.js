import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
    bootServer, connectClient, disconnectAll, move, poll, rest,
    setAgentPreset, sleep, teleport
} from './helpers.mjs';

/**
 * AgentComponentsPlugin lifecycle and the agent component registry:
 * - the provider populates presets at boot BEFORE agents are created
 *   (boot-order guard: the fixture's random NPC must actually move)
 * - stopping the provider empties the registry and degrades cleanly
 * - restarting it restores presets and per-agent behavior
 */

let server;
let admin;
let client;

before(async () => {
    server = await bootServer();
    admin = await connectClient(server.baseUrl, 'boss', { admin: true });
    await sleep(300);
});

after(async () => {
    disconnectAll(client, admin);
    await server.stop();
});

test('registry is populated at boot: presets are listed', async () => {
    const { status, body } = await rest(server.baseUrl, 'GET', '/api/agent-presets');
    assert.equal(status, 200);
    assert.deepEqual(body.presets.sort(), ['ghost', 'push', 'rotation', 'standard']);
});

test('boot-order guard: the NPC created at boot has working movement components', async () => {
    // npc-spawner creates agents during its own init: if the provider had not
    // started first, the NPC would have no 'move' handler and never move
    const { body: npcs } = await rest(server.baseUrl, 'GET', '/api/npcs');
    const npc = npcs?.[0];
    assert.ok(npc, 'fixture NPC is running');

    const position = async () => {
        const { body } = await rest(server.baseUrl, 'GET', `/api/npcs/${npc.id}`);
        return { x: body?.agent?.xy?.x, y: body?.agent?.xy?.y };
    };

    const start = await position();
    const moved = await poll(position, (p) => p.x !== start.x || p.y !== start.y, 30000, 500);
    assert.ok(moved.x !== start.x || moved.y !== start.y,
        `random NPC must move at boot (stuck at ${JSON.stringify(start)})`);
});

test('stopping the provider empties presets and rejects preset PATCH', async () => {
    // stop the wandering NPC for deterministic client placement
    await rest(server.baseUrl, 'POST', '/api/plugins/npc-spawner/stop');

    const stop = await rest(server.baseUrl, 'POST', '/api/plugins/agent-components/stop');
    assert.equal(stop.status, 200, JSON.stringify(stop.body));

    const { body } = await rest(server.baseUrl, 'GET', '/api/agent-presets');
    assert.deepEqual(body.presets, []);

    client = await connectClient(server.baseUrl, 'late-joiner');
    await sleep(200);
    const patch = await setAgentPreset(server.baseUrl, client.id, 'ghost');
    assert.equal(patch.status, 400);
    assert.match(patch.body.message, /Unknown agent preset/);
});

test('new agents created while the provider is stopped have no commands', async () => {
    const ack = await move(client.socket, 'up');
    assert.equal(ack, false, 'move must ack false when the agent has no components');
});

test('restarting the provider restores presets and agent behavior', async () => {
    const start = await rest(server.baseUrl, 'POST', '/api/plugins/agent-components/start');
    assert.equal(start.status, 200, JSON.stringify(start.body));

    const { body } = await rest(server.baseUrl, 'GET', '/api/agent-presets');
    assert.deepEqual(body.presets.sort(), ['ghost', 'push', 'rotation', 'standard']);

    // 'late-joiner' was created without components: switch it to ghost via preset PATCH
    const patch = await setAgentPreset(server.baseUrl, client.id, 'ghost');
    assert.equal(patch.status, 200, JSON.stringify(patch.body));

    await teleport(admin.socket, client.id, 1, 1);
    await sleep(200);
    const ack = await move(client.socket, 'right');
    assert.deepEqual({ x: ack.x, y: ack.y }, { x: 2, y: 1 }, 'ghost movement works again');
});
