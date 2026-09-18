import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { adminRest, bootServer, connectClient, disconnectAll, rest, sleep } from './helpers.mjs';

/**
 * Config-driven plugin lifecycle: the game "plugins" list starts the
 * listed plugins at boot; a configuration change removing them stops the
 * ones the configuration started (admin-started plugins are left alone),
 * and re-adding a plugin starts it again.
 *
 * Also asserts the self-sensing reactivity across plugin start/stop: the
 * local sensing state of a connected agent loses the plugin attribute when
 * the plugin stops and regains it when it restarts.
 */

const FIXTURE = new URL('../fixtures/e2e-gamekit-energized-map.json', import.meta.url).pathname;

let server;
let player;

const energyOf = (s) => s?.attributes?.find((attribute) => attribute.kind === 'energy')?.value;

const pluginStatus = async (id) => {
    const res = await rest(server.baseUrl, 'GET', '/api/plugins');
    return res.body.plugins.find((p) => p.id === id)?.status;
};

const waitFor = async (predicate, what, timeout = 5000) => {
    for (let elapsed = 0; elapsed < timeout; elapsed += 200) {
        if (await predicate()) return true;
        await sleep(200);
    }
    throw new Error(`Timeout waiting for ${what}`);
};

before(async () => {
    server = await bootServer({ fixture: FIXTURE });
    player = await connectClient(server.baseUrl, 'player');
});

after(async () => {
    await disconnectAll(player);
    await server?.stop();
});

test('the game configuration starts the listed plugins at boot', async () => {
    for (const id of ['energy', 'keys-doors', 'double-delivery']) {
        assert.equal(await pluginStatus(id), 'running', `${id} started from config`);
    }
    // The connected agent carries the plugin self state
    await waitFor(() => energyOf(player.state) !== undefined, 'initial energy resource');
});

test('removing the plugins from the configuration stops them and clears the self state', async () => {
    const patch = await adminRest(server.baseUrl, 'PATCH', '/api/configs', { GAME: { title: 'plugin-less game', plugins: [] } });
    assert.equal(patch.status, 200, `patch failed: ${JSON.stringify(patch.body)}`);

    for (const id of ['energy', 'keys-doors', 'double-delivery']) {
        await waitFor(async () => (await pluginStatus(id)) !== 'running', `${id} to stop`);
        assert.equal(await pluginStatus(id), 'stopped', `${id} stopped`);
    }

    // sensing.self is re-emitted without the plugin attribute
    await waitFor(() => energyOf(player.state) === undefined, 'energy resource to disappear');
});

test('re-adding a plugin to the configuration starts it and restores the self state', async () => {
    const patch = await adminRest(server.baseUrl, 'PATCH', '/api/configs', { GAME: { plugins: ['energy'] } });
    assert.equal(patch.status, 200, `patch failed: ${JSON.stringify(patch.body)}`);

    await waitFor(async () => (await pluginStatus('energy')) === 'running', 'energy to restart');

    // The state of the already-connected agent is initialized and re-emitted
    await waitFor(() => energyOf(player.state) === 10, 'energy resource to come back');
});
