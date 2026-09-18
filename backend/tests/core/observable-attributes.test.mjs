import { test } from 'node:test';
import assert from 'node:assert/strict';
import ObservableAttributes from '../../src/core/ObservableAttributes.js';

test('ObservableAttributes enforces ownership and emits changes', () => {
    const attributes = new ObservableAttributes();
    const changes = [];
    attributes.onChanged((next) => changes.push(next));

    attributes.set('energy', 8, 10, { owner: 'energy' });
    assert.deepEqual(attributes.get('energy'), { kind: 'energy', value: 8, max: 10 });
    assert.throws(() => attributes.set('energy', 7, 10, { owner: 'other' }), /owned by 'energy'/);

    attributes.set('key', 2, undefined, { owner: 'keys-doors' });
    assert.equal(attributes.deleteByOwner('energy'), true);
    assert.equal(attributes.get('energy'), undefined);
    assert.deepEqual(attributes.toArray(), [{ kind: 'key', value: 2 }]);
    assert.deepEqual(changes.at(-1), [{ kind: 'key', value: 2 }]);
});
