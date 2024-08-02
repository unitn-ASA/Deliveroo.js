const Entity =  require('../../deliveroo/Entity')
const PluginEntity = require('../PluginEntity')

class Obstacle extends Entity {
    
    /**
     * @constructor Obstacle
     */
    constructor (tile, grid) {

        super(tile.x, tile.y, 'obstacle', grid);

        let color =  0x2c2c2c ;
        let style = {shape:'box', params:{width:0.5, height: 1, depth:0.3}, color: color}     

        this.set('style', style) 
        
        tile.lock()
        
    }

}

const ObstaclePlugin = new PluginEntity(
    'Obstacle',
    Obstacle,
    {   
        OBSTACLE_MAX: '5', 
    }
)



module.exports = ObstaclePlugin;