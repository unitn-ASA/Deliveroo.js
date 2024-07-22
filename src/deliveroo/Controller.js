const myClock = require('./Clock');
const Entity = require('./Entity');
const config =  require('../../config');

const MOVEMENT_STEPS = process.env.MOVEMENT_STEPS || config.MOVEMENT_STEPS || 1;
const AGENT_SPEED = config.MOVEMENT_DURATION || 500

class Controller {

    subject;
    grid; 

    constructor(subject, grid){
        this.subject = subject
        this.grid = grid

        //set the new attribute of the default Agent
        if(!this.subject.get('score'))              this.subject.set('score', 0 )
        if(!this.subject.get('moving'))             this.subject.set('moving', false )
        if(!this.subject.get('carryingEntities'))   this.subject.set('carryingEntities', new Set() )
        if(!this.subject.get('speed'))              this.subject.set('speed', AGENT_SPEED)
        
        //add the new ability to the default agent
        if(!this.subject.scoring)                   this.subject.scoring = scoring
        if(!this.subject.catchEntity)               this.subject.catchEntity = catchEntity
        if(!this.subject.dropEntity)                this.subject.dropEntity = dropEntity
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

    /**
     * Pick up all entities in the agent tile.
     * @function pickUp
     * @returns {Promise<Entity[]>} An array of entity that have been picked up
     */
    async pickUp() {
        try {
            //console.log('Agent ', this.name + 'pickUp');
            return await this.subject.catchEntity();
        } catch (error) {
            console.error(`Error in right: ${error}`);
        }
        
    }
    
    /**
     * Put down entities:
     * @function putDown
     * @returns {Promise<Entity[]>} An array of entity that have been put down
     */
    async putDown() {
        try {
            //console.log('Agent ', this.name + 'putDown');
            return await this.subject.dropEntity();
        } catch (error) {
            console.error(`Error in right: ${error}`);
        }
    }
    
    async stepByStep ( incr_x, incr_y ) {
        var init_x = this.subject.x
        var init_y = this.subject.y
        const MOVEMENT_DURATION = await this.subject.get('speed') || 500;
        
        if ( MOVEMENT_STEPS ) {
            // Immediate offset by 0.6*step
            this.subject.x = ( 100 * this.subject.x + 100 * incr_x / MOVEMENT_STEPS * 12/20 ) / 100;
            this.subject.y = ( 100 * this.subject.y + 100 * incr_y / MOVEMENT_STEPS * 12/20 ) / 100;
        }
        for ( let i = 0; i < MOVEMENT_STEPS; i++ ) {
            // Wait for next step timeout = subject.config.MOVEMENT_DURATION / MOVEMENT_STEPS
            // await new Promise( res => setTimeout(res, subject.config.MOVEMENT_DURATION / MOVEMENT_STEPS ) )
            await myClock.synch( MOVEMENT_DURATION / MOVEMENT_STEPS );
            if ( i < MOVEMENT_STEPS - 1 ) {
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

function scoring(sc){   
    if ( sc > 0 ) {
        this.set('score', this.get('score') + sc )
        console.log( this.get('name') + `(${this.id}) scores (+ ${sc} pti -> ` + this.get('score'), ` pti)` );
    }
}

async function catchEntity(){
    try {
        
        if ( this.get('move') )
            return [];

        this.set('moving',true) 
        await myClock.synch();
        this.set('moving',false) 

        const picked = new Array();
        
        for ( const  entity of this.grid.getEntities() ) {
            if ( entity.x == this.x && entity.y == this.y ) {
                try {
                    let result = entity.pickedUp(this)
                    if(result){
                        this.get('carryingEntities').add(entity);
                        picked.push( entity );
                    }
                } catch (error) {
                    console.log('The entity ', entity.id + ' is not collectible')
                }
                
            }
        }

        // console.log(this.id, 'pickUp', counter, 'parcels')
        if ( picked.length > 0 )
            this.grid.emitOnePerFrame( 'pickup', this, picked );
        return picked; // Array.from(this.#carryingParcels);

    } catch (error) {
        console.error(`Error in pickUp: ${error}`);
    }
}

async function dropEntity(){
    try {
        //console.log('Agent ', this.name + ' putDown');
        if ( this.get('move')  )
            return [];

        this.set('moving',true) 
        await myClock.synch();
        this.set('moving',false) 

        var tile = this.grid.getTile( Math.round(this.x), Math.round(this.y) )
        var dropped = new Array();
        
        for ( const entity of this.get('carryingEntities') ) {
            try {
                let result = entity.putDown(this, tile)
                if(result){
                    this.get('carryingEntities').delete(entity);
                    dropped.push( entity );
                }
            } catch (error) {
                console.log(error)
                console.log('The entity ', entity.id + ' is not releasable')
            }
        }

        if ( dropped.length > 0 )
            this.grid.emitOnePerFrame( 'putdown', this, dropped );

        return dropped;

    } catch (error) {
        console.error(`Error in putDown: ${error}`);
    }
}



module.exports = Controller;


