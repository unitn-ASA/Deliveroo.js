const { uid } = require('uid'); 
const Config = require('./Config');
const Leaderboard = require('./Leaderboard');
const Match = require('./Match');

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
        
        id = id.toString();                         // Convert all id to string
        //console.log(Arena.matches);
        
        let match = Arena.matches.get(id);          // Try to get the match seraching the id in the id-match map                      
        if ( !match ){                              // If there are found none create a new one     

            while ( Arena.matches.has(id) ){        // Find a not already used id
                id = uid(4);
            } 

            console.log('NEW MATCH')
            match = new Match( config, id );        // Create a new Match and add it to the id-match map
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