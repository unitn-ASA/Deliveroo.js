import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseIOTileType, VALID_TILE_TYPES } from '../src/types/IOTile.js';

test('parseIOTileType accepts every valid tile type', () => {
    for (const type of VALID_TILE_TYPES) {
        assert.equal(parseIOTileType(type), type);
    }
});

test('parseIOTileType trims valid input and accepts numeric types', () => {
    assert.equal(parseIOTileType(' 5! '), '5!');
    assert.equal(parseIOTileType(0), '0');
    assert.equal(parseIOTileType(5), '5');
});

test('parseIOTileType rejects invalid complete values', () => {
    assert.equal(parseIOTileType('x'), '0');
    assert.equal(parseIOTileType('5!invalid'), '0');
    assert.equal(parseIOTileType('50'), '0');
});
