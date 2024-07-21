const Tile =  require('../../deliveroo/Tile')
const Grid =  require('../../deliveroo/Grid')

/**
 * @class Spawner
 */
 class Spawner extends Tile {

    /**
     * @constructor Tile
     * @param {Grid} grid
     * @param {*} x
     * @param {*} y
     */
    constructor(grid, x, y) {

        super(grid, x, y, 'spawner');

        const style = { shape: 'box', params: { width: 1, height: 0.1, depth: 1 }, color: 0x00ff00 };
        this.metadata.style = style;

    }

            
}

module.exports = Spawner;