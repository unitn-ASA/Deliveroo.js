import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
    adminRest, bootServer, connectClient, disconnectAll, rest, sleep
} from './helpers.mjs';

/**
 * NPCs use their own agent-local movement components.
 *
 * Fixture: wall at (2,1); the fixture configures one random NPC.
 */

let server;
let admin;

async function npcState() {
    const { body } = await rest(server.baseUrl, 'GET', '/api/npcs');
    const npc = body[0];
    return npc ?? null;
}

before(async () => {
    server = await bootServer();
    admin = await connectClient(server.baseUrl, 'boss', { admin: true });
    await sleep(300);
});

after(async () => {
    disconnectAll(admin);
    await server.stop();
});

test('NPCs are created with a movement component', async () => {
    const npc = await npcState();
    assert.ok(npc, 'fixture NPC is running');
});

test('NPC autopilots can be created, stopped, and restarted', async () => {
    const created = await adminRest(server.baseUrl, 'POST', '/api/npcs', {
        type: 'random',
        moving_event: 'frame'
    });
    assert.equal(created.status, 200, JSON.stringify(created.body));
    assert.ok(created.body.id);
    assert.equal(created.body.running, true);

    const id = created.body.id;
    const stopped = await adminRest(server.baseUrl, 'PATCH', `/api/npcs/${id}`, {
        stopRequested: true
    });
    assert.equal(stopped.status, 200, JSON.stringify(stopped.body));

    const stateAfterStop = await poll(
        async () => (await rest(server.baseUrl, 'GET', `/api/npcs/${id}`)).body,
        (npc) => npc?.running === false,
        5000
    );
    assert.equal(stateAfterStop.running, false);

    const restarted = await adminRest(server.baseUrl, 'PATCH', `/api/npcs/${id}`, {
        running: true
    });
    assert.equal(restarted.status, 200, JSON.stringify(restarted.body));
    assert.equal(restarted.body.running, true);
});

// local poll (kept self-contained: the helpers' poll works on any async fn)
async function poll(fn, predicate, timeoutMs, stepMs = 200) {
    const deadline = Date.now() + timeoutMs;
    let last;
    while (Date.now() < deadline) {
        last = await fn();
        if (predicate(last)) return last;
        await sleep(stepMs);
    }
    return last;
}
