import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { adminRest, bootServer, connectClient, disconnectAll, rest, sleep } from './helpers.mjs';

/**
 * Plugin lifecycle: registry status, discovery of available plugins,
 * admin-only mutations and the full load/start/stop/reload/unload cycle.
 */

let server;
let client;

before(async () => {
    server = await bootServer();
    await adminRest(server.baseUrl, 'POST', '/api/plugins/npc-spawner/stop');
    client = await connectClient(server.baseUrl, 'switcher');
    await sleep(300);
});

after(async () => {
    disconnectAll(client);
    await server.stop();
});

test('registry status exposes plugin bookkeeping without agent command handlers', async () => {
    const status = await rest(server.baseUrl, 'GET', '/api/plugins/status');
    assert.equal(status.body.success, true);
    assert.ok(Array.isArray(status.body.plugins));
    assert.ok(Array.isArray(status.body.commandHandlers));
});

test('available plugins are discovered from manifest files with registration state', async () => {
    const res = await rest(server.baseUrl, 'GET', '/api/plugins/available');
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.plugins));

    const leaderboard = res.body.plugins.find((p) => p.id === 'leaderboard-plugin');
    assert.ok(leaderboard, 'leaderboard example is discovered');
    assert.equal(leaderboard.registered, false);
    assert.equal(leaderboard.running, false);
    assert.ok(leaderboard.modulePath.endsWith('LeaderboardPlugin.js'));

    const energy = res.body.plugins.find((p) => p.id === 'energy');
    assert.ok(energy, 'energy plugin is discovered');
    assert.equal(energy.registered, false);
    assert.ok(energy.modulePath.endsWith('EnergyPlugin.js'));
});

test('plugin mutations are rejected without admin credentials', async () => {
    const load = await rest(server.baseUrl, 'POST', '/api/plugins/load', { modulePath: 'src/plugins/energy/EnergyPlugin.js' });
    assert.equal(load.status, 403);

    const stop = await rest(server.baseUrl, 'POST', '/api/plugins/parcel-spawner/stop');
    assert.equal(stop.status, 403);

    const del = await rest(server.baseUrl, 'DELETE', '/api/plugins/parcel-spawner');
    assert.equal(del.status, 403);
});

test('the full plugin lifecycle works with admin credentials', async () => {
    // Load from the discovered manifest and start
    const load = await adminRest(server.baseUrl, 'POST', '/api/plugins/load', {
        manifestPath: 'src/plugins/energy/energy-plugin.manifest.json',
        autoStart: true
    });
    assert.equal(load.status, 201, `load failed: ${JSON.stringify(load.body)}`);
    assert.equal(load.body.plugin.id, 'energy');
    assert.equal(load.body.running, true);

    // Discovered state reflects registration
    let available = await rest(server.baseUrl, 'GET', '/api/plugins/available');
    const energy = available.body.plugins.find((p) => p.id === 'energy');
    assert.equal(energy.registered, true);
    assert.equal(energy.running, true);

    // Stop and restart
    const stop = await adminRest(server.baseUrl, 'POST', '/api/plugins/energy/stop');
    assert.equal(stop.status, 200);
    assert.equal(stop.body.plugin.status, 'stopped');

    const start = await adminRest(server.baseUrl, 'POST', '/api/plugins/energy/start');
    assert.equal(start.status, 200);
    assert.equal(start.body.plugin.status, 'running');

    // Reload keeps the plugin registered
    const reload = await adminRest(server.baseUrl, 'POST', '/api/plugins/energy/reload', { autoStart: true });
    assert.equal(reload.status, 200);
    assert.equal(reload.body.running, true);

    // Unload removes it from the registry
    const del = await adminRest(server.baseUrl, 'DELETE', '/api/plugins/energy');
    assert.equal(del.status, 200);

    const list = await rest(server.baseUrl, 'GET', '/api/plugins');
    assert.ok(!list.body.plugins.some((p) => p.id === 'energy'), 'energy unregistered');

    available = await rest(server.baseUrl, 'GET', '/api/plugins/available');
    assert.equal(available.body.plugins.find((p) => p.id === 'energy').registered, false);
});
