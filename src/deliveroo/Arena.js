const Config = require('./Config');
const Room = require('./Room');

class Arena {

    /**
     * @type {Map<string, Room>}
     */
    static rooms = new Map();

    /** 
     * @param {string} id
     * @returns {Room}
     */
    static getRoom ( id ) {
        return Arena.rooms.get(id);
    }

    /**
     * @param {Config} config
     * @returns {Room}
     */
    static createRoom ( config = new Config() ) {
        
        let room = new Room( config );
        Arena.rooms.set(room.id, room);
        
        return room;
    }

    /**
     * @param {string} id 
     * @returns {Promise<boolean>}
     */
    static async deleteRoom (id) {
        
        let room = Arena.rooms.get(id);

        if ( ! room ) {
            console.log(`Arena.deleteRoom(${id}) room not found`);
            return false;
        } 

        await room.destroy();
        console.log(`Arena.deleteRoom(${id}) room destroyed`);
        return true;
        
    }
    
    

}

module.exports = Arena;