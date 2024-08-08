const Tile =  require('../../deliveroo/Tile')

class Delivery extends Tile {

    constructor(grid, x, y) {

        super(grid, x, y, 'delivery');

        const style = { shape: 'box', params: { width: 1, height: 0.1, depth: 1 }, color: 0xff0000 };
        this.metadata.style = style;

    }

            
}

const DeliveryPlugin = {
    name: 'Delivery',
    extension: Delivery,
    settings: { MAP_ID: 2 }
}

module.exports = DeliveryPlugin;