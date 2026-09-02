import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { bootServer, connectClient, disconnectAll, move, poll, parcelCount, teleport, withTimeout } from './helpers.mjs';

/**
 * Carrying-capacity contract (config.GAME.player.capacity):
 * - pickup acks with ONLY the parcels actually picked up
 * - at capacity, pickup acks empty while parcels remain on the tile
 * - putdown frees capacity; the next pickup fills exactly the free slots
 *
 * Fixture e2e-capacity-map.json: capacity 2, three parcel spawner tiles at
 * (0,1), (1,1), (2,1). The spawner only fills EMPTY spawner tiles, so once
 * parcelCount reaches 3 there is exactly one parcel on each spawner tile.
 */

const CAPACITY = 2;
const FIXTURE = new URL('../fixtures/e2e-capacity-map.json', import.meta.url).pathname;

let server;
let player;
let admin;
/** @type {object[]} latest-first log of sensing frames received by the player */
let sensingLog;

const pickup = (socket) => withTimeout(
    new Promise((resolve) => socket.emit('pickup', resolve)),
    3000, 'pickup acknowledgement'
);

const putdown = (socket, selected = []) => withTimeout(
    new Promise((resolve) => socket.emit('putdown', selected, resolve)),
    3000, 'putdown acknowledgement'
);

/**
 * Ground-truth parcels at (x,y), polled on sensing CONTENT so the frame is
 * fresh (frames repeat unchanged, so waiting for a new frame is not enough).
 * The pickup ack does not include parcel ids (Parcel.id is a prototype getter
 * and is dropped by serialization), so ids must be read from sensing.
 * @param {number} x
 * @param {number} y
 * @param {number} expectedCount
 * @returns {Promise<object[]>} parcels at (x,y) in a fresh sensing frame
 */
async function sensedParcelsAt(x, y, expectedCount) {
    const atTile = await poll(
        () => {
            const sensing = sensingLog.at(-1);
            return (sensing?.parcels ?? []).filter((p) => p.x === x && p.y === y);
        },
        (parcels) => parcels.length === expectedCount,
        5000
    );
    assert.equal(atTile.length, expectedCount, `sensing should show ${expectedCount} parcels at (${x},${y})`);
    return atTile;
}

async function teleportTo(x, y) {
    const ack = await teleport(admin.socket, player.id, x, y);
    assert.ok(ack?.success, `teleport to (${x},${y})`);
}

before(async () => {
    server = await bootServer({ fixture: FIXTURE });
    player = await connectClient(server.baseUrl, 'carrier');
    admin = await connectClient(server.baseUrl, 'admin', { admin: true });
    sensingLog = [];
    player.socket.on('sensing', (sensing) => { sensingLog.push(sensing); });
    // wait for one parcel on each of the three spawner tiles; poll() does
    // not fail on timeout, so assert the final count explicitly
    const count = await poll(
        () => parcelCount(server.baseUrl),
        (c) => c >= 3,
        10000
    );
    assert.ok(count >= 3, `expected 3 parcels spawned, got ${count}`);
});

after(async () => {
    disconnectAll(player, admin);
    await server?.stop();
});

test('pickup fills capacity, then acks empty while parcels remain', async () => {
    await teleportTo(0, 1);

    // capacity 2, one parcel on the tile: pick it up
    const first = await pickup(player.socket);
    assert.equal(first.length, 1, 'first pickup takes the single parcel');

    // second spawner tile: reaching capacity
    assert.ok(await move(player.socket, 'right'), 'move to (1,1)');
    const second = await pickup(player.socket);
    assert.equal(second.length, 1, 'second pickup takes its single parcel');

    // third spawner tile still has a parcel, but the agent is at capacity
    assert.ok(await move(player.socket, 'right'), 'move to (2,1)');
    const third = await pickup(player.socket);
    assert.equal(third.length, 0, 'pickup at capacity acks empty');
});

test('putdown frees capacity and pickup fills exactly the free slots', async () => {
    // still carrying 2 from the previous test; drop everything here
    const dropped = await putdown(player.socket);
    assert.equal(dropped.length, CAPACITY, 'putdown drops all carried parcels');

    // the tile now holds 3 parcels (1 pre-existing + 2 dropped): only 2 free slots
    const refilled = await pickup(player.socket);
    assert.equal(refilled.length, CAPACITY, 'pickup refills exactly the free slots');

    // full again: the third parcel on the tile cannot be taken
    const atCap = await pickup(player.socket);
    assert.equal(atCap.length, 0, 'pickup at capacity acks empty');

    // partial putdown of one carried parcel frees exactly one slot; the id
    // comes from sensing (carried parcels sit at the agent's tile)
    const atTile = await sensedParcelsAt(2, 1, 3);
    assert.equal(atTile.length, 3, 'tile holds the dropped + remaining parcels');
    const carried = atTile.filter((p) => p.carriedBy === player.id);
    assert.equal(carried.length, CAPACITY, 'sensing shows the two carried parcels');
    const partial = await putdown(player.socket, [carried[0].id]);
    assert.equal(partial.length, 1, 'partial putdown drops only the selected parcel');

    // the freed slot allows taking the remaining parcel
    const rest = await pickup(player.socket);
    assert.equal(rest.length, 1, 'remaining parcel is picked once capacity allows');
});
