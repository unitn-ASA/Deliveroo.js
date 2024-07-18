const Entity =  require('../../deliveroo/Entity')

class Obstacle extends Entity {
    
    static #lastId = 0;
        
    /**
     * @constructor Parcel
     */
    constructor (tile, grid) {

        let id = 'o' + Obstacle.#lastId++;

        let color =  0x2c2c2c ;
        let style = {shape:'box', params:{width:0.5, height: 1, depth:0.3}, color: color}     
        
        super(id, tile.x, tile.y, 'obstacle', grid);
        //console.log('Obstacle ', this.id)

        this.metadata.style = style;
        tile.block()
        
    }

}

module.exports = Obstacle;