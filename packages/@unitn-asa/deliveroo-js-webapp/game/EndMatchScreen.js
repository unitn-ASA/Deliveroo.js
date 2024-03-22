import * as THREE from 'three';
let params = new URLSearchParams(window.location.search);

//key: nome team or alone agent, value: score
let records = new Map();
let recordsAndColors = new Map();
let teamsAndMembers = new Map();


new Promise((resolve, reject) => {
    console.log('EndMatchScreen')
    if (!params.has('match')) {
        params.append('match', '0');
    }
    resolve()
})
.then(()=>{
    let matchId = params.get("match")

    // request the status of the match to the server
    fetch(`/api/matchs/${matchId}/status`, {
        method: 'GET',
        headers: {
        'Content-Type': 'application/json',
        },
    })
    .then(response => {
        if (response.ok) { return response.json(); 
        } else { throw new Error('Error during data sending'); }
    })
    .then(async data => {
        console.log('Match Status: ', data.status)
        if(data.status != 'end'){ return }

        document.body.innerHTML = '';   // Empties the body of the HTML document
        document.body.style.backgroundColor = 'black'
        document.body.style.display = 'flex'
        document.body.style.alignItems = 'center';
        document.body.style.justifyContent = 'center'; 

        const button = document.createElement('button');
        button.className = 'home-button-end-match';
        button.id = 'home-button';
        const icon = document.createElement('i');
        icon.className = 'fas fa-home';
        button.appendChild(icon);
        document.body.appendChild(button);

        button.addEventListener('click', function() {
            var url = '/home';
            window.location.href = url; 
        });
        
        // Create a div for the leaderbord
        const leaderboardDiv = document.createElement('div');
        leaderboardDiv.id = 'leaderbord-end-match'
        leaderboardDiv.style.color = 'white';
        leaderboardDiv.style.textAlign = 'center';
        leaderboardDiv.innerHTML = '<h1>Leaderboard</h1>'; // Contenuto del leaderboard

        console.log('Request all team of the match')
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
            console.log('leaderboard: Teams in the match: ')
            console.log(data)
            data.forEach(element => {
                if(element.teamName !== 'no-team'){
                    console.log("leaderboard: Adding team ", element.teamName, ' id ', element.teamId);
                    records.set(element.teamId, {recordName: element.teamName, recordScore: element.score}) 
                    teamsAndMembers.set(element.teamId, []);                                 
                }else{
                    console.log("leaderboard: Adding agent " + element.agentId + " without a team")
                    records.set(element.agentId, {recordName: element.agentName, recordScore: element.score})     
                }
            });

            records = sortRecordsByScore(records);
            records.keys().forEach((key) => {
                if(teamsAndMembers.has(key)){ addTeam(key, records.get(key).recordName, records.get(key).recordScore, leaderboardDiv) }
                else{addAgent(key, records.get(key).recordName, records.get(key).recordScore, leaderboardDiv) }
            });

            // Aggiungi il div al body del documento
            document.body.appendChild(leaderboardDiv);
        })
        .catch(error => {
            console.error('An error occurred:', error);
        });

        // Now for each team we request the agent members
        for (let team of teamsAndMembers.keys()) {
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
                if (response.ok) { return response.json(); }
                throw new Error(`Error, Status code: ${response.status}`);
            })
            .then(data => {
                console.log(`leaderborad/${team}: Request to database it's memebers: `)
                //console.log(data)
                data.forEach(element => { 
                    if(!teamsAndMembers.get(element.teamId).find(member => member.id === element.agentId )){
                        teamsAndMembers.get(element.teamId).push({id: element.agentId, name: element.agentName, score: element.score})
                    }else{
                        console.log("This agent", element.agentId  +"already exists in teamMembers list.");
                    }     
                });     
            })
            .catch(error => {
                console.error('An error occurred:', error);
            });
        }

    })
    .catch(error => {
        console.error('An error occurred:', error.message);
    });

})

