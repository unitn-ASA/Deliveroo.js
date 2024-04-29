const { uid } = require('uid');
const Leaderboard = require('./Leaderboard')
const EventEmitter = require('events');

// enum for the status of the match
const MatchStatus = {
    ON: 'on',
    OFF: 'off',
};

class Match extends EventEmitter{

    /** @type {MatchStatus} status */
    #status;        //define if the match is on of off
    get status () {  return this.#status; }

    /** @type {string} #roomId */ 
    #roomId 
    get roomId () { return this.#roomId; }

    /** @type {string} #matchId */    
    #id;
    get id () { return this.#id; }

    /** @type {string} #grid */ 
    #grid

    /**
     * @param {Config} config 
     * @param {string} id 
     */
    constructor ( room )  {

        super()

        this.#roomId = room.id
        this.#grid = room.grid
        
        this.#id = uid(4)

        this.#status = MatchStatus.OFF

        console.log(`\t- match /${this.#id } created:`);       
    }

    // put the match in on, when it happen notice it with an event that will be menage from the room 
    liveOn() { if(this.#status != MatchStatus.ON)  { this.#status = MatchStatus.ON; this.emit('match on');   console.log('/'+this.#roomId+ ' match', this.#id + ' started')}}  
    liveOff(){ if(this.#status != MatchStatus.OFF) { this.#status = MatchStatus.OFF; this.emit('match off'); console.log('/'+this.#roomId+ ' match', this.#id + ' stopped')}}

    // method to save the score in the database
    async reward(agent,sc){
        if(this.#status == MatchStatus.OFF) return false;     // if the match is in off status the reward is not saved 
        //console.log('REWARD') console.log(this.listenerCount('agent rewarded'))
        await Leaderboard.addReward( this.#roomId, this.#id, agent.teamId, agent.teamName, agent.id, agent.name, sc );
        return true
    }

    // method to load the score of all the agents passed
    async loadScoreAgents(agents){
        
        for(let agent of agents){                      // for each agent try to load a pass score from the database
            let loadedScore = await this.loadScore( agent.id )
            if(loadedScore !== false){
                agent.score = loadedScore;         // overide the actual score with the score in the match
                console.log(`/${this.#roomId}/${agent.name}-${agent.teamName}-${agent.id} loaded score `, agent.score );
            }else{
                console.log(`/${this.#roomId}/${agent.name}-${agent.teamName}-${agent.id} unable to load a pass score ` );
                agent.score = 0;                                // overide the actual score with the score in the match: 0
                agent.emitOnePerTick( 'rewarded', agent, 0 );   // emit a reward to 0 to init the agent in the database
            }
        }
    }

    // method to load the score of a singular agent in the match 
    async loadScore(agentId){
        try {
            let record = await Leaderboard.get({ matchId:this.#id, agentId:agentId });
            let score = record[0].score
            return score
        } catch (error) {
            return false;
        }   
    }

    async change(){
        this.#status = MatchStatus.OFF // Put the status in off, it cause the stop of the saving of reward
        this.#id = uid(4)              // Change the id for similate a new match
    }

    async destroy() {
        this.removeAllListeners();     // Remove all listeners
    }
}






module.exports = Match; 
