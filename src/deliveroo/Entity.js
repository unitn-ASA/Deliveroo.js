const Xy =  require('./Xy')

class Entity extends Xy {

    id
    #grid

    constructor (id, x, y, type, grid ) {
        super(x, y, type);
        this.id = id;
        this.#grid = grid
        this.#grid.createEntity(this);
    }

    delete(){
        this.#grid.deleteEntity(this.id)
    }

    /* overide the emit method in order to catch all the event emited by the subclass and propagate all them with only one event: 'update-entity'. 
    In this way the grid is able to capture all the events emitted by all the Entities and propagate them in turn towards the client*/
    emit(event, ...args) {
        //console.log(event + " emitted")
        super.emit(event,...args)
        if (event != 'update-entity') {
            super.emit('update-entity');
        }
    }
    

}

module.exports = Entity;