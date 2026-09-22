import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
    adminRest, bootServer, connectClient, disconnectAll, move, poll, rest, sleep, teleport, withTimeout
} from './helpers.mjs';

/**
 * Role-specific connection components:
 * - admins are agent-less observers: map-wide god sensing without self,
 *   no own action handlers, no entry in /api/agents
 * - a plain user gets no admin handlers (agent:teleport has no listener)
 */

let server;
let admin;
let user;

before(async () => {
    server = await bootServer();
    await adminRest(server.baseUrl, 'POST', '/api/plugins/npc-spawner/stop');
    admin = await connectClient(server.baseUrl, 'boss', { admin: true });
    user = await connectClient(server.baseUrl, 'plain');
    await sleep(300);
});

after(async () => {
    disconnectAll(admin, user);
    await server.stop();
});

test('admin connection is an agent-less observer', async () => {
    // God sensing has no self because an admin has no map agent.
    assert.equal(admin.id, undefined);
    assert.equal(admin.state.id, undefined);

    // no agent on the map for the admin identity
    const { body: agents } = await rest(server.baseUrl, 'GET', '/api/agents');
    const ids = agents.map((a) => a.id);
    assert.ok(!agents.some((agent) => agent.name === 'boss'), 'admin must not have an agent');
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
    // A fresh admin connection: connectClient captures the initial snapshot,
    // which embeds the static tile positions; the following snapshots omit
    // them until a map edit rebuilds them
    const observer = await connectClient(server.baseUrl, 'sensed', { admin: true });
    try {
        const first = observer.initialSensing;
        // map-wide: sensing covers the far corners of the fixture map
        const has = (x, y) => first.positions.some((p) => p.x === x && p.y === y);
        assert.ok(has(0, 0) && has(4, 2), 'sensing must cover the whole map');
        // includes other agents
        assert.ok(first.agents.some((a) => a.id === user.id), 'sensing must include other agents');

        const second = await withTimeout(
            new Promise((resolve) => observer.socket.once('sensing', resolve)),
            3000, 'god sensing update'
        );
        assert.equal(second.positions, null, 'following snapshots omit the static positions');
    } finally {
        observer.socket.disconnect();
    }
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

test('agent movements emit no tile events and keep god positions stale', async () => {
    // Tile locks are movement coordination: they must not surface as 'tile'
    // events to clients (they fire twice per move!) nor rebuild the admin god
    // sensing positions, otherwise busy maps flood every connected client
    const tileEvents = [];
    const tileListener = (tile) => tileEvents.push(tile);
    user.socket.on('tile', tileListener);

    try {
        const ack = await move(user.socket, 'up', 1500);
        assert.ok(ack && typeof ack === 'object', 'the agent must move');
        // cover the movement animation and the throttled god sensing flush
        await sleep(300);

        assert.equal(tileEvents.length, 0, 'movements must not emit tile events');

        const sensing = await withTimeout(
            new Promise((resolve) => admin.socket.once('sensing', resolve)),
            3000, 'god sensing after movement'
        );
        assert.equal(sensing.positions, null, 'movements must not rebuild god sensing positions');
        assert.ok(
            sensing.agents.some((a) => a.id === user.id && a.x === ack.x && a.y === ack.y),
            'the moved agent must be sensed at the destination'
        );
    } finally {
        user.socket.off('tile', tileListener);
    }
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
