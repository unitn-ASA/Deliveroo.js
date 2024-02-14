const EventEmitter = require('events');

class Team extends EventEmitter{
    name;
    score;
        
    // array degli id degli agenti del teams
    agents = new Map();

    constructor(name){
        super();
        this.name = name;
        this.score = 0;
    }

    refreshScoreTeam(){
        let newScore = 0;
        this.agents.forEach((score, id) => { newScore += score });
        this.score = newScore;
    }

    addAgent(agent){
        this.agents.set(agent.id, agent.score);
        agent.on('score', (agent) => { 
            this.agents.set(agent.id, agent.score);     // aggiorno lo score dell'agente 
            this.refreshScoreTeam();                    // aggiorno lo score del team
            //console.log("Punteggio team ", this.name + " = ", this.score);
            this.emit('team score', this.name, this.score)
        } )
    }

    agentInTeam(agentId){
        return !(this.agents.has(agentId));
    }

}

module.exports = Team;