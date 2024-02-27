


/**
 * @typedef { { me:{id,name,team,x,y}, agents:[{id,name,team,x,y,score}], parcels:[{x,y,type}] } } Status
 */



/**
 * @interface InputInterface
 * @abstract
 * @method up
 * @method down
 * @method left
 * @method right
 * @method pickup
 * @method putdown
 * @method say
 * @method shout
 * @method ask
 * @method path
 * @method log
 * @method draw
 */
class InterfaceController {

    /**
     * @abstract
     * @returns {Promise<Status>}
     */
    up () {
        throw new Error('Abstract method');
    }

    /** @returns {Promise<Status>} */
    down () {
        throw new Error('Abstract method');
    }

    /** @returns {Promise<Status>} */
    left () {
        throw new Error('Abstract method');
    }

    /** @returns {Promise<Status>} */
    right () {
        throw new Error('Abstract method');
    }

    /** @returns {Promise<Status>} */
    pickup () {
        throw new Error('Abstract method');
    }

    /** @returns {Promise<Status>} */
    putdown () {
        throw new Error('Abstract method');
    }

    say () {
        throw new Error('Abstract method');
    }

    shout () {
        throw new Error('Abstract method');
    }

    /** @returns {Promise<string>} get the reply */
    ask () {
        throw new Error('Abstract method');
    }

    path () {
        throw new Error('Abstract method');
    }

    log () {
        throw new Error('Abstract method');
    }

    draw () {
        throw new Error('Abstract method');
    }

}


module.exports = InterfaceController;