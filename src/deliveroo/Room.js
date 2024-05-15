const Config = require('./Config');
const Grid = require('./Grid');
const Timer = require('./Timer')
const EventEmitter = require('events');
const { resolve } = require('path');
const { rejects } = require('assert');
const RewardModel = require('../models/RewardModel');
const { start } = require('repl');

class Room extends EventEmitter{

    /** @type {string} #id */    
    #id;
    static nextId = 0;
    get id () { return this.#id; };

    /** @type {Config} #config */
    #config;

    /** @type {Grid} */
    #grid;
    get grid () {  return this.#grid; }

    /**
     * @param {Config} config  
     */
    constructor ( config = new Config() ) {

        super()

        this.#id = Room.nextId.toString();
        Room.nextId++;

        this.#config = config;
        
        this.#grid = new Grid({roomId: this.#id, config: config});
        
        // this.startNewMatch( config );

        /**
         * When grid emit 'agent reward', store reward in the database.
         */
        this.grid.on('agent reward', async (agent,sc) => {

            // if ( ! this.#match ) return;
            // if(this.#status == Match.Status.OFF) return false;     // if the match is in off status the reward is not saved
            
            RewardModel.addReward( {
                roomId: this.#id,
                teamId: agent.teamId,
                teamName: agent.teamName,
                agentId: agent.id,
                agentName: agent.name,
                score: sc
            } );        

        });

    }

   
    async destroy () {
        console.log(`/${this.#id } room destroyed`);
        await this.grid.destroy();
        //TODO
    }

    // async stopCurrentMatch () {
    //     if ( this.#match ) {
    //         this.#match.endTime = new Date();
    //         await this.#match.save();
    //         this.emit('match', {
    //             matchId: this.#match._id,
    //             matchTitle: this.#match.matchTitle,
    //             startTime: this.#match.startTime,
    //             endTime: this.#match.endTime,
    //             status: 'end'
    //         });
    //     }
    // }

    // async startNewMatch () {

    //     // stop current one
    //     if ( this.#match ) {
    //         await this.endMatch();
    //     }

    //     // Find match by roomId, where startTime is in the past and endTime is in the future
    //     const now = new Date();
    //     this.#match = MatchModel.findOne( {roomId: this.#id, startTime: { $lt: now }, endTime: { $gt: now } } );
        
    //     // If no active match is found, create a new one
    //     if ( ! this.#match ) {
    //         this.#match = new MatchModel({
    //             matchTitle: now.toISOString(), // 2024-05-06T15:58:58.910Z
    //             roomId: this.#id,
    //             config: this.#config,
    //             startTime: new Date( new Date().getTime() + this.#config.MATCH_COUNTDOWN || 1000*10 ), // default 10 seconds
    //             endTime: new Date( new Date().getTime() + this.#config.MATCH_DURATION || 1000*60*5 ) // default 5 minutes
    //         });
    //     }

    //     this.emit('match', {
    //         matchId: this.#match._id,
    //         matchTitle: this.#match.matchTitle,
    //         startTime: this.#match.startTime,
    //         endTime: this.#match.endTime,
    //         status: now < this.#match.startTime ? 'waiting' : now < this.#match.endTime ? 'on' : 'end'
    //     });

    //     // // Set the score for all agents
    //     // for ( let agent of this.grid.getAgents().values() ) {
    //     //     let loadedScore = await Leaderboard.loadScore( agent.id );
    //     //     if (loadedScore !== false) {
    //     //         agent.score = loadedScore;         // overide the actual score with the score in the match
    //     //         console.log(`/${this.id}/${agent.name}-${agent.teamName}-${agent.id} loaded score `, agent.score );
    //     //     } else {
    //     //         console.log(`/${this.id}/${agent.name}-${agent.teamName}-${agent.id} unable to load a pass score ` );
    //     //         agent.score = 0;                                // overide the actual score with the score in the match: 0
    //     //         agent.emitOnePerTick( 'rewarded', agent, 0 );   // emit a reward to 0 to init the agent in the database
    //     //     }
    //     // }

    // }

    async changeGrid ( newConfig ) {
        console.log(`/${this.#id } changeGrid with ${newConfig}`);
        
        // destroy the grid
        await this.grid.destroy();
        
        this.#grid = new Grid({roomId: this.#id, config : newConfig})

        this.emit('changed grid');
    }

    /**
     * Create an agent in the grid if it doesn't exist
     * @param {{id:string, name:string, teamId:string, teamName:string}} param
     * @returns 
     */
    getOrCreateAgent ( param ) {
        
        var me = this.grid.getAgent( param.id );
        if ( ! me ) {
            me = this.grid.createAgent( param );
        }

        // // if match startTime is in the past && endTime is in the future, load score from the database
        // if ( this.#match && this.#match.startTime < new Date() && this.#match.endTime > new Date() ) {
            
        //     let queried = await Leaderboard.get( { matchId: this.#match._id, agentId: agentId }, ['agentId'] );
        //     if ( queried.length > 0 && queried[0] ) {
        //         let loadedScore = queried[0].score;
        //         me.score = loadedScore;
        //         console.log(`/${this.#id}/${me.name}-${me.teamName}-${me.id} agent created with loaded score`, me.score );
        //     } else {
        //         console.log(`/${this.#id}/${me.name}-${me.teamName}-${me.id} agent created with no previous score` );
        //     }

        // }
        
        return me;
    }

}



module.exports = Room;
