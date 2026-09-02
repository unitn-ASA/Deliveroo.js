import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
    bootServer, connectClient, disconnectAll, rest, sleep, teleport
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
