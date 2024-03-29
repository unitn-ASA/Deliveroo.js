const Config = require('./Config');
const Match = require('./Match')

class Room {

    /** @type {string} #id */    
    #id;
    static nextId = 0
    get id () { return this.#id; }

    /** @type {string} #gameId */    
    match;
    matches = [] 

    /**
     * @param {Config} config 
     * @param {string} id 
     */
    constructor (config)  {

        this.#id = Room.nextId.toString();
        Room.nextId++;

        this.match = new Match({roomId : this.#id, config : config})
        this.matches.push(this.match.id)

        // Logs
        console.log(`/${this.#id } room created`);
        
    }

   
    async destroy() {

        console.log(`/${this.#id } room destoied`)
        //await this.game.destroy()
        //TODO
    }

    getOrCreateAgent ( userParam = {id, name, teamId, teamName} ) {
        
        // Agent
        //console.log(this.grid.getAgents())
        var me = this.match.grid.getAgent( userParam.id );
        if ( ! me ){
            me = this.match.grid.createAgent( userParam );
        }
    
        return me;
    }

}



module.exports = Room;
