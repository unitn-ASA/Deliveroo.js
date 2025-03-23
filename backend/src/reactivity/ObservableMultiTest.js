require('dotenv').config();
const timersPromises = require('timers/promises')
const ObservableMulti = require('./ObservableMulti');
const myClock = require('../myClock');
myClock.start();



/**
 * @class TestObservableMulti
 * @extends { ObservableMulti<{x: number}> }
 */
class TestObservableMulti extends ObservableMulti {

    /**
     * @property {number} x
     */
    x;

    constructor() {
        super();
        
        // console.log( 'first', this.x );
        
        // this.on('x', (me) => console.log('fired immediately after set', me, me.x));
        this.watch( 'x' );
        this.x = 1;
        this.x = 2;

        // console.log( 'at the end', this.x );

    }

}



async function main () {
    
    var obs = [null];

    while ( true ) {

        obs.pop();

        await timersPromises.setImmediate();

        let ob = new TestObservableMulti();
        obs.push( ob );
        ob.on( 'x', () => console.log('hi') );
        // obs.removeAllListeners( 'x' );

    }

}

main();
