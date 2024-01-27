const EventEmitter = require('events');

class Team extends EventEmitter{
    name;
    score;
        
    // array degli id degli agenti del teams
    agents = new Array();

    constructor(name){
        super();
        this.name = name;
        this.score = 0;
    }

    addAgent(agent){
        this.agents.push(agent.id);
        agent.on('score', (agent) => { 
            this.score = this.score + agent.score;
            //console.log("Punteggio team ", this.name + " = ", this.score);
            this.emit('team score', this.name, this. score)
        } )
    }

    agentInTeam(agent){
        for(let agentOfTeam of this.agents) {
            console.log("check agenInTeam: ", agentofTeam + " - ", agnet);
            if(agent == agentOfTeam) return true;
        }
        return false
    }

}

module.exports = Team;