const Config = require('./Config');
const Room = require('./Room');

class Arena {

    /**
     * @type {Map<string, Match>}
     */
    static rooms = new Map();

    /** 
     * @param {string} name
     * @returns {Match}
     */
    static getRoom ( id ) {
        if(Arena.rooms.has(id)){ return Arena.rooms.get(id);}
        return false
    }

    /**
     * @param {{name:string, config:Config}} options
     * @returns 
     */
    static createRoom (config = new Config()) {
        
        //console.log('NEW MATCH ', id)
        let room = new Room(config);        // Create a new Match and add it to the id-match map
        Arena.rooms.set(room.id, room);
        
        return room;
    }

    /**
     * @param {string} name 
     */
    static async deleteRoom (id) {
        let room = Arena.rooms.get(id);

        if(!room){
            console.log(`/${id}: not find in the rooms`)
            return false;
        } 

        try { await room.destroy(); console.log(`/${id} room destroied`)} 
        catch (error) { console.error('An error occurred while destroying the room:', error); }
        
        return true;
    }
    
    

}

module.exports = Arena;