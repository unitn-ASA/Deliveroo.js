const Observable =  require('./Observable')



class Service {

    #running = false;
    #name;

    constructor ( name ) {
        this.#name = name;
    }


    isRunning () {
        return this.#running;
    }
    
    start () {
        console.log( "Starting service", this.#name )
        if ( ! this.#running ) {
            this.#running = true;
        }
    }

    stop () {
        console.log( "Stopping service", this.#name )
        if ( this.#running ) {
            this.#running = true;
        }
    }

}



module.exports = Service;