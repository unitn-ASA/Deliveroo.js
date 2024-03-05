const { uid } = require('uid'); 
const Config = require('./Config');
const Leaderboard = require('./Leaderboard');
const Match = require('./Match.js');

class Arena {

    /**
     * @type {Map<string, Match>}
     */
    static matches = new Map();

    /** 
     * @param {string} name
     * @returns {Match}
     */
    static getMatch ( name ) {
        return Arena.matches.get(name);
    }

    /**
     * @param {{name:string, config:Config}} options
     * @returns 
     */
    static getOrCreateMatch ( { id = uid(4), config = new Config() } ) {
        while ( Arena.matches.has(id) )
            id = uid(4);
        let match = Arena.matches.get(id);
        if ( !match ){
            match = new Match( config, id );
            Arena.matches.set(id, match);
        }
        return match;
    }

    /**
     * @param {string} name 
     */
    static deleteMatch (name) {
        let match = Arena.matches.get(name);
        match.destroy();
        Arena.matches.delete(name);
    }
    
    

}

module.exports = Arena;