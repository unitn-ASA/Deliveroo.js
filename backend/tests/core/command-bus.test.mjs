import { test } from 'node:test';
import assert from 'node:assert/strict';
import CommandBus from '../../src/utils/CommandBus.js';

/**
 * CommandBus: joystick-like command slots with single ownership, atomic
 * claim displacement and documentation descriptors for the REST discovery.
 */

test('handle registers the single owner and rejects duplicates', () => {
    const bus = new CommandBus();
    bus.handle('up', () => {}, 'standard-movement', { description: 'Move one tile up' });
    assert.equal(bus.hasHandler('up'), true);
    assert.equal(bus.getOwner('up'), 'standard-movement');
    assert.throws(() => bus.handle('up', () => {}, 'other'), /already registered/);
});

test('claim atomically displaces the current handler and exposes the descriptor', () => {
    const bus = new CommandBus();
    bus.handle('up', () => {}, 'standard-movement', { description: 'Move one tile up' });

    bus.claim('up', 'ghost-movement', () => {}, { description: 'Ghost move up' });

    assert.equal(bus.getOwner('up'), 'ghost-movement');
    assert.deepEqual(bus.getRegisteredCommands(), [
        { command: 'up', owner: 'ghost-movement', description: 'Ghost move up' }
    ]);
});

test('getRegisteredCommands omits missing descriptor fields', () => {
    const bus = new CommandBus();
    bus.handle('pickup', () => {}, 'parcel-carrier');
    assert.deepEqual(bus.getRegisteredCommands(), [{ command: 'pickup', owner: 'parcel-carrier' }]);
});

test('release removes the handler only from the owning component', () => {
    const bus = new CommandBus();
    bus.claim('up', 'ghost-movement', () => {});

    bus.release('up', 'someone-else');
    assert.equal(bus.hasHandler('up'), true);

    bus.release('up', 'ghost-movement');
    assert.equal(bus.hasHandler('up'), false);
    assert.equal(bus.getOwner('up'), null);
});

test('registration changes emit the changed event with the command list', () => {
    const bus = new CommandBus();
    const events = [];
    bus.on('changed', (commands) => events.push(commands));

    bus.handle('up', () => {}, 'a', { description: 'Up' });
    bus.claim('up', 'b', () => {});
    bus.release('up', 'b');

    assert.deepEqual(events, [
        [{ command: 'up', owner: 'a', description: 'Up' }],
        [{ command: 'up', owner: 'b' }],
        []
    ]);
});

test('dispatch routes the payload to the handler and reports missing handlers', () => {
    const bus = new CommandBus();
    let received = /** @type {any} */ (null);
    bus.handle('shoot', (payload) => { received = payload; }, 'shooter');

    const ack = () => {};
    assert.equal(bus.dispatch('shoot', { ack }), true);
    assert.equal(received?.ack, ack);
    assert.equal(bus.dispatch('dance', { ack }), false);
});

test('execute resolves with the acknowledgement value or the fallback', async () => {
    const bus = new CommandBus();
    bus.handle('pickup', ({ ack }) => ack(['a']), 'carrier');
    bus.handle('putdown', ({ ack }) => ack(['b']), 'carrier');

    assert.deepEqual(await bus.execute('pickup', {}, []), ['a']);
    assert.deepEqual(await bus.execute('dance', {}, 'fallback'), 'fallback');
    assert.deepEqual(await bus.execute('putdown', {}), ['b']);
});

test('ask calls the optional handler method with the owner-agnostic fallback', () => {
    const bus = new CommandBus();
    const handler = () => {};
    handler.plausible = () => true;
    bus.handle('up', handler, 'standard-movement');

    assert.equal(bus.ask('up', 'plausible', {}, false), true);
    assert.equal(bus.ask('dance', 'plausible', {}, false), false);
});
