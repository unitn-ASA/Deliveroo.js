async function defineContainerRooms(admin){
    try {
        var data = await requestRooms();    // request all the rooms in the server 
        console.log(data);
        
        //The container has a different structure if the user is an admin or not 
        if(admin){
            let container = document.getElementById('rooms-container-admin')
            /* for each room add a id, description, date of match, join button ( to go to the game ), freeze/unfreeze button 
            ( to freeze or unfreeze the grid ) a change grid button and start/stop button and eventualy the change match */
            data.rooms.forEach((room, index) => {
        
                let divRoom = document.createElement('div'); 
                divRoom.classList = 'div-room';

                let idRoom = document.createElement('div');                         // create the id of the room
                idRoom.classList = 'id-room';
                idRoom.textContent = room;
    
                let descriptionMatch = document.createElement('div');               // create the description 
                descriptionMatch.classList = 'description-match';
                descriptionMatch.textContent = 'Match ' + data.matchesId[index] +' status is ' + data.matchesStatus[index];

                let dateMatch = document.createElement('div')                       // create the date of the match i the room
                dateMatch.classList = 'date-match';
                dateMatch.textContent =  data.matchesDates[index]

                divRoom.appendChild(idRoom);
                divRoom.appendChild(descriptionMatch);
                divRoom.appendChild(dateMatch);

                let buttonsRoom = document.createElement('div')                     // now define all the buttons 
                buttonsRoom.classList.add('buttons-room')

                let joinButton = document.createElement('button');                  // join game
                joinButton.classList.add('join-button');
                joinButton.setAttribute('room', room);
                joinButton.textContent = `join`;
                joinButton.addEventListener('click',requestJoinGame)
                buttonsRoom.appendChild(joinButton);
                       
                let freezeButton = document.createElement('button');                 // freeze grid 
                freezeButton.classList.add('freeze-button');
                freezeButton.setAttribute('room', room);
                freezeButton.textContent = getFreezeButtonText(data.gridStatus[index]);
                freezeButton.addEventListener('click', requestFreezeGrid)
                buttonsRoom.appendChild(freezeButton);               

                let changeButton = document.createElement('button');                // chagne grid
                changeButton.classList.add('change-button');
                changeButton.setAttribute('room', room);
                changeButton.textContent = `grid`;
                changeButton.addEventListener('click',requestChangeGrid)
                buttonsRoom.appendChild(changeButton);

                divRoom.appendChild(buttonsRoom)
                container.appendChild(divRoom);
            });
        }else{                                                              // if the client is a standard user we add only a botton to join 
            let container = document.getElementById('rooms-container')      // 
            data.rooms.forEach((room, index) => {                    // for each element add a button

                let button = document.createElement('button');
                button.classList.add('partecipaBtn');
                button.setAttribute('room', room);
                button.textContent = `Join Room ${room}`;
                button.addEventListener('click',requestJoinGame)
                
                container.appendChild(button);
            });
        }

    }catch (error) {
        console.error('Error:', error);
    }
    
}
export { defineContainerRooms };


/* AUXILIAR FUNCTION */
/* the function request to the server all the active rooms */
async function requestRooms(){
    // Ask the list of the matchs
    try {
        const response = await fetch('/api/rooms', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error('Error:', error);
        throw error; // Rilancia l'errore per gestirlo al chiamante se necessario
    }

}

/* FUNCTION used by the BOTTONS */
// the function request to the server for the socket to join the match in the selected room  
function requestJoinGame(event){
    
    var url = '/game';
    url += '?room=' + encodeURIComponent(event.target.getAttribute('room')); 

    console.log("go to room: ", event.target.getAttribute('room'))

    window.location.href = url; 
}

/* the function define the text of the freeze button based on the grid status*/
function getFreezeButtonText(status) {
    if (status === 'freeze') return 'unfreeze';
    if (status === 'unfreeze') return 'freeze';
    return 'undefined';
}
/* the function request to the server to freeze or unfreeze the grid of the room. 
After the request it update the match description and the play/stop button*/
function requestFreezeGrid(event){
    
    const token_admin = getAdminCookie();
    const roomId = event.target.getAttribute('room');

    console.log('Cange staus match ', roomId + ' to ', event.currentTarget.textContent);

    fetch(`/api/grids/${roomId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${token_admin}`
        },
    })
    .then(response => {
        if (response.ok) { return response.json(); } 
        else { throw new Error('Error during data sending'); }
    })
    .then(data => {
        console.log('FREEZE BUTTON: request correct; ', data.message)
        event.target.textContent = getFreezeButtonText(data.status)                     // Update the botton's text
    })
    .catch(error => {
        console.error('An error occurred:', error.message);
    });
    
}

