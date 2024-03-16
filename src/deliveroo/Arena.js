const { uid } = require('uid'); 
const Config = require('./Config');
const Leaderboard = require('./Leaderboard');
const Match = require('./Match');
const Timer = require('./Timer');

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
        if(Arena.matches.has(name)){ return Arena.matches.get(name);}
        return false
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

            console.log('NEW MATCH ', id)
            match = new Match( config, id );        // Create a new Match and add it to the id-match map
            Arena.matches.set(id, match);
            
        }

        match.grid.on('match ended', async () =>{
            console.log('MATCH FINITO')
            
        })

        

        return match;
    }

    /**
     * @param {string} name 
     */
    static async deleteMatch (name) {
        if(!Arena.matches.has(name)) return false;
        let match = Arena.matches.get(name);
        await match.destroy();
        Arena.matches.delete(name);
        return true;
    }
    
    

}

module.exports = Arena;