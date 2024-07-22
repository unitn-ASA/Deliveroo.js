const Tile =  require('../../deliveroo/Tile')
const Grid =  require('../../deliveroo/Grid')

/**
 * @class Fast
 */
 class Fast extends Tile {

    /**
     * @constructor Tile
     * @param {Grid} grid
     * @param {*} x
     * @param {*} y
     */
    constructor(grid, x, y) {

        super(grid, x, y, 'grass');

        const style = { shape: 'box', params: { width: 1, height: 0.1, depth: 1 }, color: 0x003399 };
        this.metadata.style = style;

        this.on('locked', () => {
            let agents = Array.from(this.grid.getAgents());
            let agent = agents.find(a => Math.round(a.x) == this.x && Math.round(a.y) == this.y);
            if(agent){
                try {   this.updateSpeed(agent)} 
                catch (error) { console.log('unable to update the speed') }
            }
        })

    }

    async updateSpeed(agent){
        let oldSpeed = agent.get('speed')
        //if the agent has not a speed attribute means it can not move, so is usless speed it up 
        if(!oldSpeed) return                

        agent.set('speed', 250)             

        while(this.x == Math.round(agent.x) && this.y == Math.round(agent.y)){
            await new Promise(resolve => setTimeout(resolve, 10)); 
        }

        agent.set('speed', oldSpeed)
    }

            
}


module.exports = Fast;