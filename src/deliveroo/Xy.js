

/**
 * @class Xy
 */
 class Xy {

    static #set = new Array();
    static getXy(x, y) {
        if ( !this.#set[x] )
            while ( !this.#set[x] )
                this.#set.push( new Array() );
        if ( this.#set[x][y])
            while ( !this.#set[x][y] )
                this.#set[x].push( new Xy(x, y) );
        return this.#set[x][y];
    }

    #x;
    #y;

    /** @attribute {Number} x */
    x;
    /** @attribute {Number} y */
    y;
    
    /**
     * @constructor Xy
     * @param {Number} x
     * @param {Number} y
     */
    constructor ( x, y ) {
        this.#x = x;
        this.#y = y;

        Object.defineProperty( this, 'x', {
            get: () => this.#x,
            enumerable: true
        })

        Object.defineProperty( this, 'y', {
            get: () => this.#y,
            enumerable: true
        })
    }

    // get x () { return this.#x }
    // get y () { return this.#y }

    /**
     * rectanguralDistanceTo
     */
    distance (other) {
        return  Math.abs( other.x - this.x ) +  Math.abs( other.y - this.y )
    }

    moveX (x) {
        return  new Xy( this.x + x, this.y )
    }

    moveY (y) {
        return  new Xy( this.x, this.y + y )
    }

    equals (other) {
        return other.x == this.x && other.x == this.x;
    }

    toString () {
        return '{x:'+this.x+',y:'+this.y+'}';
    }

}



module.exports = Xy;