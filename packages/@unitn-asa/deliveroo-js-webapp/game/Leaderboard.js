class Leaderboard {

    //key: id team, value: score 
    teams = new Map();
    //key: id agent, value: score 
    agents = new Map();
    //key: nome team, value: array degli agenti(id,nome e score) 
    teamsAndMembers = new Map();


    constructor(game, matchId){
        
        console.log('INIT LEADERBOARD');
        let leaderboard = document.getElementById("leaderboard");       // Find the leaderboard div
        if(!leaderboard) console.log('Div Leaderboard not find')
       
        this.init(game, matchId, leaderboard);
     
    }

    // The definition and use of the function init is becouse the constructor can not define as async
    async init(game, matchId, leaderboard){

        // request all the information of the match score to the server
        // start with the request of all the teams:
        console.log('teams: ')
        await fetch('/api/leaderboard', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'matchid': matchId,
                'teamId': '',
                'aggregateby': 'true'

            }
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error(`Error, Status code: ${response.status}`);
        })
        .then(data => {
            console.log(data)
            data.forEach(element => {
                this.teamsAndMembers.set(element.teamId, []);       // add a record for the team where it id is associeted with a empty array 
                if(element.teamId != ''){
                    console.log("ADING TEAM element.teamId", element.teamId)
                    this.teams.set(element.teamId, element.score);
                    // If the team have no yet assosieted a color, it associete one and save it in the game.teamsAndColors map.
                    if(!game.teamsAndColors.get(element.teamId)){ game.newColor(element.teamId) }
                    // Then we add the div of the team in the leaderboard 
                    this.addTeam(element.teamId, element.score, leaderboard, game.teamsAndColors.get(element.teamId) )

                }
            });
        })
        .catch(error => {
            console.error('An error occurred:', error);
        });
        console.log( this.teamsAndMembers)

        // Now for each team we request the agent members
        console.log('TeamAndMembers')
        for (let team of this.teamsAndMembers.keys()) {
        
            if(team == '' ){
                console.log('team VUOTO')
                continue;
            }

            await fetch('/api/leaderboard', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'matchid': matchId,
                    'teamId': team,  
                    'aggregateby': false
                }
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error(`Error, Status code: ${response.status}`);
            })
            .then(data => {
                data.forEach(element => {
                    console.log(element)
                    this.agents.set(element.agentId, {name: element.agentName, score: element.score});
 
                    if(element.teamId != ''){
                        this.teamsAndMembers.get(element.teamId).push(element.agentId)
                    }
                     

                });
                
            })
            .catch(error => {
                console.error('An error occurred:', error);
            });
      
        }
        console.log( this.teamsAndMembers)
        console.log( this.agents)
        
    }

    addTeam (team, score, leaderboardElement, color) {

        let teamElement = document.createElement('div');    // create a new div for the team
        teamElement.classList.add('team');                  // Add the class "team" to the new div
        teamElement.id = "team_" + team;                    // Add the id "tea;_name" to the new div
    
        let teamInfoElement = document.createElement('div');    // create a new div for the info of the team: name, type and score
        teamInfoElement.classList.add('teamInfo');              // Aggiungi la classe "team" al nuovo elemento div
    
        let nametypeElement = document.createElement('div');    // create a new div for the name and type of the team
        nametypeElement.classList.add('name_type');  
    
        let nameElement = document.createElement('span');       // create a new span for the name of the team
        nameElement.classList.add('name');                      // add the class "name" 
        nameElement.textContent = team;                         // set the name of the team
        nametypeElement.appendChild(nameElement);              
    
        let typeElement = document.createElement('span');   // create a new span for the type of the team
        typeElement.classList.add('type');                  // add the class "type"     
        typeElement.textContent = 'team';                   // set the type of the team
        nametypeElement.appendChild(typeElement);   
    
        let scoreElement = document.createElement('span');  // create a span for the score
        scoreElement.classList.add('score');                // add the class "score" 
        scoreElement.textContent = score;                   // set the score
    
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
    
        teamElement.addEventListener('click', () => {
            if(open){
                agents.remove();
                open=false;
            }else{
                console.log(this.teamsAndMembers.get(team));
                agents = this.showAgentsOfTeam(self.teamsAndMembers.get(team))
                teamElement.appendChild(agents);
                open=true;
            }
        });
        
    
        // Aggiungi il div del team al leaderboard
        leaderboardElement.appendChild(teamElement);
        
    }


    showAgentsOfTeam(agents){
        var agentsList = document.createElement('div');
        agentsList.classList.add('agentsList');

        console.log(this.agents)
        
        for (let agentId of agents) {
            let agent = this.agents.get(agentId)
            addAgentInTeam(agentId, agent.name, agent.score, agentsList);
        }
    
        return agentsList;
    
    }


    findTeamNameById(id){
        for (let [teamName, agents] of this.teamsAndMembers) {
            console.log('team name: ', teamName)
            console.log('agents: ', agents)
            for (let agent of agents) {
                console.log('chack: ', agent + " with ", id)
                if (agent == id) {
                    return teamName;
                }
            }
        }
        // Se non trovi corrispondenze, ritorna null o gestisci il caso in cui non viene trovato l'ID
        return null;
    }
    
    
};


function updateTeam (team, score, leaderboardElement, color) {
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
}

function addAgent (id, name, team, score, leaderboardElement, color) {

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
}

function updateAgent (id, name, team, score, leaderboardElement, color) {
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
    
}

function removeAgent (id, team, leaderboardElement) {
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
    }
}

function removeTeam (team, leaderboardElement){
    let teamElement = leaderboardElement.querySelector(`#team_${team}`);
    if (teamElement) {
        teamElement.remove()
    }
}



function addAgentInTeam(id, name, score, list) {

    //console.log("NEW AGENT: ", id, name, score, list)

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





export { Leaderboard };



