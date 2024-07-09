const Observable =  require('./Observable')

/**
 * @class Xy
 */
 class Xy extends Observable {
    
    /** @attribute {Number} x */
    x;
    /** @attribute {Number} y */
    y;
    /** @attribute {String} type */
    type;
    /** @attribute {{}} geometry */
    metadata 


    /**
     * @constructor Xy
     * @param {Number} x
     * @param {Number} y
     */
    constructor(x, y, type) {
        super();
        this.x = x;
        this.y = y;
        this.type = type
        this.metadata = {}

        // Group 'x' and 'y' into 'xy'
        this.interceptValueSet('x', 'xy');
        this.interceptValueSet('y', 'xy');
    }

    // get x () { return this.#x }
    // get y () { return this.#y }

    /**
     * rectanguralDistanceTo
     */
    static distance ( a = {x, y}, b = {x, y} ) {
        return Math.abs( b.x - a.x ) +  Math.abs( b.y - a.y )
    }

    distance ( other = {x, y} ) {
        return Xy.distance(this, other)
    }

    static equals ( a = {x, y}, b = {x, y} ) {
        return b.x == a.x && b.y == a.y;
    }

    equals ( other = {x, y} ) {
        return Xy.equals(this, other)
    }

}



module.exports = Xy;