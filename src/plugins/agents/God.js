const Grid =  require('../../deliveroo/Grid')
const Agent =  require('../../deliveroo/Agent');
const PluginAgent = require('../PluginAgent');


class God extends Agent{
    
    /**
     * @constructor God
     * @param {Grid} grid
     * @param {{id:number,name:string}} options
     */
    constructor ( grid, id, name, tile, type = 'god' ) {
        
        super(grid, id, name, tile, type); 
        
        this.set('style', null);                            //the God agent hasn't a graphic rappresentation 
        this.set('label', null);
        this.set('agents_observation_distance', 100)        //the God agent can see anything 
        this.set('entities_observation_distance', 100)
        this.set('speed', 250)

        this.grid.removeAgent(this)                         //remove the God agent from the grid, this becouse we don'twant that other agent know about it 
    }

}

const GodPlugin = new PluginAgent(
    'God',
    God,
)


module.exports = GodPlugin;