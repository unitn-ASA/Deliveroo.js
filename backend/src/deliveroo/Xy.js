


/**
 * @class Xy
 */
 class Xy {
    
    #x;
    /** @type {Number} x */
    get x () { return this.#x }
    
    #y;
    /** @type {Number} y */
    get y () { return this.#y }
    
    /**
     * @constructor Xy
     * @param { {x:number, y:number} | number } xy
     * @param { number } y
     */
    constructor ( xy, y = undefined ) {
        if ( typeof xy === 'object' ) {
            this.#x = xy.x;
            this.#y = xy.y;
        } else {
            this.#x = xy;
            this.#y = y;
        }
        Object.defineProperty (this, 'x', {
            get: () => this.#x,
            enumerable: true
        });
        Object.defineProperty (this, 'y', {
            get: () => this.#y,
            enumerable: true
        });
    }

    /**
     * @returns { Xy }
     */
    get rounded () {
        return new Xy( Math.round(this.x), Math.round(this.y) );
    }

    /**
     * @param { {x:number, y:number} } a
     * @param { {x:number, y:number} } b
     * @returns { number}
     */
    static distance ( a, b ) {
        return Math.abs( b.x - a.x ) +  Math.abs( b.y - a.y )
    }
    
    /**
     * @param { {x:number, y:number} } other 
     * @returns { number }
    */
   distance ( other ) {
       return Xy.distance(this, other)
    }
    
    /**
     * @param { {x:number, y:number} } a
     * @param { {x:number, y:number} } b
     * @returns { boolean}
     */
    static equals ( a, b ) {
        return b.x == a.x && b.y == a.y;
    }

    /**
     * @param { {x:number, y:number} } other 
     * @returns { boolean }
    */
    equals ( other ) {
        return Xy.equals(this, other)
    }

    /**
     * @returns { String }
    */
    toString () {
        return `${this.x}_${this.y}`
    }

}



module.exports = Xy;