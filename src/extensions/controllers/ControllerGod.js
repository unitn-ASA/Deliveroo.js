const Controller = require('../../deliveroo/Controller') 
const Parcel =  require('../entities/Parcel')

class ControllerGod extends Controller{

    constructor(subject, grid){

        super(subject, grid)

        //removes the attribute which makes no sense to exist for God
        this.subject.remove('score')
        this.subject.remove('carryingEntities')
        if(this.subject.scoring)        delete this.subject.scoring
        if(this.subject.catchEntity)    delete this.subject.catchEntity
        if(this.subject.dropEntity)     delete this.subject.dropEntity

    }

    //Overide the move method, the god can move everywhere 
    async move ( incr_x, incr_y ) {
        if ( this.subject.get('moving') ) return false;     
        
        this.subject.set('moving', true)                 
        await this.stepByStep( incr_x, incr_y );
        this.subject.set('moving', false)

        return { x: this.subject.x, y: this.subject.y };
    }

    //With the click 
    async click(x,y){
        
        /*
        let tile = this.#grid.getTile(x,y)

        if ( !tile ) return;

        if ( tile.blocked ) {
            tile.delivery = false;
            tile.spawner = true;
            tile.unblock();
        } else if ( tile.spawner ) {
            tile.delivery = true;
            tile.spawner = false;
        } else if ( tile.delivery ) {
            tile.delivery = false;
            tile.spawner = false;
        } else {
            tile.delivery = false;
            tile.spawner = false;
            tile.block();
        }

        this.#grid.emitOnePerTick( 'tile', tile )
        */
    } 

    //spawn a parcel in the selected tile or if already exist one delete it
    async shiftClick(x,y){
        
        let tile = this.grid.getTile(x,y)
        let entity = Array.from(this.grid.getEntities()).find(e =>e.x == tile.x && e.y == tile.y)

        if(tile.spawner && !entity){        // spawn a new parcel only if the cell i a spawner cell and it not contain already an entity

            let parcel = new Parcel(tile, this.grid)
            return 
        } 

        if(entity && entity.constructor.name == 'Parcel'){
            entity.delete()
        }

    } 
}

module.exports = ControllerGod;