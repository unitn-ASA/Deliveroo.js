const Xy =  require('./Xy')

class Entity extends Xy {

    static #lastId = 0;

    id
    grid

    constructor (x, y, type, grid ) {
        super(x, y, type);
        
        this.id = 'e' + Entity.#lastId++;
        this.grid = grid
        this.grid.addEntity(this)
        this.grid.postponeAtNextFrame( this.grid.emit.bind(this.grid) )('update',this)
    }

    delete(){
        this.grid.removeEntity(this.id)
        this.grid.postponeAtNextFrame( this.grid.emit.bind(this.grid) )('update',this)
    }

    get(property){
        return  this.metadata[property]
    }
    
    set(property, value){
        //console.log('SET ', property , value)
        this.metadata[property] = value
        this.grid.postponeAtNextFrame( this.grid.emit.bind(this.grid) )('update',this)      //emit only one time at the end of the frame the update event
    }
    
}

module.exports = Entity;