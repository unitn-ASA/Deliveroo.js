const EventEmitter = require('events');

class Team extends EventEmitter{
    name;
    score;
    static #lastId = 0;
        
    // array degli id degli agenti del teams: key-> id, value-> score
    agents = new Map();

    constructor(id, name) {
        super();
        this.id = id || ('t' + Team.#lastId++);
        this.name = name || this.id;
        this.score = 0;
    }

    refreshScoreTeam() {
        let newScore = 0;
        this.agents.forEach((score, id) => { newScore += score });
        this.score = newScore;
    }

    addAgent(agent) {
        this.agents.set(agent.id, agent.score);
        agent.on('score', (agent) => { 
            this.agents.set(agent.id, agent.score);     // aggiorno lo score dell'agente 
            this.refreshScoreTeam();                    // aggiorno lo score del team
            //console.log("Punteggio team ", this.name + " = ", this.score);
            this.emit('team score', this.name, this.score)
        } )
    }

    removeAgent(agent) {
        // console.log("Agent in team: ", this.agents)
        if(this.agents.has(agent)){
            this.agents.delete(agent);
            if (this.agents.size === 0){
                this.emit("delete team", this.name);
            }else{
                this.refreshScoreTeam()
                this.emit('team score', this.name, this.score)
            }
        } 
    }

    agentInTeam(agentId) {
        return !(this.agents.has(agentId));
    }

}

module.exports = Team;