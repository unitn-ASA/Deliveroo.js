import { test } from 'node:test';
import assert from 'node:assert/strict';
import Entity from '../../src/core/Entity.js';
import EntityLayer from '../../src/core/EntityLayer.js';
import SpatialLayer from '../../src/core/SpatialLayer.js';
import Xy from '../../src/core/Xy.js';

test('SpatialLayer indexes existing objects and forwards attribute changes', async () => {
    const layer = new SpatialLayer({ id: 'test' });
    const entity = new Entity({ id: 'entity:1', kind: 'test', xy: new Xy(1, 2) });
    const changes = [];
    layer.onChanged((event) => changes.push(event.type));

    layer.add(entity);
    assert.equal(layer.get('entity:1'), entity);
    assert.equal(layer.getOneByXy({ x: 1, y: 2 }), entity);
    assert.deepEqual(changes, ['added']);

    entity.attributes.set('charge', 3, 5);
    assert.deepEqual(changes, ['added', 'changed']);

    entity.xy = new Xy(3, 4);
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(layer.getOneByXy({ x: 1, y: 2 }), undefined);
    assert.equal(layer.getOneByXy({ x: 3, y: 4 }), entity);
    assert.deepEqual(changes, ['added', 'changed', 'changed']);

    assert.equal(layer.remove(entity), true);
    assert.equal(layer.get('entity:1'), undefined);
    assert.deepEqual(entity.attributes.get('charge'), { kind: 'charge', value: 3, max: 5 }, 'removal does not delete the object');
    assert.equal(entity.toIO().id, 'entity:1');
    assert.deepEqual(changes, ['added', 'changed', 'changed', 'removed']);
});

test('EntityLayer creates registered entities with layer-scoped ids', () => {
    const layer = new EntityLayer({ id: 'energy:batteries' });
    const entity = layer.create({ kind: 'battery', xy: new Xy(0, 0) });

    assert.equal(entity.id, 'energy:batteries:1');
    assert.equal(layer.get(entity.id), entity);
    entity.delete();
    assert.equal(layer.get(entity.id), undefined);
});
