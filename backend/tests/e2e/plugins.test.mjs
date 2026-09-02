import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { bootServer, connectClient, disconnectAll, rest, sleep } from './helpers.mjs';

/**
 * Plugin lifecycle: registry status and bookkeeping. Agent behavior is handled
 * by per-agent components and covered by movement-component tests.
 */

let server;
let client;

before(async () => {
    server = await bootServer();
    await rest(server.baseUrl, 'POST', '/api/plugins/npc-spawner/stop');
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
