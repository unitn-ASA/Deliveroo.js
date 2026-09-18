import { test } from 'node:test';
import assert from 'node:assert/strict';
import Entity from '../../src/core/Entity.js';
import Xy from '../../src/core/Xy.js';

test('Entity exposes observable attributes in its sensing representation', () => {
    const entity = new Entity({ id: 'test:1', kind: 'battery', xy: new Xy(1, 2) });
    const changes = [];
    entity.emitter.on('attributes', (attributes) => changes.push(attributes));

    entity.attributes.set('charge', 6, 10);
    assert.deepEqual(changes, [[{ kind: 'charge', value: 6, max: 10 }]]);
    assert.deepEqual(entity.attributes.get('charge'), { kind: 'charge', value: 6, max: 10 });
    assert.deepEqual(entity.toIO(), {
        id: 'test:1', kind: 'battery', x: 1, y: 2,
        attributes: [{ kind: 'charge', value: 6, max: 10 }]
    });

    entity.attributes.delete('charge');
    assert.deepEqual(changes.at(-1), []);
});
