const Controller = require('../../deliveroo/Controller') 
const myClock = require('../../deliveroo/Clock');
const config =  require('../../../config');


class ControllerStrong extends Controller {

    constructor(subject, grid){

        super(subject, grid)

    }

    /**
     * Pick up all entities in the agent tile.
     * @function pickUp
     * @returns {Promise<Entity[]>} An array of entity that have been picked up
     */
    async shiftUp() {
        try {
            return await this.push(0, 1);
        } catch (error) {
            console.error(`Error in shift-up: ${error}`);
        }
    }
    
    async shiftDown() {
        try {
            return await this.push(0, -1);
        } catch (error) {
            console.error(`Error in shift-down: ${error}`);
        }
    }
    
    async shiftLeft() {
        try {
            return await this.push(-1, 0);
        } catch (error) {
            console.error(`Error in shift-left: ${error}`);
        }
    }
    
    async shiftRight() {
        try {
            return await this.push(1, 0);
        } catch (error) {
            console.error(`Error in shift-right: ${error}`);
        }
    }

    async push(incr_x, incr_y){   
       
        // get the end tile of the move 
        let toTile = this.grid.getTile( this.subject.x + incr_x, this.subject.y + incr_y );
        if(!toTile){ return false}               // if the agent try to pudh over a tile that not exist, end the action 
    
         // check if in the toTile there is a Obstacle 
        let obstacle = this.grid.getEntity(toTile.x, toTile.y)
        
        if ( obstacle && obstacle.type == 'obstacle' ) {
    
            //check if the end tile of the obstacle is free
            let obstacleToTile = this.grid.getTile( obstacle.x + incr_x, obstacle.y + incr_y );
    
            if(!obstacleToTile.locked){
                if(obstacle.get('moving') == true) return   // if the obstacle is still moving it can not move again
    
                // move the obstacle
                let tilefree = await obstacleToTile.lock();       // try lo lock the tile 
                if(!tilefree){ return false}                      // if the toTile is already locked stop the motion
    
                obstacle.set('moving', true) 
                await moveObstacle(obstacle, incr_x, incr_y );
                obstacle.set('moving', false)
                 
                toTile.unlock();
                return { x: this.subject.x, y: this.subject.y };
            }
            
        }
    
        return false
    }
    
}


async function moveObstacle ( obstacle, incr_x, incr_y ) {
    var init_x = obstacle.x
    var init_y = obstacle.y
    const MOVEMENT_DURATION = 500;
    
    if ( config.MOVEMENT_STEPS ) {
        // Immediate offset by 0.6*step
        obstacle.x = ( 100 * obstacle.x + 100 * incr_x / config.MOVEMENT_STEPS * 12/20 ) / 100;
        obstacle.y = ( 100 * obstacle.y + 100 * incr_y / config.MOVEMENT_STEPS * 12/20 ) / 100;
    }
    for ( let i = 0; i < config.MOVEMENT_STEPS; i++ ) {
        // Wait for next step timeout = subject.config.MOVEMENT_DURATION / MOVEMENT_STEPS
        // await new Promise( res => setTimeout(res, subject.config.MOVEMENT_DURATION / MOVEMENT_STEPS ) )
        await myClock.synch( MOVEMENT_DURATION / config.MOVEMENT_STEPS );
        if ( i < config.MOVEMENT_STEPS - 1 ) {
            // Move by one step = 1 / MOVEMENT_STEPS
            obstacle.x = ( 100 * obstacle.x + 100 * incr_x / MOVEMENT_STEPS ) / 100;
            obstacle.y = ( 100 * obstacle.y + 100 * incr_y / MOVEMENT_STEPS ) / 100;
        }
    }
    // Finally at exact destination
    obstacle.x = init_x + incr_x
    obstacle.y = init_y + incr_y
}



const ControllerStrongPlugin = {
    name: 'ControllerStrong',
    extension: ControllerStrong,
    settings: { SUBJECTS: ['Strong'] }
}


module.exports = ControllerStrongPlugin;


