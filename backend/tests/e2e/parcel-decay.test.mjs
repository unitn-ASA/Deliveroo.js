import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { adminRest, bootServer, connectClient, disconnectAll, parcelCount, poll, teleport, withTimeout } from './helpers.mjs';

/**
 * A carried parcel that decays away (reward -> 0 -> deleted) must free its
 * carrier's capacity slot: the ghost parcel must not count against
 * config.GAME.player.capacity, nor be droppable by a later putdown.
 *
 * Fixture e2e-parcel-decay.json: capacity 2, spawner tiles (0,1), (1,1),
 * (2,1); decaying_event 2s with reward 3 -> a parcel expires ~6s after
 * spawning, carried ones included.
 */

const FIXTURE = new URL('../fixtures/e2e-parcel-decay.json', import.meta.url).pathname;

let server;
let player;
let admin;
/** @type {object[]} latest sensing frames received by the player */
let sensingLog;

const pickup = () => withTimeout(
    new Promise((resolve) => player.socket.emit('pickup', resolve)),
    3000, 'pickup acknowledgement'
);

const carriedCount = () => {
    const sensing = sensingLog.at(-1);
    return (sensing?.parcels ?? []).filter((p) => p.carriedBy === player.id).length;
};

async function fillCapacity() {
    // parcels live ~6s (reward 3, decay every 2s): teleport onto a sensed
    // parcel and retry until two pickup acks fill the capacity
    let carried = 0;
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline && carried < 2) {
        const free = sensingLog.at(-1)?.parcels?.find((p) => p.carriedBy == null);
        if (free) {
            const ack = await teleport(admin.socket, player.id, free.x, free.y);
            assert.ok(ack?.success, `teleport to the parcel at (${free.x},${free.y})`);
            const picked = await pickup();
            carried += picked.length;
        }
        await new Promise((resolve) => setTimeout(resolve, 300));
    }
    if (carried < 2) assert.fail('could not fill the capacity with parcels before they decay');
}

before(async () => {
    server = await bootServer({ fixture: FIXTURE });
    player = await connectClient(server.baseUrl, 'carrier');
    admin = await connectClient(server.baseUrl, 'admin', { admin: true });
    sensingLog = [];
    player.socket.on('sensing', (sensing) => { sensingLog.push(sensing); });
});

after(async () => {
    disconnectAll(player, admin);
    await server?.stop();
});

test('a carried parcel that decays away frees its capacity slot', async () => {
    await fillCapacity();
    assert.equal(carriedCount(), 2, 'the agent carries two parcels');

    // freeze the world: no fresh parcels while the carried ones decay
    const stop = await adminRest(server.baseUrl, 'POST', '/api/plugins/parcel-spawner/stop');
    assert.equal(stop.status, 200);

    // carried parcels decay to 0 and are deleted: the slot must be freed
    const carried = await poll(carriedCount, (n) => n === 0, 12000, 250);
    assert.equal(carried, 0, 'the carried parcels expired and left sensing');

    // fresh parcel: the freed slots must allow picking it up. With the bug
    // the ghost parcels kept the capacity full and the pickup acked empty
    const start = await adminRest(server.baseUrl, 'POST', '/api/plugins/parcel-spawner/start');
    assert.equal(start.status, 200);
    const count = await poll(() => parcelCount(server.baseUrl), (c) => c >= 1, 8000, 250);
    assert.ok(count >= 1, `expected a fresh parcel to spawn, got ${count}`);

    // locate the fresh parcel in sensing (frames can lag the REST count) and
    // retry if it expires between sensing and pickup (decay is fast here)
    const deadline = Date.now() + 10000;
    let refilled = [];
    while (Date.now() < deadline && refilled.length === 0) {
        const fresh = await poll(
            () => (sensingLog.at(-1)?.parcels ?? []).find((p) => p.carriedBy == null),
            (p) => p !== undefined,
            4000, 250
        );
        if (!fresh) break;
        const ack = await teleport(admin.socket, player.id, fresh.x, fresh.y);
        assert.ok(ack?.success, `teleport to the fresh parcel at (${fresh.x},${fresh.y})`);
        refilled = await pickup();
    }
    assert.ok(refilled.length >= 1, `the freed slot allows a pickup (got ${refilled.length})`);
});
