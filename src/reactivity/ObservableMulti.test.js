const ObservableMulti = require('./ObservableMulti');


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
        
        console.log( 'first', this.x );
        
        this.on('x', (me) => console.log('fired immediately after set', me, me.x));
        this.watch('x');
        this.x = 1;
        this.x = 2;
        this.x;

        console.log( 'at the end', this.x );
    }

}

new TestObservableMulti();