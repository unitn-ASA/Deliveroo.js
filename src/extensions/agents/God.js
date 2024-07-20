const Grid =  require('../../deliveroo/Grid')
const Postponer = require('../../deliveroo/Postponer');
const myClock = require('../../deliveroo/Clock');
const Agent =  require('../../deliveroo/Agent')


class God extends Agent{
    
    /**
     * @constructor God
     * @param {Grid} grid
     * @param {{id:number,name:string}} options
     */
    constructor ( grid, id, name, tile, type = 'god' ) {
        
        let x = 0
        let y = 0

        super(grid, id, name, tile, type); 
        
        this.set('style', null);                            //the God agent hasn't a graphic rappresentation 
        this.set('label', null);
        this.set('agents_observation_distance', 100)        //the God agent can see anything 
        this.set('entities_observation_distance', 100)

        this.grid.removeAgent(this)                         //remove the God agent from the grid, this becouse we don'twant that other agent know about it 
    }

}
/*
    
    //change the typo of the tile
   

    

*/

module.exports = God;