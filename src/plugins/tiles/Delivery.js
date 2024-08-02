const Tile =  require('../../deliveroo/Tile')
const PluginTile = require('../PluginTile')
const Grid =  require('../../deliveroo/Grid')

/**
 * @class Delivery
 */
class Delivery extends Tile {

    /**
     * @constructor Tile
     * @param {Grid} grid
     * @param {*} x
     * @param {*} y
     */
    constructor(grid, x, y) {

        super(grid, x, y, 'delivery');

        const style = { shape: 'box', params: { width: 1, height: 0.1, depth: 1 }, color: 0xff0000 };
        this.metadata.style = style;

    }

            
}

const DeliveryPlugin = new PluginTile(
    'Delivery',
    Delivery,
    {
        MAP_ID: 2
    }
)

module.exports = DeliveryPlugin;