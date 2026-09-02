


/**
 * @class
 */
class Identity {

    /** @type {number} lastId */
    static #lastId = 0;
    
    /** @readonly @property {string} id */
    id;
    
    /** @readonly @property {string} name */
    name;
    
    /** @readonly @property {string} teamId */
    teamId;

    /** @readonly @property {string} teamName */
    teamName;
    
    /** @readonly @property {string} role */
    role;


    /**
     * @constructor
     * @param {string} id
     * @param {string} name
     * @param {string} teamId
     * @param {string} teamName
     * @param {string} role
     */
    constructor ( id = undefined, name = undefined, teamId = undefined, teamName = undefined, role = undefined ) {

        this.id = id || 'a' + Identity.#lastId++;
        this.name = name || this.id;
        this.teamId = teamId;
        this.teamName = teamName;
        this.role = role || 'user';

    }



    toString () {
        return `${this.name} (${this.id}) of ${this.teamName} (${this.teamId}) as ${this.role}`;
    }

}



export default Identity;