class Leaderboard {

    teamsAndMembers;                // key: nome team, value: array degli agenti(id,nome e score) 
    game;                           // parent object 
    leaderboardElement;             // html element


    constructor(game, roomId){

        this.game = game
        this.teamsAndMembers = new Map()
        
        new Promise(async (resolve, rejects) => {
            this.costruct();                          // before costruct the html element
            resolve()
        })
        .then(() => {  this.init(roomId); })          // then init it
        
    }

    // the function costruct the html element of the leaderbord before it init 
    async costruct(){
        
        const folderDiv = document.createElement('div');                // parent folder
        folderDiv.classList.add('folder');
        folderDiv.id = 'folderLeaderbord';

        const h4Element = document.createElement('h4');                 // Leaderbord title
        h4Element.textContent = 'Leaderboard';  

        this.leaderboardElement  = document.createElement('div');       // div in wich show the real leaderbord
        this.leaderboardElement.classList.add('leaderboard');
        this.leaderboardElement.id = 'leaderboard';

        folderDiv.appendChild(h4Element);
        folderDiv.appendChild(this.leaderboardElement);

        const rightColum = document.getElementById('right-colum');
        const panelElement = document.getElementById('panel');          // take the reference to the panel element

        if (panelElement) {                                             // if the panel is found add the leaderbord after it 
            panelElement.insertAdjacentElement('afterend', folderDiv);
        } else {                                                        // else append it at the end of the eight colum 
            rightColum.appendChild(folderDiv);
        }

        console.log('CREATED LEADERBORD')
    }

