const Tile =  require('../../deliveroo/Tile')
const PluginTile = require('../PluginTile')
const Grid =  require('../../deliveroo/Grid')

/**
 * @class Hole
 */
 class Hole extends Tile {

    /**
     * @constructor Tile
     * @param {Grid} grid
     * @param {*} x
     * @param {*} y
     */
    constructor(grid, x, y) {

        super(grid, x, y, 'grass');

        const style = { shape: 'box', params: { width: 1, height: 0.1, depth: 1 }, color: 0x000000 };
        this.metadata.style = style;

        this.lock()

    }

            
}

const HolePlugin = new PluginTile(
    'Hole',
    Hole,
    {
        MAP_ID: 0
    }
)

module.exports = HolePlugin;