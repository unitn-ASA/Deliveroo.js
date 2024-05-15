const Observable =  require('./Observable')

/**
 * @class Xy
 * @extends Observable
 */
 class Xy extends Observable {
    
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
        super();
        this.x = x;
        this.y = y;
        // group 'x' and 'y' into 'xy'
        this.interceptValueSet('x', 'xy')
        this.interceptValueSet('y', 'xy')
    }

    // get x () { return this.#x }
    // get y () { return this.#y }

    /**
     * rectanguralDistanceTo
     * @param {{x:Number,y:Number}} a
     * @param {{x:Number,y:Number}} b
     */
    static distance ( a = {x:undefined, y:undefined}, b = {x:undefined, y:undefined} ) {
        return Math.abs( b.x - a.x ) +  Math.abs( b.y - a.y )
    }

    distance ( other = {x:undefined, y:undefined} ) {
        return Xy.distance(this, other)
    }

    static equals ( a = {x:undefined, y:undefined}, b = {x:undefined, y:undefined} ) {
        return b.x == a.x && b.y == a.y;
    }

    equals ( other = {x:undefined, y:undefined} ) {
        return Xy.equals(this, other)
    }

}



module.exports = Xy;