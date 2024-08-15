const Entity =  require('../../deliveroo/Entity')

class Obstacle extends Entity {
    
    /**
     * @constructor Obstacle
     */
    constructor (tile, grid) {

        super(tile.x, tile.y, 'obstacle', grid);

        let color =  0x4d4d4d ;
        let style = {shape:'box', params:{width:0.5, height: 1, depth:0.3}, color: color}     

        this.set('style', style) 
        
        tile.lock()
        
    }

}

const ObstaclePlugin = {
    name: 'Obstacle',
    extension: Obstacle,
    settings: { OBSTACLE_MAX: '5' }
}



module.exports = ObstaclePlugin;