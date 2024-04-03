const Grid = require('./Grid');
const RandomlyMoveAgent = require('../workers/randomlyMovingAgent');
const parcelsGenerator = require('../workers/parcelsGenerator');
const { uid } = require('uid');
const Config = require('./Config');
const Timer = require('./Timer');

// enum for the status of the match
const MatchStatus = {
    STOP: 'stop',
    PLAY: 'play',
    END: 'end'
};

class Match {

    /** @type {Config} config */
    config;

    /** @type {MatchStatus} config */
    #status;
    get status () {  return this.#status; }
    set status (newStatus) {  this.#status = newStatus; }

    /** @type {string} #roomId */ 
    #roomId 
    get roomId () { return this.#roomId; }

    /** @type {string} #match */    
    #id;
    get id () { return this.#id; }

    /** @type {Grid} grid */
    grid;

    /** @type {parcelsGenerator} */
    #parcelsGenerator;

    /** @type {randomlyMovingAgent[]} */
    #randomlyMovingAgents;

    // /** @type {Map<string,{agent:Agent,sockets:Set<Socket>}>} idToAgentAndSockets */
    // #idToAgentAndSockets = new Map();

    /** @type {Timer} timer of the match */
    #timer;
    get timer () { return this.#timer; }

    /**
     * @param {Config} config 
     * @param {string} id 
     */
    constructor ( {roomId, config = new Config()} )  {

        this.config = config;

        this.#roomId = roomId
        this.#id = uid(4)

        this.#status = MatchStatus.STOP

        // Create and start the timer of the match
        this.#timer = new Timer(config.MATCH_TIMEOUT);

        // Load map
        let map = require( '../../levels/maps/' + this.config.MAP_FILE + '.json' );
        this.grid = new Grid( this.#roomId, this.#id, config, map.map );

        // Parcels generator
        this.#parcelsGenerator = new parcelsGenerator( this.config, this.grid );
        
        // Randomly moving agents
        this.#randomlyMovingAgents = [];
        for (let i = 0; i < this.config.RANDOMLY_MOVING_AGENTS; i++) {
            let randomlyMoveAgent = new RandomlyMoveAgent( this.config, this.grid );
            this.#randomlyMovingAgents.push( randomlyMoveAgent );
        }

        // listeners to the event of the timer
        this.#timer.on('timer update', (remainingTime) => { 
            //console.log(remainingTime) /* print for debug */
            this.grid.emit('timer update',remainingTime);  
        })
        this.#timer.on('timer started', async () => {  
            console.log(`/${this.#roomId }/${this.#id } timer started`)  /* print for debug */ 
            await Promise.all(this.#randomlyMovingAgents.map(a => a.start()));  //stop all the autonomous agent
        })
        this.#timer.on('timer stopped', async () => { 
            console.log(`/${this.#roomId }/${this.#id } timer stopped`)   /* print for debug */ 
            await Promise.all(this.#randomlyMovingAgents.map(a => a.stop())); //stop all the autonomous agent
        })
        this.#timer.on('timer ended', async () => {
            console.log(`/${this.#roomId }/${this.#id } timer ended`)
            await this.destroy()
        })
        
        console.log(`/${this.#roomId }/${this.#id } match created`);        
    }

   
    async destroy() {

        if(this.#status == MatchStatus.END){ console.log("\tMatch alredy ended"); return } // check if the match is already ended 
        this.grid.emit('match ended', this.#id);    //emit the end of the match

        try{
            // stop and destroy the timer
            this.#status = MatchStatus.END
            await this.#timer.stop()
            this.#timer.destroy()
            
            // Stoppa the motion of the agent
            await Promise.all(this.#randomlyMovingAgents.map(a => a.stop()));
    
            // Destroy the generator of parcels
            await this.#parcelsGenerator.destroy();
    
            // Destroy the grid
            await this.grid.destroy();

        }catch(error){
            console.log("\tError match destroy")
        }
        
    
    }

    startStopGame(){
        if(this.#status == MatchStatus.PLAY){ this.#status = MatchStatus.STOP; this.#timer.stop();  return; }
        if(this.#status == MatchStatus.STOP){ this.#status = MatchStatus.PLAY; this.#timer.start(); return; }
    }

}

module.exports = Match; 
