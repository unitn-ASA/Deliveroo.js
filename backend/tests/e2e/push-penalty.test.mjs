import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
    bootServer, connectClient, disconnectAll, move, rest, setAgentPreset, sleep, teleport
} from './helpers.mjs';

/**
 * Push movement component: penalties land on the actor, never on the pushed agent.
 * Fixture map: wall at (2,1); rows y=0 and y=2 are open corridors.
 */

let server;
let admin;
let pusher;
let victim;

before(async () => {
    server = await bootServer();
    await rest(server.baseUrl, 'POST', '/api/plugins/npc-spawner/stop');
    admin = await connectClient(server.baseUrl, 'boss', { admin: true });
    pusher = await connectClient(server.baseUrl, 'pusherA');
    victim = await connectClient(server.baseUrl, 'victimB');

    const { status, body } = await setAgentPreset(server.baseUrl, pusher.id, 'push');
    assert.equal(status, 200, body?.message);
    await sleep(200);
});

after(async () => {
    disconnectAll(pusher, victim, admin);
    await server?.stop();
});

test('successful push displaces the blocking agent', async () => {
    // open corridor row: A(0,0) pushes B(1,0) to (2,0)
    await teleport(admin.socket, pusher.id, 0, 0);
    await teleport(admin.socket, victim.id, 1, 0);
    await sleep(300);

    const ack = await move(pusher.socket, 'right');
    await sleep(300);

    assert.deepEqual({ x: ack.x, y: ack.y }, { x: 1, y: 0 }, 'pusher takes the pushed agent cell');
    assert.deepEqual({ x: victim.state.x, y: victim.state.y }, { x: 2, y: 0 },
        'pushed agent is displaced one tile');
    assert.equal(victim.state.penalty, 0, 'a successful push never penalizes the pushed agent');
});

test('failed push penalizes the pusher only, never the pushed agent', async () => {
    // B(1,1) is backed by the wall at (2,1): A(0,1) cannot push B into it
    await teleport(admin.socket, pusher.id, 0, 1);
    await teleport(admin.socket, victim.id, 1, 1);
    await sleep(300);

    const pusherPenaltyBefore = pusher.state.penalty;
    const victimPenaltyBefore = victim.state.penalty;

    const ack = await move(pusher.socket, 'right');
    await sleep(300);

    assert.equal(ack, false, 'push into the wall fails');
    assert.ok(pusher.state.penalty < pusherPenaltyBefore,
        `pusher pays for the impossible push (${pusherPenaltyBefore} -> ${pusher.state.penalty})`);
    assert.equal(victim.state.penalty, victimPenaltyBefore,
        `pushed agent pays nothing (${victimPenaltyBefore} -> ${victim.state.penalty})`);
    // neither agent moved
    assert.deepEqual({ x: pusher.state.x, y: pusher.state.y }, { x: 0, y: 1 });
    assert.deepEqual({ x: victim.state.x, y: victim.state.y }, { x: 1, y: 1 });
});
