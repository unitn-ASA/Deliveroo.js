const Tile =  require('../../deliveroo/Tile')


class Spawner extends Tile {

    constructor(grid, x, y) {

        super(grid, x, y, 'spawner');

        const style = { shape: 'box', params: { width: 1, height: 0.1, depth: 1 }, color: 0x00ff00 };
        this.metadata.style = style;

    }           
}

const SpawnerPlugin = {
    name: 'Spawner',
    extension: Spawner,
    settings: { MAP_ID: 1 }
}

module.exports = SpawnerPlugin;