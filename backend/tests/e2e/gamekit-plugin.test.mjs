import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { bootServer, connectClient, disconnectAll, move, poll, teleport, withTimeout } from './helpers.mjs';

/**
 * GameKit game mode: energy + keys-doors + double-delivery plugins,
 * auto-started from the fixture "plugins" list and composed through the
 * action hook pipeline and plugin-owned sensing layers.
 *
 * Fixture e2e-gamekit-energized-map.json (5x3, internal y grows upward):
 *   '8' key spawner at (0,1), '6' battery spawner at (2,1),
 *   '7' door at (1,0), '9' double delivery at (2,0),
 *   parcel spawners at (1,2), (2,2), (3,2) and (3,0).
 *
 * Energy: initial 10, every successful move/pickup/putdown costs 1, no
 * passive recharge, batteries restore the full initial energy and respawn
 * every 2s. The door consumes its key, and key spawner tiles ('8') are
 * infinite sources: a picked key is replaced immediately. Tests rely on
 * admin teleports to move agents across regions.
 *
 * Tests assert the extensible sensing protocol: sensing.self
 * (attributes), sensing.entities (key, battery, door), emitted from the
 * plugin-owned sensing
 * layers.
 */

const FIXTURE = new URL('../fixtures/e2e-gamekit-energized-map.json', import.meta.url).pathname;

let server;
let admin;
let player;
/** @type {object[]} latest sensing frames of the player */
let sensingLog;
/** @type {object[]} latest sensing frames of the admin (god view) */
let adminSensingLog;

const godSensing = () => adminSensingLog.at(-1);
const ackOf = (emit, what) => withTimeout(new Promise((resolve) => emit(resolve)), 3000, what);

// Generic agent state accessor (sensing.self carries attributes)
const attributeOf = (s, kind) => s?.attributes?.find((attribute) => attribute.kind === kind)?.value;
const energyOf = (s) => attributeOf(s, 'energy');
const keysOf = (s) => attributeOf(s, 'key') ?? 0;

before(async () => {
    server = await bootServer({ fixture: FIXTURE });

    // The fixture "plugins" list auto-starts energy, keys-doors and
    // double-delivery at boot, before any agent connects

    admin = await connectClient(server.baseUrl, 'admin', { admin: true });
    adminSensingLog = [];
    admin.socket.on('sensing', (s) => { adminSensingLog.push(s); });
});

after(async () => {
    await disconnectAll(player, admin);
    await server?.stop();
});

test('battery spawner fills "6" tiles and agents start with energy', async () => {
    player = await connectClient(server.baseUrl, 'player');
    sensingLog = [];
    player.socket.on('sensing', (s) => { sensingLog.push(s); });

    // God sensing shows the battery as a collectible item on the spawner tile
    const sensing = await poll(
        godSensing,
        (s) => (s?.entities ?? []).some((entity) => entity.kind === 'battery'),
        5000
    );
    assert.ok(sensing, 'god sensing with the battery received');
    const battery = sensing.entities.find((entity) => entity.kind === 'battery');
    assert.deepEqual(
        { x: battery.x, y: battery.y },
        { x: 2, y: 1 },
        'battery at (2,1)'
    );

    // The player sensing carries plugin-owned attributes
    const self = await poll(
        () => sensingLog.at(-1)?.self,
        (s) => s?.attributes?.some((attribute) => attribute.kind === 'energy' && attribute.value === 10 && attribute.max === 10)
            && s?.attributes?.some((attribute) => attribute.kind === 'key' && attribute.value === 0),
        5000
    );
    assert.ok(self, 'sensing.self exposes the energy and key attributes');

    // sensing.self carries generic attributes
    await poll(() => player.state, (s) => energyOf(s) === 10 && keysOf(s) === 0, 5000);
    assert.equal(energyOf(player.state), 10, 'initial energy');
    assert.equal(keysOf(player.state), 0, 'no keys');
});