/* the function request a to change the grid in the room, first request the config of the last grid; then ask to the user if he want to 
change it and after it make the request  */
async function requestChangeGrid(event){

    const token_admin = getAdminCookie();
    const roomId = event.target.getAttribute('room');

    fetch('/api/config', {                                          // first request the old configs
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'roomId': roomId
        },
    })
    .then(response => {
        if (response.ok) {return response.json(); }
        else {throw new Error('Error in the request of config data'); }
    })
    .then(data => {
        let form = showGridForm();                                                             // show the form for menage the config of the new grid
        
        form.addEventListener('submit',(event) => {                                            // define what happen on the submit action
            event.preventDefault();

            const mapFile = document.getElementById('mapFile').value;                              // Get the value from the different input of the form
            const parcelsInterval = document.getElementById('parcelsInterval').value;
            const parcelsMax = document.getElementById('parcelsMax').value;
            const parcelsRewardAvg = document.getElementById('parcelsRewardAvg').value;
            const parcelsRewardVariance = document.getElementById('parcelsRewardVariance').value;
            const parcelsDecadingInterval = document.getElementById('parcelsDecadingInterval').value;
            const randomlyMovingAgents = document.getElementById('randomlyMovingAgents').value;
            const randomlyAgentSpeed = document.getElementById('randomlyAgentSpeed').value;
            const agentsObservationDistance = document.getElementById('agentsObservationDistance').value;
            const parcelsObservationDistance = document.getElementById('parcelsObservationDistance').value;

            if (mapFile === '') { document.getElementById('mapFile').classList.add('error'); return;}       // check if the map input is empty
            else{ document.getElementById('mapFile').classList.remove('error'); }
    
    
            const formData = {                      // Create an object with all the input value  
                MAP_FILE: mapFile,
                PARCELS_GENERATION_INTERVAL: parcelsInterval,
                PARCELS_MAX: parseInt(parcelsMax),
                PARCEL_REWARD_AVG: parseInt(parcelsRewardAvg),
                PARCEL_REWARD_VARIANCE: parseInt(parcelsRewardVariance),
                PARCEL_DECADING_INTERVAL: parcelsDecadingInterval,

                RANDOMLY_MOVING_AGENTS: parseInt(randomlyMovingAgents),
                RANDOM_AGENT_SPEED: randomlyAgentSpeed,

                AGENTS_OBSERVATION_DISTANCE: agentsObservationDistance,
                PARCELS_OBSERVATION_DISTANCE: parcelsObservationDistance,
                MOVEMENT_DURATION: 50
            };

    
            fetch(`/api/grids/${roomId}`, {           // Make the request for change the grid
                method: 'PUT',
                headers: {
                'Content-Type': 'application/json',
                'Authorization': `${token_admin}`
                },
                body: JSON.stringify(formData)
            })
            .then(response => {
                if (response.ok) { return response.json(); } 
                else { throw new Error('Errore durante l\'invio dei dati al server.'); }
            })
            .then(() => {
                console.log('Dati sucsessfully sended to server: ');
                let gridForm = document.getElementById('gridFormContainer')
                document.body.removeChild(gridForm)                                             // delete the new match form
            })
            .catch(error => {console.error('Si è verificato un errore:', error);});
        })
        return data
    })
    .then(data => {
        console.log(data);
        if(!data){console.log('Error get past config'); return}

        document.getElementById('mapFile').value = data.MAP_FILE;                               // Put the input to the default value
        document.getElementById('parcelsInterval').value = data.PARCELS_GENERATION_INTERVAL;
        document.getElementById('parcelsMax').value = data.PARCELS_MAX;
        document.getElementById('parcelsRewardAvg').value = data.PARCEL_REWARD_AVG;
        document.getElementById('parcelsRewardVariance').value = data.PARCEL_REWARD_VARIANCE;
        document.getElementById('parcelsDecadingInterval').value = data.PARCEL_DECADING_INTERVAL;
    
        document.getElementById('randomlyMovingAgents').value = data.RANDOMLY_MOVING_AGENTS;
        document.getElementById('randomlyAgentSpeed').value = data.RANDOM_AGENT_SPEED;
    
        if(isNaN(data.AGENTS_OBSERVATION_DISTANCE)){document.getElementById('agentsObservationDistance').value = 'infinite'}
        else { document.getElementById('agentsObservationDistance').value = data.AGENTS_OBSERVATION_DISTANCE; }

        if(isNaN(data.PARCELS_OBSERVATION_DISTANCE)){document.getElementById('parcelsObservationDistance').value = 'infinite'}
        else{ document.getElementById('parcelsObservationDistance').value = data.PARCELS_OBSERVATION_DISTANCE; }

    })
    .catch(error => { console.error('It occures an error:', error); });
}
/* define the html of the change grid form */
function showGridForm() {

    var modalDiv = document.createElement('div');                   //div modal to set a darker background
    modalDiv.id = 'gridFormContainer';
    modalDiv.classList.add('modal');

    var modalContentDiv = document.createElement('div');            // div modal-content that is the colored pop-up
    modalContentDiv.classList.add('modal-content');

    var closeDiv = document.createElement('div');                   // close button 
    closeDiv.classList.add('close');
    closeDiv.innerHTML = '&times;';
    closeDiv.onclick = function() {
        modalDiv.style.display = 'none';
    };
    modalContentDiv.appendChild(closeDiv);

    // new match form
    var form = document.createElement('form');
    form.id = 'gridForm';

    // HTML code of the form 
    form.innerHTML = `
    <div style="text-align: center;">
        <div style="display: inline-block;">
            <h1 style="font-weight: bolder; display: inline-block;">NEW MATCH</h1>
        </div>
    </div>

    <label for="mapFile" class="lableNewMap">MAP_FILE:</label>
    <input type="text" id="mapFile"  class="inputNewMap" name='mapFile' readonly>
    <span onclick="openMapList()" class="returnButton">Seleziona</span>

    <label for="parcelsInterval" class="lableNewMap">PARCELS_GENERATION_INTERVAL:</label>
    <select id="parcelsInterval" class="inputNewMap" name="parcelsInterval">
        <option value="1s">1 second</option>
        <option value="2s" selected>2 second</option>
        <option value="5s">5 second</option>
        <option value="10s">10 second</option>
    </select>

    <label for="parcelsMax" class="lableNewMap">PARCELS_MAX:</label>
    <input type="number" id="parcelsMax" class="inputNewMap" name="parcelsMax" required>

    <label for="parcelsRewardAvg" class="lableNewMap">PARCEL_REWARD_AVG:</label>
    <input type="number" id="parcelsRewardAvg" class="inputNewMap" name="parcelsRewardAvg" required>

    <label for="parcelsRewardVariance" class="lableNewMap">PARCEL_REWARD_VARIANCE:</label>
    <input type="number" id="parcelsRewardVariance" class="inputNewMap" name="parcelsRewardVariance" required>

    <label for="parcelsDecadingInterval" class="lableNewMap">PARCE_DECADING_INTERVALL:</label>
    <select id="parcelsDecadingInterval" class="inputNewMap" name="parcelsDecadingInterval">
        <option value="infinite" selected>Costanti</option>
        <option value="1s">1 second</option>
        <option value="2s">2 second</option>
        <option value="5s">5 second</option>
        <option value="10s">10 second</option>
    </select><br>

    <label for="randomlyMovingAgents" class="lableNewMap">RANDOMLY_MOVING_AGENTS:</label>
    <input type="number" id="randomlyMovingAgents" class="inputNewMap" name="randomlyMovingAgents" required>

    <label for="randomlyAgentSpeed" class="lableNewMap">RANDOM_AGENT_SPEED:</label>
    <select id="randomlyAgentSpeed" class="inputNewMap" name="randomlyAgentSpeed">
        <option value="1s">1 second</option>
        <option value="2s" selected>2 second</option>
        <option value="5s">5 second</option>
        <option value="10s">10 second</option>
    </select><br><br>

    
    <label for="agentsObservationDistance" class="lableNewMap">AGENTS_OBSERVATION_DISTANCE:</label>
    <input type="text" id="agentsObservationDistance" class="inputNewMap" name="agentsObservationDistance" value=5>
    
    <label for="parcelsObservationDistance" class="lableNewMap">PARCELS_OBSERVATION_DISTANCE:</label>
    <input type="text" id="parcelsObservationDistance" class="inputNewMap" name="parcelsObservationDistance" value=5>
    <br><br>

    <div style="text-align: center;">
        <div style="display: inline-block;">
            <input type="submit" class="submitNewMap" value="Submit">
        </div>
    </div>
    `;

    // add the form to the div modal-content
    modalContentDiv.appendChild(form);

    // add the div modal-content to the div modal
    modalDiv.appendChild(modalContentDiv);

    // add the div modal in the body
    document.body.appendChild(modalDiv);
    return form;
}




