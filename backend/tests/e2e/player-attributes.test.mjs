import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { bootServer, connectClient, disconnectAll, poll, setAgentAttributes, sleep } from './helpers.mjs';

/**
 * Configuration-seeded player attributes: every agent starts with the
 * attributes declared in GAME.player.attributes; plugins adopt seeded
 * values they manage (energy) instead of their defaults.
 */

const FIXTURE = new URL('../fixtures/e2e-player-attributes.json', import.meta.url).pathname;

let server;
let player;

const attributeOf = (s, kind) => s?.attributes?.find((attribute) => attribute.kind === kind);

before(async () => {
    server = await bootServer({ fixture: FIXTURE });
    player = await connectClient(server.baseUrl, 'seeded');
    await sleep(300);
});

after(async () => {
    disconnectAll(player);
    await server?.stop();
});

test('seeded attributes reach the agent sensing', async () => {
    assert.deepEqual(attributeOf(player.state, 'rank'), { kind: 'rank', value: 3 });
    assert.deepEqual(attributeOf(player.state, 'team_color'), { kind: 'team_color', value: 'red' });
    // movement_mode is seeded too
    assert.deepEqual(attributeOf(player.state, 'movement_mode'), { kind: 'movement_mode', value: 'standard' });
});

test('the energy plugin adopts the seeded value as the initial energy', async () => {
    // Fixture seeds energy: 7 while the plugin config default is 100
    assert.deepEqual(attributeOf(player.state, 'energy'), { kind: 'energy', value: 7, max: 100 });
});

test('unseeded agents still get the standard movement mode', async () => {
    const other = await connectClient(server.baseUrl, 'unseeded-check');
    await sleep(300);
    assert.deepEqual(attributeOf(other.state, 'movement_mode'), { kind: 'movement_mode', value: 'standard' });
    disconnectAll(other);
});

test('REST attribute writes merge onto the agent and reach the sensing', async () => {
    const { status, body } = await setAgentAttributes(server.baseUrl, player.id, { rank: 5, badge: 'gold' });
    assert.equal(status, 200);
    assert.ok(body.attributes.find((attribute) => attribute.kind === 'rank')?.value === 5);

    const rank = await poll(() => Promise.resolve(attributeOf(player.state, 'rank')), (a) => a?.value === 5, 1500, 50);
    assert.deepEqual(rank, { kind: 'rank', value: 5 });
    assert.deepEqual(attributeOf(player.state, 'badge'), { kind: 'badge', value: 'gold' });
    // merge leaves other kinds untouched
    assert.deepEqual(attributeOf(player.state, 'team_color'), { kind: 'team_color', value: 'red' });
});

test('invalid attribute writes are rejected and leave the state unchanged', async () => {
    const before = player.state.attributes;
    const { status } = await setAgentAttributes(server.baseUrl, player.id, { rank: /** @type {any} */ (true) });
    assert.equal(status, 400);
    await sleep(300);
    assert.deepEqual(player.state.attributes, before);
});
