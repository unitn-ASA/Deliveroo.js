const myClock = require('./Clock');
const config =  require('../../config');

class Controller {

    subject;
    grid; 

    constructor(subject, grid){
        this.subject = subject
        this.grid = grid

        //set the new attribute of the default Agent
        if(!this.subject.get('moving'))             this.subject.set('moving', false )
        if(!this.subject.get('speed'))              this.subject.set('speed', config.MOVEMENT_DURATION )
        
    }


    async up() {
        try {
            //console.log('Agent ', this.name + ' up');
            return await this.move(0, 1);
        } catch (error) {
            console.error(`Error in up: ${error}`);
        }
    }
    
    async down() {
        try {
            //console.log('Agent ', this.name + ' down');
            return await this.move(0, -1);
        } catch (error) {
            console.error(`Error in down: ${error}`);
        }
    }
    
    async left() {
        try {
            //console.log('Agent ', this.name + ' left');
            return await this.move(-1, 0);
        } catch (error) {
            console.error(`Error in left: ${error}`);
        }
    }
    
    async right() {
        try {
            //console.log('Agent ', this.name + ' right');
            return await this.move(1, 0);
        } catch (error) {
            console.error(`Error in right: ${error}`);
        }
    }
    
    async stepByStep ( incr_x, incr_y ) {
        var init_x = this.subject.x
        var init_y = this.subject.y
        const MOVEMENT_DURATION = await this.subject.get('speed') || 500;
        
        if ( config.MOVEMENT_STEPS ) {
            // Immediate offset by 0.6*step
            this.subject.x = ( 100 * this.subject.x + 100 * incr_x / config.MOVEMENT_STEPS * 12/20 ) / 100;
            this.subject.y = ( 100 * this.subject.y + 100 * incr_y / config.MOVEMENT_STEPS * 12/20 ) / 100;
        }
        for ( let i = 0; i < config.MOVEMENT_STEPS; i++ ) {
            // Wait for next step timeout = subject.config.MOVEMENT_DURATION / MOVEMENT_STEPS
            // await new Promise( res => setTimeout(res, subject.config.MOVEMENT_DURATION / MOVEMENT_STEPS ) )
            await myClock.synch( MOVEMENT_DURATION / config.MOVEMENT_STEPS );
            if ( i < config.MOVEMENT_STEPS - 1 ) {
                // Move by one step = 1 / MOVEMENT_STEPS
                this.subject.x = ( 100 * this.subject.x + 100 * incr_x / MOVEMENT_STEPS ) / 100;
                this.subject.y = ( 100 * this.subject.y + 100 * incr_y / MOVEMENT_STEPS ) / 100;
            }
        }
        // Finally at exact destination
        this.subject.x = init_x + incr_x
        this.subject.y = init_y + incr_y
    }

    async move ( incr_x, incr_y ) {
        // if the agent is still moving it can not move again
        if ( this.subject.get('moving') ) return false;     

        // sincronize the method with the game clock 
        this.subject.set('moving', true)                 
        await myClock.synch();
        this.subject.set('moving', false)

        let fromTile = this.grid.getTile( Math.round(this.subject.x), Math.round(this.subject.y) )
       
        // get the end tile of the move 
        let toTile = this.grid.getTile( this.subject.x + incr_x, this.subject.y + incr_y );

        if(!toTile){ return false}               // if the agent try to move to a Tile that not exist return the motion
        
        
        
        // The standard agent cen move to a tile if it is not blocked 
        if (!toTile.locked) {

            let tilefree = await toTile.lock();       // try lo lock the tile 
            if(!tilefree){ return false}              // if the toTile is already locked stop the motion

            this.subject.set('moving', true) 
            await this.stepByStep( incr_x, incr_y );
            this.subject.set('moving', false) 
            fromTile.unlock();
            return { x: this.subject.x, y: this.subject.y };
        }

        return false
    }
    
}

module.exports = Controller;


