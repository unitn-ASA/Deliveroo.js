import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
    bootServer, connectClient, disconnectAll, move, poll, rest, sleep, teleport, withTimeout
} from './helpers.mjs';

/**
 * Role-specific connection components:
 * - admins are agent-less observers: identity-only 'you', map-wide god
 *   sensing, no own action handlers, no entry in /api/agents
 * - a plain user gets no admin handlers (agent:teleport has no listener)
 */

let server;
let admin;
let user;

before(async () => {
    server = await bootServer();
    await rest(server.baseUrl, 'POST', '/api/plugins/npc-spawner/stop');
    admin = await connectClient(server.baseUrl, 'boss', { admin: true });
    user = await connectClient(server.baseUrl, 'plain');
    await sleep(300);
});

after(async () => {
    disconnectAll(admin, user);
    await server.stop();
});

test('admin connection is an agent-less observer', async () => {
    // identity-only 'you': id arrives, no map coordinates
    assert.equal(admin.state.id, admin.id);
    assert.equal(admin.state.x, undefined);

    // no agent on the map for the admin identity
    const { body: agents } = await rest(server.baseUrl, 'GET', '/api/agents');
    const ids = agents.map((a) => a.id);
    assert.ok(!ids.includes(admin.id), 'admin must not have an agent');
});

test('admin has no own action handlers', async () => {
    // move is only registered by PlayerConnectionComponent: for an admin
    // nobody answers, so the ack never arrives
    await assert.rejects(
        move(admin.socket, 'up', 1500),
        /Timeout/
    );
});

test('admin receives map-wide god sensing', async () => {
    const sensing = await withTimeout(
        new Promise((resolve) => admin.socket.once('sensing', resolve)),
        3000, 'god sensing'
    );
    // map-wide: sensing covers the far corners of the fixture map
    const has = (x, y) => sensing.positions.some((p) => p.x === x && p.y === y);
    assert.ok(has(0, 0) && has(4, 2), 'sensing must cover the whole map');
    // includes other agents
    assert.ok(sensing.agents.some((a) => a.id === user.id), 'sensing must include other agents');
});

test('admin god sensing updates on agent movement', async () => {
    await teleport(admin.socket, user.id, 1, 1);
    // parcel spawning keeps god sensing flowing (~1s): poll until the
    // moved agent appears at the destination
    const sensed = await poll(
        async () => {
            const sensing = await withTimeout(
                new Promise((resolve) => admin.socket.once('sensing', resolve)),
                2000, 'god sensing update'
            );
            return sensing.agents.find((a) => a.id === user.id);
        },
        (me) => me && me.x === 1 && me.y === 1,
        8000, 100
    );
    assert.ok(sensed, 'moved agent must be sensed');
    assert.deepEqual({ x: sensed.x, y: sensed.y }, { x: 1, y: 1 });
});

test('non-admin connection gets no admin handlers', async () => {
    // agent:teleport is only registered by AdminConnectionComponent:
    // for a plain user nobody answers, so the ack never arrives
    await assert.rejects(
        withTimeout(
            new Promise((resolve) => user.socket.emit('agent:teleport', user.id, { x: 1, y: 1 }, resolve)),
            1500, 'teleport acknowledgement'
        ),
        /Timeout/
    );
});
