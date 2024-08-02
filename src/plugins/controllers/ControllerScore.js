const Controller = require('../../deliveroo/Controller') 
const myClock = require('../../deliveroo/Clock');
const PluginController = require('../PluginController');

class ControllerScore extends Controller {

    constructor(subject, grid){

        super(subject, grid)

        //set the new attribute of the default Agent
        if(!this.subject.get('score'))              this.subject.set('score', 0 )
        if(!this.subject.get('carryingEntities'))   this.subject.set('carryingEntities', new Set() )
        
        //add the new ability to the default agent
        if(!this.subject.scoring)                   this.subject.scoring = scoring
        if(!this.subject.catchEntity)               this.subject.catchEntity = catchEntity
        if(!this.subject.dropEntity)                this.subject.dropEntity = dropEntity
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


const ControllerScorePlugin = new PluginController(
    'ControllerScore',
    ControllerScore,
    {
        SUBJECTS: ['Agent']
    }

)


module.exports = ControllerScorePlugin;