    // The definition and use of the function init is becouse the constructor can not define as async
    async init(roomId){

        console.log('LEADERBORD: Request all team of the match of the room', roomId)         // request all the information of the match score to the server
        await fetch('/api/leaderboard', {                                               // start with the request of all the teams:
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'roomId': roomId,
                'teamId': '',
                'aggregateby': 'true'
            }
        )
        .then(response => {
            if (response.ok) {return response.json();}
            else {throw new Error(`Error, Status code: ${response.status}`);}
        })
        .then(data => {
            console.log(data)
            data.forEach(element => {
                if(element.teamName !== 'no-team'){
                    /* Could happen that arive an update signal before the init is complete, so the update add the team one time 
                    for this reason we have to check that team is not alredy added */
                    let teamElement = document.getElementById("team_" + element.teamId)
                    if (teamElement) {
                        console.log(`LEADERBORD: The team ${element.teamId} is already present on the leaderbord before init`);
                    }else{
                        console.log("LEADERBORD: Adding team ", element.teamName, ' id ', element.teamId);                
                        // Then we add the div of the team in the leaderboard 
                        this.addTeam(element.teamId, element.teamName, element.score)
                    }
                }else{
                    /* Could happen that arive an update signal before the init is complete, so the update add the agent one time 
                    for this reason we have to check that agent is not alredy added */
                    let agentElement = document.getElementById("agent_" + element.agentId)
                    if (agentElement) {                                        // if the agent is not present in the leaderbord it is added
                        console.log(`LEADERBORD: L'agent ${element.agentId} is already present on the leaderbord before init`);
                    }else{
                        console.log("LEADERBORD: Adding agent " + element.agentId + " without a team")
                        // Then we add the div of the alone agent in the leaderboard 
                        this.addAgent(element.agentName, element.agentId, element.teamId, element.score )
                    }     
                }
            });
        })
        .catch(error => { console.error('An error occurred:', error); });
       
        // Now for each team we request the agent members
        for (let team of this.teamsAndMembers.keys()) {
            await fetch('/api/leaderboard', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'roomId': roomId,
                    'teamId': team,  
                    'aggregateby': false
                }
            )
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error(`Error, Status code: ${response.status}`);
            })
            .then(data => {
                console.log(`LEADERBORD /${team}: Request to database it's memebers: `)
                console.log(data)
                data.forEach(element => { 
                    if(!this.teamsAndMembers.get(element.teamId).find(member => member.id === element.agentId )){
                        this.teamsAndMembers.get(element.teamId).push({id: element.agentId, name: element.agentName, score: element.score})
                    }else{
                        console.log("LEADERBORD: This agent", element.agentId  +"already exists in teamMembers list.");
                    }     
                });     
            })
            .catch(error => { console.error('An error occurred:', error); });
      
        }

        console.log('INITIALIZED LEADERBORD') 
    }

    // remove the leaderbord element from the game screen
    delete(){ 
        let rightColum = document.getElementById('right-colum');
        let leaderbord = document.getElementById('folderLeaderbord');
        rightColum.removeChild(leaderbord) 

        this.leaderboardElement = null;
        this.teamsAndMembers.clear();
    } 

    addTeam (teamId, teamName, score) {

        this.teamsAndMembers.set(teamId, []);       // add a record for the team where its id is associeted with a empty array 
        // If the team have no yet assosieted a color, it associete one and save it in the game.teamsAndColors map.
        if(!this.game.teamsAndColors.get(teamId)){ this.game.newColor(teamId) }
        let color = this.game.teamsAndColors.get(teamId)

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
    
        var open = false;
        var agents = document.createElement('div')
    
        teamElement.addEventListener('click', () => {
            if(open){
                agents.remove();
                open=false;
            }else{
                //console.log(`leaderborad/${teamId}: memebrs: `, this.teamsAndMembers.get(teamId));
                agents = this.showAgentsOfTeam(this.teamsAndMembers.get(teamId))
                teamElement.appendChild(agents);
                open=true;
            }
        });
        
    
        // Aggiungi il div del team al leaderboard
        this.leaderboardElement.appendChild(teamElement);
        
    }

    addAgent (agent, id, teamId, score) {

        // If the team have no yet assosieted a color, it associete one and save it in the game.teamsAndColors map.
        if(!this.game.teamsAndColors.get(teamId)){ this.game.newColor(teamId) }
        //console.log(this.game.teamsAndColors)
        let color = this.game.teamsAndColors.get(teamId)

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
    
        // Aggiungi il div del team al leaderboard
        this.leaderboardElement.appendChild(agentElement);
        
    }


    showAgentsOfTeam(agents){
        var agentsList = document.createElement('div');
        agentsList.classList.add('agentsList');
        
        for (let agent of agents) {
            addAgentInTeam(agent.id, agent.name, agent.score, agentsList);
        }
    
        return agentsList;
    
    }
    
    async updateLeaderbord (id, name, score, teamId, teamName, teamScore ) {
        
        console.log('LEADERBORD UPDATE: data recevied:', id, name, score, teamId, teamName, teamScore );

        // if the agent has no team we update only the score of the agent 
        if(teamName === 'no-team'){
            let agentElement = document.getElementById("agent_" + id)
           
            if (!agentElement) {                                        // if the agent is not present in the leaderbord it is added
                console.log(`LEADERBORD: L'agent ${name} is not present on the leaderbord`);
                this.addAgent(name, id, teamId, score);
                return;
            }
    
            let scoreElement = agentElement.querySelector('.score');    // Find the element of agent score 
            scoreElement.textContent = score;                           // Update the score 
    
        // if the agent has a team we have to update the agent and also the team
        }else{
            // first update the team score 
            let teamElement = document.getElementById("team_" + teamId)
            // If the team is not present to the leaderboard we add it 
            if (!teamElement) {
                console.log(`LEADERBORD: The team ${teamId} is not present in the leaderboard.`);
                this.addTeam(teamId, teamName, teamScore);
                teamElement = document.getElementById("team_" + teamId)
            }
            let scoreElement = teamElement.querySelector('.score');     // Find the score element of the team
            scoreElement.textContent = teamScore;                       // Update the score element 

            // then we update the agent score
            if(this.teamsAndMembers.has(teamId)){
                const teamMembers = this.teamsAndMembers.get(teamId);     // Get array of member of the team, then chack if it contain already the agent 
                const existingMember = teamMembers.find(member => member.id === id );
    
                if (existingMember) {       // L'array teamMembers has already an object with the same id
                    console.log("LEADERBORD: This agent already exists in teamMembers list.");
                    existingMember.score = score;
                } else {                    // if it nox exist we add it 
                    console.log("LEADERBORD: This agent not exists in teamMembers list, we add it.");
                    teamMembers.push({ id, name, score });  
                }

                // close and reopen the label to show the update 
                let teamElement = this.leaderboardElement.querySelector(`#team_${teamId}`);
                const clickEvent = new Event('click');
                teamElement.dispatchEvent(clickEvent);
                teamElement.dispatchEvent(clickEvent);

            } else {
                // if the team is not present, we create a new record with the team and agent
                console.log(`LEADERBORD: The team ${teamId} is NOT present in the teamsAndMembers.`);
                this.teamsAndMembers.set(team, [{ id, name, score }]);
                console.log(this.teamsAndMembers.get(team))
            }   
        }  
    } 
};




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



