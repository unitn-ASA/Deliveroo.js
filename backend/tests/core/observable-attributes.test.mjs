import { test } from 'node:test';
import assert from 'node:assert/strict';
import ObservableAttributes from '../../src/core/ObservableAttributes.js';

test('ObservableAttributes updates values and emits changes', () => {
    const attributes = new ObservableAttributes();
    const changes = [];
    attributes.onChanged((next) => changes.push(next));

    attributes.set('energy', 8, 10);
    assert.deepEqual(attributes.get('energy'), { kind: 'energy', value: 8, max: 10 });

    attributes.set('key', 2);
    assert.deepEqual(attributes.get('key'), { kind: 'key', value: 2 });
    assert.deepEqual(attributes.toArray(), [
        { kind: 'energy', value: 8, max: 10 },
        { kind: 'key', value: 2 }
    ]);
    assert.equal(changes.length, 2);

    assert.equal(attributes.delete('energy'), true);
    assert.equal(attributes.get('energy'), undefined);
    assert.deepEqual(changes.at(-1), [{ kind: 'key', value: 2 }]);
});

test('ObservableAttributes supports textual values but bounds only numeric values', () => {
    const attributes = new ObservableAttributes();

    attributes.set('movement_mode', 'ghost');
    assert.deepEqual(attributes.get('movement_mode'), { kind: 'movement_mode', value: 'ghost' });

    assert.throws(
        () => attributes.set('movement_mode', 'ghost', 1),
        /only have a max when its value is numeric/
    );
    assert.throws(
        () => attributes.set('movement_mode', /** @type {any} */ (true)),
        /must have a number or string value/
    );
});

test('any producer can update an existing kind (seed adoption)', () => {
    const attributes = new ObservableAttributes();

    // A configuration seeds a value...
    attributes.set('energy', 50);
    // ...and a plugin later adopts and manages it
    attributes.set('energy', 49);
    assert.deepEqual(attributes.get('energy'), { kind: 'energy', value: 49 });
});
