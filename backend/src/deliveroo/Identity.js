


/**
 * @class
 */
class Identity {

    /** @type {number} lastId */
    static #lastId = 0;
    
    #id;
    /** @type {string} id */
    get id () { return this.#id; };
    
    #name;
    /** @type {string} name */
    get name () { return this.#name; };
    
    #teamId
    /** @type {string} teamId */
    get teamId () { return this.#teamId; };

    #teamName;
    /** @type {string} teamName */
    get teamName () { return this.#teamName; };

    #role;
    /** @type {string} role */
    get role () { return this.#role; };

    #socketId;
    /** @type {string} socketId */
    get socketId () { return this.#socketId; };



    /**
     * @constructor
     * @param {string} id
     * @param {string} name
     * @param {string} teamId
     * @param {string} teamName
     * @param {string} role
     * @param {string} socketId
     */
    constructor ( id = undefined, name = undefined, teamId = undefined, teamName = undefined, role = undefined, socketId = undefined ) {

        this.#id = id || 'a' + Identity.#lastId++;
        this.#name = name || this.id;
        this.#teamId = teamId;
        this.#teamName = teamName;
        this.#role = role || 'user';
        this.#socketId = socketId;

    }

}



module.exports = Identity;