// OLD FUNCTIONS 
/* the function request all the matches of a room*/
function reqMatches(event){

    const roomId = event.target.getAttribute('room');

    fetch(`/api/rooms/${roomId}/matches`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
    }).then(response => {
        if (response.ok) { return response.json(); } 
        else { throw new Error('Error during data sending', response.json().message); }
    }).then(data => {
        console.log('Correct: ', data.result)
        displayMatches(data.result)
    }).catch(error => { console.error('An error occurred:', error.message); });
}
// the function show the end leaderbord of the last match of a room 
function showResultMatch(event){
    
    let matchId = event.target.getAttribute('matchId') 
    console.log('MaTCHID:', matchId)
    document.body.innerHTML ='';            // clear the body
    //change the style of the body
    document.body.style.display = 'flex';
    document.body.style.alignItems = 'center';
    showLeaderbord(matchId, document.body)  // add the leaderbord
}
// the function define the text of the button status based on the match status
function getStatusButtonText(status) {
    if (status === 'on') return 'off';
    if (status === 'off') return 'on';
    return 'undefined';
}
/* the function menage the request to delete a room */
function deleteRoom(event){

    const token_admin = getAdminCookie();
    const roomId = event.target.getAttribute('room');

    fetch(`/api/rooms/${roomId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${token_admin}`
        },
    })
    .then(response => {
        if (response.ok) {
            return response.json(); 
        } else {
            throw new Error('Error during data sending', response.json().message);
        }
    })
    .then(data => {
        console.log('Correct: ', data.message)
        location.reload();
    })
    .catch(error => {
        console.error('An error occurred:', error.message);
    });
    
}
/* the function menage the html for show the matches screen */
function displayMatches(matches) {

    document.body.innerHTML = '';   // Empties the body of the HTML document
    document.body.style.backgroundColor = 'black'
    document.body.style.display = 'flex'
    document.body.style.marginTop = '20px'
    document.body.style.alignItems = 'center'; 

    const matchListContainer = document.createElement("div");
    matchListContainer.id = 'matchListContainer'
    matchListContainer.innerHTML = "";

    // list of the matches
    const matchList = document.createElement("div");
    matchList.id = 'matchList'
    matchList.innerHTML = ""; 

    const matchListTitle = document.createElement("h2")
    matchListTitle.innerText = 'Matches List'
    matchList.appendChild(matchListTitle)

    // leaderbord space
    const leaderbord = document.createElement("div");
    leaderbord.id = 'leaderbord-matchList'
    leaderbord.innerHTML = ""; 

    // Sort the matches on Date 
    matches.sort((a, b) => new Date(a.firstTime) - new Date(b.firstTime));

    for (const match of matches) {
        const matchId = match.matchId;
        const firstTime = new Date(match.firstTime);

        const formattedDate = `${firstTime.getDate()}-${firstTime.getMonth() + 1}-${firstTime.getFullYear()} ${firstTime.getHours()}:${firstTime.getMinutes()}`;

        const matchItem = document.createElement("div");
        matchItem.classList.add("matchItem");

        const matchInfo = document.createElement("div");
        matchInfo.classList = 'matchInfo'
        matchInfo.textContent = `${matchId} - ${formattedDate}`;

        const matchButton = document.createElement("button");
        matchButton.textContent = "Leaderboard";
        matchButton.dataset.matchId = matchId;

        matchItem.appendChild(matchInfo);
        matchItem.appendChild(matchButton);

        matchList.appendChild(matchItem);

        matchButton.addEventListener("click", () => {
            handleLeaderboardButtonClick(matchId,leaderbord);
        });
    }

    matchListContainer.appendChild(matchList)
    matchListContainer.appendChild(leaderbord)

    document.body.appendChild(matchListContainer)
}
/* the function init the right part of the window that is dedicated to show the leaderborad of the selected match */
function handleLeaderboardButtonClick(matchId, leaderbord) {
    leaderbord.innerHTML = ''; 
    showLeaderbord(matchId, leaderbord)
}
