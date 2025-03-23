


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
    
    /** @readonly @property {string} socketId */
    socketId;
    


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

        this.id = id || 'a' + Identity.#lastId++;
        this.name = name || this.id;
        this.teamId = teamId;
        this.teamName = teamName;
        this.role = role || 'user';
        this.socketId = socketId;

    }



    toString () {
        return `${this.name} (${this.id}) of ${this.teamName} (${this.teamId}) as ${this.role} from socket ${this.socketId}`;
    }

}



module.exports = Identity;