const Observable =  require('../utils/Observable')



class Parcel extends Observable {
    
    static #lastId = 0;
    
    #grid;
    id;
    reward;
    
    /**
     * @constructor Parcel
     * @param {Grid} grid
     */
    constructor (grid) {
        super();

        this.#grid = grid;
        this.id = Parcel.#lastId++;
        this.reward = Math.floor(Math.random()*100);

        // // Dispatch all my events
        // this.observe( Game.dispatcher.triggerEvents.bind(Game.dispatcher) );

        // Make observable
        this.interceptValueSet('reward')

        const startDecading = async () => {
            while ( this.reward > 0 ) {
                await new Promise( res => setTimeout(res, 1000) )
                this.reward = Math.floor( this.reward - this.reward/4 );
            }
            this.destroy();
        }
        startDecading();

    }

    destroy () {
        this.triggerEvent( new Observable.Event('removed parcel', this, this) )
    }

}



module.exports = Parcel;