test('door rejects crossing without a key, then consumes the key on crossing', async () => {
    // From (1,1) the door is one step down
    const ack = await teleport(admin.socket, player.id, 1, 1);
    assert.ok(ack?.success, 'teleport to (1,1)');

    // The door is perceived as a blocking entity requiring a key
    const doorEntity = await poll(
        () => sensingLog.at(-1),
        (s) => (s?.entities ?? []).some((entity) => entity.kind === 'door' && entity.x === 1 && entity.y === 0
            && Array.isArray(entity.attributes) && entity.attributes.length === 0),
        3000
    );
    assert.ok(doorEntity, 'the door is sensed as a plugin-owned entity without plugin rules');

    // Without a key the move is rejected and costs nothing
    const blocked = await move(player.socket, 'down');
    assert.equal(blocked, false, 'door blocks the move without a key');
    await poll(() => player.state, (s) => s.x === 1 && s.y === 1, 3000);
    assert.equal(energyOf(player.state), 10, 'blocked move costs no energy');

    // Take the key at (0,1)
    assert.ok(await move(player.socket, 'left'), 'move to (0,1)');
    const pickupAck = await ackOf((resolve) => player.socket.emit('pickup', resolve), 'pickup ack');
    assert.deepEqual(pickupAck, { collected: 'key' }, 'pickup collects the key');
    await poll(() => player.state, (s) => keysOf(s) === 1, 3000);

    // The attribute projection tracks the collected key
    const attributes = await poll(
        () => sensingLog.at(-1)?.self?.attributes,
        (attributes) => attributes?.some((attribute) => attribute.kind === 'key' && attribute.value === 1),
        3000
    );
    assert.ok(attributes, 'sensing.self.attributes counts the held key');

    // The key spawner is an infinite source: the picked key is replaced immediately
    const respawned = await poll(
        godSensing,
        (s) => (s?.entities ?? []).some((entity) => entity.kind === 'key' && entity.x === 0 && entity.y === 1),
        3000
    );
    assert.ok(respawned, 'the spawner immediately replaces the picked key');

    // Key in hand: the door opens and consumes the key
    assert.ok(await move(player.socket, 'right'), 'back to (1,1)');
    const crossed = await move(player.socket, 'down');
    assert.ok(crossed, 'door crossing succeeds with a key');
    await poll(() => player.state, (s) => keysOf(s) === 0 && s.x === 1 && s.y === 0, 3000);

    // A key is still offered on the spawner tile while the used one is gone
    assert.ok(
        (godSensing()?.entities ?? []).some((entity) => entity.kind === 'key' && entity.x === 0 && entity.y === 1),
        'a key is still available on the spawner tile'
    );

    // The key is single-shot: re-entering the door is rejected
    await teleport(admin.socket, player.id, 1, 1);
    const blockedAgain = await move(player.socket, 'down');
    assert.equal(blockedAgain, false, 'the consumed key cannot be reused');
    await poll(() => player.state, (s) => s.x === 1 && s.y === 1, 3000);

    // Another pickup finds the replaced key and opens the door again
    assert.ok(await move(player.socket, 'left'), 'move back to (0,1)');
    const repickAck = await ackOf((resolve) => player.socket.emit('pickup', resolve), 'key repick ack');
    assert.deepEqual(repickAck, { collected: 'key' }, 'the replaced key can be collected again');
    await poll(() => player.state, (s) => keysOf(s) === 1, 3000);
});

