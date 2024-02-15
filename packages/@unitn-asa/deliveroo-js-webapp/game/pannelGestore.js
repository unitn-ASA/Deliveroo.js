let leaderboard = {

    //key: nome team, value: array degli agenti(id,nome e score) 
    teamsAndMembers: new Map(),
    
    addTeam: function(team, score, leaderboardElement, color) {

        // Crea un nuovo elemento div per rappresentare il team
        let teamElement = document.createElement('div');
        teamElement.classList.add('team');          // Aggiungi la classe "team" al nuovo elemento div
        teamElement.id = "team_" + team;

        let teamInfoElement = document.createElement('div');
        teamInfoElement.classList.add('teamInfo');          // Aggiungi la classe "team" al nuovo elemento div

        // Crea un elemento span per il nome del team
        let nametypeElement = document.createElement('div');
        nametypeElement.classList.add('name_type');  

        let nameElement = document.createElement('span');
        nameElement.classList.add('name');          // Aggiungi la classe "name" al nome del team
        nameElement.textContent = team;             // Imposta il testo del nome del team
        nametypeElement.appendChild(nameElement);   // Aggiungi l'elemento al div del name-type team

        let typeElement = document.createElement('span');
        typeElement.classList.add('type');          // Aggiungi la classe "type" 
        typeElement.textContent = 'team';           // Imposta il testo
        nametypeElement.appendChild(typeElement);   // Aggiungi l'elemento al div del name-type team


        // Crea un elemento span per il punteggio del team
        let scoreElement = document.createElement('span');
        scoreElement.classList.add('score');        // Aggiungi la classe "score" al punteggio del team
        scoreElement.textContent = score;           // Imposta il testo del punteggio del team

        teamInfoElement.appendChild(nametypeElement);   // Aggiungi l'elemento del nome e tipo del team al div del team
        teamInfoElement.appendChild(scoreElement);      // Aggiungi l'elemento del punteggio del team al div del team
        
        var colorString;

        if(color){
            colorString = `rgb(${color.r * 255}, ${color.g * 255}, ${color.b * 255})`;
            teamInfoElement.style.backgroundColor = colorString;
            teamElement.style.backgroundColor = colorString;
        }

        teamElement.appendChild(teamInfoElement);

        var open = false;
        var agents = document.createElement('div')
        let self = this;

        teamElement.addEventListener('click', function() {
            if(open){
                agents.remove();
                open=false;
            }else{
                agents = showAgentsOfTeam(self.teamsAndMembers.get(team))
                teamElement.appendChild(agents);
                open=true;
            }
        });
        

        // Aggiungi il div del team al leaderboard
        leaderboardElement.appendChild(teamElement);
        
    },

    updateTeam: function(team, score, leaderboardElement, color) {
        // Ottieni il riferimento all'elemento del team dal leaderboard
        let teamElement = leaderboardElement.querySelector(`#team_${team}`);

        // Se il team non è presente nel leaderboard, aggiungilo
        if (!teamElement) {
            console.log(`Il team ${team} non è presente nel leaderboard.`);
            this.addTeam(team, score, leaderboardElement, color);
            return;
        }

        let scoreElement = teamElement.querySelector('.score');     // Trova l'elemento del punteggio del team
        scoreElement.textContent = score;                           // Aggiorna il punteggio del team con il nuovo punteggio
    },  

    addAgent: function(id, name, team, score, leaderboardElement, color) {

        // Crea un nuovo elemento div per rappresentare l'agente
        let agentElement = document.createElement('div');
        agentElement.classList.add('agent');          // Aggiungi la classe "agent" al nuovo elemento div
        agentElement.id = "agent_" + id;

        // Crea un elemento span per il nome del team
        let nametypeElement = document.createElement('div');
        nametypeElement.classList.add('name_type');  

        let nameElement = document.createElement('span');
        nameElement.classList.add('name');          // Aggiungi la classe "name" al nome dell'agent
        nameElement.textContent = name;             // Imposta il testo del nome dell'agent
        nametypeElement.appendChild(nameElement);   // Aggiungi l'elemento al div del name-type agent

        let typeElement = document.createElement('span');
        typeElement.classList.add('type');          // Aggiungi la classe "type" 
        typeElement.textContent = id;               // Imposta il testo
        nametypeElement.appendChild(typeElement);   // Aggiungi l'elemento al div del name-type agent


        // Crea un elemento span per il punteggio del team
        let scoreElement = document.createElement('span');
        scoreElement.classList.add('score');        // Aggiungi la classe "score" al punteggio del agent
        scoreElement.textContent = score;           // Imposta il testo del punteggio del agent

        agentElement.appendChild(nametypeElement);   // Aggiungi l'elemento del nome e tipo del agent al div del agent
        agentElement.appendChild(scoreElement);      // Aggiungi l'elemento del punteggio del agent al div del agent

        if(color){
            let colorString = `rgb(${color.r * 255}, ${color.g * 255}, ${color.b * 255})`;
            agentElement.style.backgroundColor = colorString;
        }
        
        // Aggiungi il div del team al leaderboard
        leaderboardElement.appendChild(agentElement);
    },

    updateAgent: function(id, name, team, score, leaderboardElement, color) {
        // Ottieni il riferimento all'elemento del team dal leaderboard
        // console.log(`L'agent ${id}, ${name}, ${team}, ${score}  .`);

        if(!team){
            let agentElement = leaderboardElement.querySelector(`#agent_${id}`);
           
            if (!agentElement) {                                        // Se il team non è presente nel leaderboard, aggiungilo
                console.log(`L'agent ${name} non è presente nel leaderboard.`);
                this.addAgent(id, name, team, score, leaderboardElement, color);
                return;
            }

            let scoreElement = agentElement.querySelector('.score');    // Trova l'elemento del punteggio del team
            scoreElement.textContent = score;                           // Aggiorna il punteggio del team con il nuovo punteggio

        }else{

            if(this.teamsAndMembers.has(team)){
                const teamMembers = this.teamsAndMembers.get(team);     // Ottengo l'array dei membri del team e controllo se contiene gia l'agente
                const existingMember = teamMembers.find(member => member.id === id && member.name === name);

                if (existingMember) {
                    // L'array teamMembers contiene già un oggetto con lo stesso id, nome e punteggio
                    console.log("Questo agente esiste già nell'array teamMembers.");
                    existingMember.score = score;
                    let teamElement = leaderboardElement.querySelector(`#team_${team}`);
                    const clickEvent = new Event('click');
                    teamElement.dispatchEvent(clickEvent);
                    teamElement.dispatchEvent(clickEvent);
                } else {
                    // Se non c'è aggiungo il nuovo membro all'array
                    console.log("Questo agente non esiste nell'array teamMembers.");
                    teamMembers.push({ id, name, score });  
                }
                
            } else {
                // Se il team non esiste nella mappa, crea un nuovo array con il nuovo membro
                this.teamsAndMembers.set(team, [{ id, name, score }]);
            }
        }
        
    },

    removeAgent: function(id, team, leaderboardElement) {
        if(!team){
            let agentElement = leaderboardElement.querySelector(`#agent_${id}`);
            if (agentElement) {
                agentElement.remove();
            }
        }else{
            // Se il team è specificato, controlla se l'agente è un membro del team e rimuovilo
            let teamMembers = this.teamsAndMembers.get(team);
            let teamElement = leaderboardElement.querySelector(`#team_${team}`);
            if (teamMembers) {
                const index = teamMembers.findIndex(member => member.id === id);
                if (index !== -1) {
                    teamMembers.splice(index, 1);       // Rimuovi l'agente dal teamMembers
                    // Rimuovi l'elemento HTML corrispondente dall'interfaccia utente
                    let agentElement = teamElement.querySelector(`#agentInTeam_${id}`);
                    if (agentElement) {
                        agentElement.remove();
                    }
                }
            }
            const clickEvent = new Event('click');
            teamElement.dispatchEvent(clickEvent);
            teamElement.dispatchEvent(clickEvent);
        }
    },

    removeTeam: function(team, leaderboardElement){
        let teamElement = leaderboardElement.querySelector(`#team_${team}`);
        if (teamElement) {
            teamElement.remove()
        }
    }

    
};


