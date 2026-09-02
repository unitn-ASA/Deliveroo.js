import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { bootServer, rest, parcelCount, poll, sleep } from './helpers.mjs';

/**
 * Spawner plugins are runtime-toggleable: stopping halts spawning (existing
 * parcels keep decaying), starting resumes; the NPC REST surface reports 503
 * while the npc-spawner plugin is stopped.
 *
 * Fixture: parcels generate every 1s, decay 1/s from reward 2 (~2-3s life),
 * max 3 on the grid; one random NPC.
 */

let server;

before(async () => {
    server = await bootServer();
});

after(async () => {
    await server?.stop();
});

test('parcels spawn on the fixture map', async () => {
    const count = await poll(
        () => parcelCount(server.baseUrl),
        (c) => c > 0,
        8000
    );
    assert.ok(count > 0, `expected parcels to appear, last count: ${count}`);
});

test('stopping parcel-spawner lets existing parcels decay away unreplaced', async () => {
    const { body } = await rest(server.baseUrl, 'POST', '/api/plugins/parcel-spawner/stop');
    assert.equal(body.plugin.status, 'stopped');

    // reward 2, decay 1/s: everything on the grid expires within a few seconds
    const count = await poll(
        () => parcelCount(server.baseUrl),
        (c) => c === 0,
        10000
    );
    assert.equal(count, 0, `parcels must decay away after stopping the spawner, last count: ${count}`);

    // and stays at zero while stopped
    await sleep(2500);
    assert.equal(await parcelCount(server.baseUrl), 0, 'no new parcels while the spawner is stopped');
});

test('starting parcel-spawner resumes spawning', async () => {
    await rest(server.baseUrl, 'POST', '/api/plugins/parcel-spawner/start');
    const count = await poll(
        () => parcelCount(server.baseUrl),
        (c) => c > 0,
        8000
    );
    assert.ok(count > 0, `spawning must resume, last count: ${count}`);
});

test('NPC REST surface follows the npc-spawner plugin lifecycle', async () => {
    const running = await rest(server.baseUrl, 'GET', '/api/npcs');
    assert.equal(running.status, 200);
    assert.equal(running.body.length, 1, 'fixture configures one NPC');

    await rest(server.baseUrl, 'POST', '/api/plugins/npc-spawner/stop');
    const stopped = await rest(server.baseUrl, 'GET', '/api/npcs');
    assert.equal(stopped.status, 503, 'NPC surface answers 503 while the plugin is stopped');

    await rest(server.baseUrl, 'POST', '/api/plugins/npc-spawner/start');
    const resumed = await rest(server.baseUrl, 'GET', '/api/npcs');
    assert.equal(resumed.status, 200);
    assert.equal(resumed.body.length, 1, 'NPC is recreated on restart');
});