test('double delivery tile doubles the score', async () => {
    // Teleport below the door; the spawner at (3,0) feeds the delivery
    const ack = await teleport(admin.socket, player.id, 1, 0);
    assert.ok(ack?.success, 'teleport to (1,0)');
    assert.ok(await move(player.socket, 'right'), 'move to (2,0)');
    assert.ok(await move(player.socket, 'right'), 'move to (3,0)');

    // Wait for a parcel to spawn, then pick it up
    await poll(
        () => sensingLog.at(-1)?.parcels,
        (parcels) => (parcels ?? []).some((p) => p.x === 3 && p.y === 0 && !p.carriedBy),
        8000
    );
    const picked = await ackOf((resolve) => player.socket.emit('pickup', resolve), 'pickup ack');
    assert.ok(Array.isArray(picked) && picked.length >= 1, 'parcel picked up');
    assert.equal(picked[0].reward, 30, 'reward avg 30, variance 0');

    // The pickup ack does not carry parcel ids: read them from sensing
    const carried = await poll(
        () => (sensingLog.at(-1)?.parcels ?? []).find((p) => p.carriedBy === player.id),
        (p) => Boolean(p?.id),
        3000
    );
    assert.ok(carried?.id, 'carried parcel id from sensing');

    // Deliver exactly that parcel on the double delivery tile
    assert.ok(await move(player.socket, 'left'), 'move to (2,0)');
    const putdownAck = await ackOf(
        (resolve) => player.socket.emit('putdown', [carried.id], resolve),
        'putdown ack'
    );
    assert.deepEqual(putdownAck, [{ id: carried.id }], 'parcel delivered');

    await poll(() => player.state, (s) => s.score === 60, 3000);
    assert.equal(player.state.score, 60, 'score doubled on the "9" tile (2 x 30)');
});

test('battery pickup restores the initial energy and the battery respawns', async () => {
    const energyBefore = energyOf(player.state);
    assert.ok(energyBefore < 10, `energy was drained by previous actions (${energyBefore})`);

    // Teleport back above the door, onto the battery tile (2,1)
    const ack = await teleport(admin.socket, player.id, 2, 1);
    assert.ok(ack?.success, 'teleport to (2,1)');

    const pickupAck = await ackOf((resolve) => player.socket.emit('pickup', resolve), 'pickup ack');
    assert.deepEqual(pickupAck, { collected: 'battery' }, 'pickup collects the battery');
    await poll(() => player.state, (s) => energyOf(s) === 10, 3000);
    assert.equal(energyOf(player.state), 10, 'battery restores the initial energy');

    // The battery is consumed...
    await poll(godSensing, (s) => (s?.entities ?? []).filter((entity) => entity.kind === 'battery').length === 0, 3000);
    // ...and respawns on the next generation event
    const respawned = await poll(
        godSensing,
        (s) => (s?.entities ?? []).filter((entity) => entity.kind === 'battery').length === 1,
        5000
    );
    assert.ok(respawned, 'battery respawned');
    const respawnedBattery = respawned.entities.find((entity) => entity.kind === 'battery');
    assert.deepEqual(
        { x: respawnedBattery.x, y: respawnedBattery.y },
        { x: 2, y: 1 },
        'respawned battery at (2,1)'
    );
});

test('exhausted agents cannot move until recharged', async () => {
    const runner = await connectClient(server.baseUrl, 'runner');
    try {
        const ack = await teleport(admin.socket, runner.id, 1, 1);
        assert.ok(ack?.success, 'teleport to (1,1)');

        // Drain exactly 10 energy with back-and-forth moves
        for (let i = 0; i < 10; i++) {
            const direction = i % 2 === 0 ? 'left' : 'right';
            const result = await move(runner.socket, direction);
            assert.ok(result, `move ${i + 1} succeeds while energy remains`);
        }
        await poll(() => runner.state, (s) => energyOf(s) === 0, 3000);

        // Out of energy: moves are rejected
        const exhausted = await move(runner.socket, 'left');
        assert.equal(exhausted, false, 'no move without energy');
        await poll(() => runner.state, (s) => s.x === 1 && s.y === 1, 3000);
        assert.equal(energyOf(runner.state), 0, 'still exhausted');
    } finally {
        await disconnectAll(runner);
    }
});
