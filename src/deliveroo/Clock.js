const Observable =  require('./Observable')



class Clock extends Observable {

    #s = 0;
    get s () {
        return this.#s;
    }
    
    constructor () {
        super();
        this.start();
        this.setMaxListeners(200);
    }
    
    #stop = true;
    stop () {
        this.#stop = true;
    }
    async start () {
        if ( this.#stop ) {
            this.#stop = false;
            while ( !this.#stop ) {
                await new Promise( res => setTimeout(res, 1000) );
                ++this.#s;
                this.emit( '1s' );
                if ( this.#s % 2 == 0 ) this.emit( '2s' );
                if ( this.#s % 5 == 0 ) this.emit( '5s' );
                if ( this.#s % 10 == 0 ) this.emit( '10s' );
            }
        }
        else {
            return;
        }
    }

}
const myClock = new Clock();



module.exports = myClock;