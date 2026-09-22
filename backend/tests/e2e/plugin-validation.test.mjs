import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { adminRest, bootServer, connectClient, disconnectAll, move, poll } from './helpers.mjs';

/**
 * Plugin validation warnings: the game configuration is the single source
 * of truth for which plugins run — the backend never auto-loads anything.
 * It only warns (loudly, without blocking) when a listed plugin id is not
 * provided by any manifest, and when the seeded movement_mode has no
 * provider plugin configured or running (agents fall back to the standard
 * movement). Warnings fire at boot and again on configuration changes.
 */

const FIXTURE = new URL('../fixtures/e2e-plugin-validation.json', import.meta.url).pathname;

let server;
let player;

before(async () => {
    server = await bootServer({ fixture: FIXTURE });
    player = await connectClient(server.baseUrl, 'player');
});

after(async () => {
    await disconnectAll(player);
    await server?.stop();
});

test('a game listing an unknown plugin id warns with the available ids', () => {
    const log = server.log();
    assert.match(log, /unknown plugin\(s\): nonexistent-plugin/);
    assert.match(log, /available plugins: .*\bshooter\b/);
});

test('a seeded movement_mode without its plugin warns about the standard fallback', () => {
    const log = server.log();
    assert.match(log, /movement_mode 'rotation' but no 'rotation' plugin/);
    assert.match(log, /standard movement/);
});

test('the game keeps working: the agent keeps the seeded attribute and moves with standard movement', async () => {
    const mode = player.state?.attributes?.find((attribute) => attribute.kind === 'movement_mode')?.value;
    assert.equal(mode, 'rotation', 'the seeded attribute is kept even without its plugin');

    // The agent spawns on a random tile: try the directions until one succeeds
    let ack;
    for (const direction of ['right', 'left', 'up', 'down']) {
        ack = await move(player.socket, direction);
        if (ack) break;
    }
    assert.ok(ack, `standard movement still works, got ${JSON.stringify(ack)}`);
});

test('configuration changes re-run the warnings', async () => {
    const patch = await adminRest(server.baseUrl, 'PATCH', '/api/configs', { GAME: { plugins: ['another-fake'] } });
    assert.equal(patch.status, 200, `patch failed: ${JSON.stringify(patch.body)}`);

    const warned = await poll(
        () => server.log().includes('unknown plugin(s): another-fake'),
        (found) => found,
        5000
    );
    assert.ok(warned, 'the new unknown plugin id must be warned about');
});