function showAgentsOfTeam(agents){
    var agentsList = document.createElement('div');
    agentsList.classList.add('agentsList');

    for (let agent of agents) {
        addAgentInTeam(agent.id, agent.name, agent.team, agent.score, agentsList);
    }

    return agentsList;

}


function addAgentInTeam(id, name, team, score, list) {

    // Crea un nuovo elemento div per rappresentare l'agente
    let agentElement = document.createElement('div');
    agentElement.classList.add('agentInTeam');          // Aggiungi la classe "agent" al nuovo elemento div
    agentElement.id = "agentInTeam_" + id;

    // Crea un elemento span per il nome del team
    let nametypeElement = document.createElement('div');
    nametypeElement.classList.add('name_type');  

    let nameElement = document.createElement('span');
    nameElement.classList.add('name');          // Aggiungi la classe "name" al nome dell'agent
    nameElement.textContent = name;             // Imposta il testo del nome dell'agent
    nametypeElement.appendChild(nameElement);   // Aggiungi l'elemento al div del name-type agent

    let typeElement = document.createElement('span');
    typeElement.classList.add('type');          // Aggiungi la classe "type" 
    typeElement.textContent = id;               // Imposta il testo
    nametypeElement.appendChild(typeElement);   // Aggiungi l'elemento al div del name-type agent


    // Crea un elemento span per il punteggio del team
    let scoreElement = document.createElement('span');
    scoreElement.classList.add('score');        // Aggiungi la classe "score" al punteggio del agent
    scoreElement.textContent = score;           // Imposta il testo del punteggio del agent

    agentElement.appendChild(nametypeElement);   // Aggiungi l'elemento del nome e tipo del agent al div del agent
    agentElement.appendChild(scoreElement);      // Aggiungi l'elemento del punteggio del agent al div del agent

    // Aggiungi il div del team al leaderboard
    list.appendChild(agentElement);
}


export { leaderboard };



