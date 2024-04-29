const Config = require('./Config');
const Match = require('./Match');
const Grid = require('./Grid');
const Timer = require('./Timer')
const EventEmitter = require('events');
const { resolve } = require('path');
const { rejects } = require('assert');

class Room extends EventEmitter{

    /** @type {string} #id */    
    #id;
    static nextId = 0
    get id () { return this.#id; }

    match;          // The active match in the room, it can be on ( the score are saved ) or off ( the score are not saved ). 
                    // It menage all the asppect of comunication with the database 

    grid;           // the grid of the match, it can be freeze or unfreeze this define if the agent can move in the grid

    timer           // the timer of the room, the timer mengae 

    waitConnection  //flag to stop the connection for some moment, for example when it change the grid

    /**
     * @param {Config} config  
     */
    constructor (config = new Config())  {

        super()

        this.#id = Room.nextId.toString();
        Room.nextId++;
        console.log(`/${this.#id } room creation:`);

        // The use of a Promise is that the costruction of Match need that the grid is already created 
        new Promise((resolve, rejects) => {
            this.grid = new Grid({roomId: this.#id, config : config})
            this.timer = new Timer()
            this.waitConnection = false;
            resolve()
        }).then(() => { this.match = new Match(this)
        }).then(() => { console.log('\n'); 
        
        // MENAGE THE EVENT OF THE TIMER 
        this.timer.on('timer update', (remainingTime) => { 
            this.emit('timer update',remainingTime); 
        })

        this.timer.on('timer started', async () => {  
            console.log(`/${this.#id } timer started: `, this.timer.time)   
            this.match.liveOn()     // start the match putting in on 
        })

        this.timer.on('timer stopped', async () => { 
            console.log(`/${this.#id } timer stopped`)   
            this.match.liveOff()    // stop the match putting in off 
        })

        this.timer.on('timer ended', async () => {
            console.log(`/${this.#id } timer ended`)
            await this.match.liveOff()        // stop the match putting in off 
            this.emit('timer ended')
        })


        //MENAGE THE EVENT COMING FROM THE GRID
        /* when the grid emit that an agent scores the room call the reward method of the match to save it in the database, if the method 
        save the score (return true ) the room emit the vent agent reward to inform the auser an allow to update the Leaderboard. */
        this.grid.on('agent reward', async (agent,sc) => {
            let flag = await this.match.reward(agent,sc)
            if(flag) this.emit('agent rewarded', agent)
        })
        // notify the change of the status of the grid
        this.grid.on('update', (state) => {
            this.emit('update grid', state)
        })


        //MENAGE THE EVENT COMING FROM THE MATCH
        /*When the match is put on we have to load the pass score of the agents on the grid in the active match*/
        this.match.on('match on', async() => {
            let agents = await this.grid.getAgents()                // take the list of agent for the grid
            await this.match.loadScoreAgents(agents)                // use the method of the match to update them scores
            //for(let agent of this.grid.getAgents()){console.log('Agent: ', agent.name + ' score:', agent.score)}
            this.emit('match on')
        })})
    }

   
    async destroy() {
        console.log(`/${this.#id } room destoied`)
        await this.grid.destroy()
        await this.timer.destroy()
        await this.match.destroy()
        //TODO
    }

    async changeGrid(newConfig){
        console.log(`/${this.#id } change grid`)
        this.waitConnection = true;         // stop the connection during the change of the grid
        await this.grid.destroy();          // destroy the grid
        //console.log('old grid destroied', this.grid)

        this.grid = new Grid({roomId: this.#id, config : newConfig})
        await this.grid.freeze()    //when the grid is changed the new one start freezed

        // ridefine the listener of the grid
        this.grid.on('agent reward', async (agent,sc) => {
            let flag = await this.match.reward(agent,sc)
            if(flag) this.emit('agent rewarded', agent)
        })
        // notify the change of the status of the grid
        this.grid.on('update', (state) => {
            this.emit('update grid', state)
        })

        this.waitConnection = await false;  // reopen the connection 
        this.emit('changed grid');
        if(this.match.status == 'on') this.match.loadScoreAgents(this.grid.getAgents())
    }

    // menage the creation of a new agent in the room when a socket connect
    getOrCreateAgent ( userParam = {id, name, teamId, teamName} ) {
        
        //chack if the grid has an agent for the requested parameters, if not it create one 
        var me = this.grid.getAgent( userParam.id );
        if ( ! me ){
            me = this.grid.createAgent( userParam );
        }

        //then if the match is in on we have to try to load it pass score from the database 
        if(this.match.status == 'on'){
            this.match.loadScore(me.id)
            .then(loadedScore => {
                if(loadedScore !== false){
                    me.score = loadedScore;
                    console.log(`/${this.#id}/${me.name}-${me.teamName}-${me.id} loaded score `, me.score );
                }else{
                    console.log(`/${this.#id}/${me.name}-${me.teamName}-${me.id} unable to load a pass score ` );
                    me.emitOnePerTick( 'rewarded', me, 0 );   // emit a reward to 0 to init the agent in the database
                }
            })
            .catch(error => {
                console.error(`/${this.#id}/${me.name}-${me.teamName}-${me.id} error in loading the score`, error);
            });
        }
        
        return me;
    }

}



module.exports = Room;
