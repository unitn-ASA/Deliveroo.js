const Tile =  require('../../deliveroo/Tile')

class Hole extends Tile {

    constructor(grid, x, y) {

        super(grid, x, y, 'hole');

        const style = { shape: 'box', params: { width: 1, height: 0.1, depth: 1 }, color: 0x000000 };
        this.metadata.style = style;

        this.lock()
    }          
}

const HolePlugin = {
    name: 'Hole',
    extension: Hole,
    settings: { MAP_ID: 0 }
}

module.exports = HolePlugin;