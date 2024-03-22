const Grid = require('./Grid');
const RandomAgentMover = require('../workers/RandomAgentMover');
const ParcelsGenerator = require('../workers/ParcelsGenerator');
const { uid } = require('uid');
const Config = require('./Config');
const { SensorInterface } = require('./InterfaceController');
const Agent = require('./Agent');
const Leaderboard = require('./Leaderboard');
const Timer = require('./Timer');



class Match {

    // enum for the status of the match
    static Status = {
        STOP: 'stop',
        PLAY: 'play',
    };

    /** @type {Config} config */
    config;

     /** @type {String} config */
    #status;
    get status () { return this.#status; }

    /** @type {string} #id */    
    #id;
    get id () { return this.#id; }

    /** @type {Grid} grid */
    grid;

    /** @type {ParcelsGenerator} */
    #parcelsGenerator;

    /** @type {RandomAgentMover[]} */
    #randomAgentMover;

    // /** @type {Map<string,{agent:Agent,sockets:Set<Socket>}>} idToAgentAndSockets */
    // #idToAgentAndSockets = new Map();

    /** @type {Map<string,Set<Agent>} agents in each team */
    #teamsAgents = new Map();

    /** @type {Timer} timer of the match */
    #timer;
    get timer () { return this.#timer; }
    get remainingTime () { return this.#timer.remainingTime; }

    /**
     * @param {Config} config 
     * @param {string} id 
     */
    constructor ( config = new Config(), id = uid(4) )  {

        this.config = config;
        this.#id = id;
        this.#status = Match.Status.PLAY;

        // Create and start the timer of the match
        this.#timer = new Timer(config.MATCH_TIMEOUT);

        // Load map
        let map = require( '../../levels/maps/' + this.config.MAP_FILE + '.json' );
        this.grid = new Grid( this.#id, config, map.map );

        // Parcels generator
        this.#parcelsGenerator = new ParcelsGenerator( this.config, this.grid );
        
        // Randomly moving agents
        this.#randomAgentMover = [];
        for (let i = 0; i < this.config.RANDOMLY_MOVING_AGENTS; i++) {
            let randomlyMoveAgent = new RandomAgentMover( this.config, this.grid );
            this.#randomAgentMover.push( randomlyMoveAgent );
        }

        // listeners to the event of the timer
        this.#timer.on('timer update', (remainingTime) => { 
            console.log(remainingTime) /* print for debug */
            this.grid.emit('timer update',remainingTime);  
        })
        this.#timer.on('timer started', () => { console.log('timer started') /* print for debug */ })
        this.#timer.on('timer stopped', () => { console.log('timer stopped') /* print for debug */ })
        this.#timer.on('timer ended', () => {
            console.log('timer of match ', this.#id +' ended')
            this.#status = Match.Status.STOP
            this.grid.emit('match ended');
            this.destroy();
        })
        
    
        // Connect match to leaderboard
        this.grid.on( 'agent rewarded', (agent, reward) => {
            Leaderboard.addReward( this.#id, agent.teamId, agent.id, agent.teamName, agent.name, reward );
        } );

        this.grid.on( 'agent created', (agent) => {
            Leaderboard.addReward( this.#id, agent.teamId, agent.id, agent.teamName, agent.name, 0 );
        } );

        // // quando il punteggio di un agente cambia solleva l'evento agent info
        // this.#grid.on('agente score', (id, name, team, score) => {
        //     this.emit('agent info', id, name, team, score);
        // });

        // Logs
        console.log( "Started match " + this.#id, "with config:", this.config );

        // this.on('agent info', (id, name, team, score) => {
        //     console.log("Agente ", id + " ", name + " of team:", team + " change score into ", +score)
        // });
        // this.on('team info', (name, score) => {
        //     console.log("Team ", name + " change score into ", +score)
        // });
        
    }

    /**
     * 
     * @returns {Promise} When randomly moving agents get stopped, parcelGenerator stopped and grid destroyed
     */
    async destroy() {
        // Stop randomlyMovingAgents
        let agentsStop = Promise.all(this.#randomAgentMover.map(a => a.stop()));

        // Destroy parcelGenerators
        let clockDestroy = this.#parcelsGenerator.destroy();
    
        // Distruggi il myClock
    
        // Distruggi la griglia
        let gridDestroy = this.grid.destroy();

        return Promise.all( [agentsStop, clockDestroy, gridDestroy] )
    }

    getOrCreateAgent ( userParam = {id, name, teamId, teamName} ) {
        
        // Agent
        //console.log(this.grid.getAgents())
        var me = this.grid.getAgent( userParam.id );
        if ( ! me ){
            me = this.grid.createAgent( userParam );
        }
        
        // Team
        var teamMates = this.#teamsAgents.get( userParam.teamId );
        if ( ! teamMates ) {
            teamMates = new Set();
            this.#teamsAgents.set( userParam.teamId, teamMates );
        }
        if ( ! teamMates.has( me ) ) {
            teamMates.add( me );
        }
        
        // this.#teamsAgents.forEach( (agents,team) => {
        //     let teamScore = Array.from(agents).reduce( (sum,a) => a.sccore );
        //     let listOfAgentsString = Array.from( agents.values() ).map( a => a.name ).join(', ');
        //     console.log(`\t ${team} score: ${teamScore}, agents: ${listOfAgentsString}`);
        // } );

        return me;
    }

    startStop () {
        if (this.#status == Match.Status.PLAY) { this.#status = Match.Status.STOP; this.#timer.stop(); return; }
        if (this.#status == Match.Status.STOP) { this.#status = Match.Status.PLAY; this.#timer.start(); return; }
    }


}


module.exports = Match;
