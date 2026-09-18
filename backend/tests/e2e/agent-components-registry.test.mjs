import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
    adminRest, bootServer, connectClient, disconnectAll, move, poll, rest,
    setAgentPreset, sleep, teleport
} from './helpers.mjs';

/**
 * MovementModesPlugin lifecycle and the agent component registry:
 * - standard behavior remains registered by the core
 * - stopping the plugin removes only optional movement presets
 * - restarting it restores optional modes
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

test('registry is populated at boot: standard and optional presets are listed', async () => {
    const { status, body } = await rest(server.baseUrl, 'GET', '/api/agent-presets');
    assert.equal(status, 200);
    assert.deepEqual(body.presets.sort(), ['ghost', 'push', 'rotation', 'standard']);
});

test('NPC created at boot has core standard movement', async () => {
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

test('stopping movement modes preserves standard and rejects optional presets', async () => {
    // stop the wandering NPC for deterministic client placement
    await adminRest(server.baseUrl, 'POST', '/api/plugins/npc-spawner/stop');

    const stop = await adminRest(server.baseUrl, 'POST', '/api/plugins/movement-modes/stop');
    assert.equal(stop.status, 200, JSON.stringify(stop.body));

    const { body } = await rest(server.baseUrl, 'GET', '/api/agent-presets');
    assert.deepEqual(body.presets, ['standard']);

    client = await connectClient(server.baseUrl, 'late-joiner');
    await sleep(200);
    const patch = await setAgentPreset(server.baseUrl, client.id, 'ghost');
    assert.equal(patch.status, 400);
    assert.match(patch.body.message, /Unknown agent preset/);
});

test('new agents can still apply the core standard preset while movement modes are stopped', async () => {
    const patch = await setAgentPreset(server.baseUrl, client.id, 'standard');
    assert.equal(patch.status, 200, JSON.stringify(patch.body));
});

test('restarting movement modes restores optional presets and behavior', async () => {
    const start = await adminRest(server.baseUrl, 'POST', '/api/plugins/movement-modes/start');
    assert.equal(start.status, 200, JSON.stringify(start.body));

    const { body } = await rest(server.baseUrl, 'GET', '/api/agent-presets');
    assert.deepEqual(body.presets.sort(), ['ghost', 'push', 'rotation', 'standard']);

    // Switch the core-standard agent to the restored optional ghost preset.
    const patch = await setAgentPreset(server.baseUrl, client.id, 'ghost');
    assert.equal(patch.status, 200, JSON.stringify(patch.body));

    await teleport(admin.socket, client.id, 1, 1);
    await sleep(200);
    const ack = await move(client.socket, 'right');
    assert.deepEqual({ x: ack.x, y: ack.y }, { x: 2, y: 1 }, 'ghost movement works again');
});