async function addTeam (teamId, teamName, score, leaderboardDiv) {

    // If the team have no yet assosieted a color, it associete one and save it in the game.teamsAndColors map.
    if(!recordsAndColors.get(teamId)){ await newColor(teamId) }
    let color = recordsAndColors.get(teamId)

    let teamElement = document.createElement('div');    // create a new div for the team
    teamElement.classList.add('team');                  // Add the class "team" to the new div
    teamElement.id = "team_" + teamId;                    // Add the id "tea;_name" to the new div

    let teamInfoElement = document.createElement('div');    // create a new div for the info of the team: name, type and score
    teamInfoElement.classList.add('teamInfo');              // Aggiungi la classe "team" al nuovo elemento div

    let nametypeElement = document.createElement('div');    // create a new div for the name and type of the team
    nametypeElement.classList.add('name_type');  

    let nameElement = document.createElement('span');       // create a new span for the name of the team
    nameElement.classList.add('name');                      // add the class "name" 
    nameElement.textContent = teamName;                         // set the name of the team
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

    let open = false;
    let agents = document.createElement('div')
    
    teamElement.addEventListener('click', () => {
        if(open){
            agents.remove();
            open=false;
        }else{
            //console.log(`leaderborad/${teamId}: memebrs: `, this.teamsAndMembers.get(teamId));
            agents = showAgentsOfTeam(teamsAndMembers.get(teamId))
            teamElement.appendChild(agents);
            open=true;
        }
    });
        

    leaderboardDiv.appendChild(teamElement);
    
}

async function addAgent (id, agent, score, leaderboardDiv) {

    if(!recordsAndColors.get(id)){ await newColor(id) }
    let color = recordsAndColors.get(id)

    let agentElement = document.createElement('div');     // create a new div for the agent
    agentElement.classList.add('team');                   // Add the class "team" to the new div
    agentElement.id = "agent_" + id;                 // Add the id "agent_id" to the new div

    let agentInfoElement = document.createElement('div');    // create a new div for the info of the team: name, id and score
    agentInfoElement.classList.add('teamInfo');              // Aggiungi la classe "team" al nuovo elemento div

    let nameidElement = document.createElement('div');       // create a new div for the name and id of the agent
    nameidElement.classList.add('name_type');  

    let nameElement = document.createElement('span');       // create a new span for the name of the agent
    nameElement.classList.add('name');                      // add the class "name" 
    nameElement.textContent = agent;                        // set the name of the agent
    nameidElement.appendChild(nameElement);              

    let idElement = document.createElement('span');         // create a new span for the id of the agent
    idElement.classList.add('type');                        // add the class "type"     
    idElement.textContent = id;                         
    nameidElement.appendChild(idElement);   

    let scoreElement = document.createElement('span');  // create a span for the score
    scoreElement.classList.add('score');                // add the class "score" 
    scoreElement.textContent = score;                   // set the score

    agentInfoElement.appendChild(nameidElement);   // Aggiungi l'elemento del nome e tipo del team al div del team
    agentInfoElement.appendChild(scoreElement);      // Aggiungi l'elemento del punteggio del team al div del team
    
    var colorString;

    if(color){
        colorString = `rgb(${color.r * 255}, ${color.g * 255}, ${color.b * 255})`;
        agentInfoElement.style.backgroundColor = colorString;
        agentElement.style.backgroundColor = colorString;
    }

    agentElement.appendChild(agentInfoElement);
    leaderboardDiv.appendChild(agentElement);
   
    
}

async function newColor(id){
    let coloriGiaUsati = Array.from(recordsAndColors.values());   // get an array with all the already used colors    
   
    let color;
    do{
        color = new THREE.Color( 0xffffff );        
        color.setHex( Math.random() * 0xffffff );

    }while(coloriGiaUsati.some(usedColor => areColorsSimilar(usedColor, color)))    // repaet the color generation until it is not similar with other already used colors 
    
    // update teamsAndColors adding tha net record
    recordsAndColors.set(id,color); 
}

function showAgentsOfTeam(agents){
    var agentsList = document.createElement('div');
    agentsList.classList.add('agentsList');
    
    for (let agent of agents) {
        addAgentInTeam(agent.id, agent.name, agent.score, agentsList);
    }

    return agentsList;

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

// funzione per confrontare due colore THREE.Color per evitare colori uguali o troppo simili
function areColorsSimilar(color1, color2) {
    //console.log("Colore 1:", color1 + " colore 2: ", color2);
    let tolerance = 0.1
    const deltaR = Math.abs(color1.r - color2.r);
    const deltaG = Math.abs(color1.g - color2.g);
    const deltaB = Math.abs(color1.b - color2.b);
    
    //console.log("Return: ", deltaR <= tolerance && deltaG <= tolerance && deltaB <= tolerance);
    return deltaR <= tolerance && deltaG <= tolerance && deltaB <= tolerance;    
}

function sortRecordsByScore(records) {
    const keys = Array.from(records.keys()); // Converti le chiavi della mappa in un array
    keys.sort((a, b) => records.get(b).recordScore - records.get(a).recordScore); // Ordina le chiavi in base al punteggio

    // Crea una nuova mappa ordinata
    const sortedRecords = new Map();
    keys.forEach(key => {
        sortedRecords.set(key, records.get(key));
    });

    return sortedRecords;
}






