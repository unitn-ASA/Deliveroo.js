import { showMatchForm } from './tools/showMatchForm.js';
import { requestNewMatch } from './tools/requestNewMatch.js';
import { showLeaderbord } from  './tools/showLeaderbord.js'


async function defineContainerRooms(admin){
    try {
        var data = await requestRooms();
        console.log(data);
        
        if(admin){
            let container = document.getElementById('rooms-container-admin')
            data.rooms.forEach((room, index) => {
                // for each element add a id, description, delete button and play button
                let divRoom = document.createElement('div'); 
                divRoom.classList = 'div-room';

                let idRoom = document.createElement('div');          
                idRoom.classList = 'id-room';
                idRoom.textContent = room;
    
                let descriptionMatch = document.createElement('div');          
                descriptionMatch.classList = 'description-match';
                descriptionMatch.textContent = 'Match ' + data.matches[index] +' status is ' + getStatusText(data.status[index]);

                let dateMatch = document.createElement('div')
                dateMatch.classList = 'date-match';
                dateMatch.textContent =  data.dates[index]

                divRoom.appendChild(idRoom);
                divRoom.appendChild(descriptionMatch);
                divRoom.appendChild(dateMatch);

                let buttonsRoom = document.createElement('div')
                buttonsRoom.classList.add('buttons-room')

                if(data.status[index] != 'end'){

                    let joinButton = document.createElement('button');
                    joinButton.classList.add('join-button');
                    joinButton.setAttribute('room', room);
                    joinButton.textContent = `join`;
                    joinButton.addEventListener('click',requestJoinMatch)
                                        
                    let playButton = document.createElement('button');
                    playButton.classList.add('standard-button');
                    playButton.setAttribute('room', room);
                    playButton.textContent = getStatusButtonText(data.status[index]);
                    playButton.addEventListener('click',sendPlayStopMatch)

                    buttonsRoom.appendChild(joinButton);
                    buttonsRoom.appendChild(playButton);
                }else{
                    let resultButton = document.createElement('button');
                    resultButton.classList.add('join-button');
                    resultButton.setAttribute('matchId', data.matches[index]);
                    resultButton.textContent = `result`;
                    resultButton.addEventListener('click',showResultMatch)
            
                    buttonsRoom.appendChild(resultButton);
                }

                let matchesButton = document.createElement('button');
                matchesButton.classList.add('standard-button');
                matchesButton.setAttribute('room', room);
                matchesButton.textContent = `matches`;
                matchesButton.addEventListener('click',reqMatches)

                buttonsRoom.appendChild(matchesButton);

                let restartButton = document.createElement('button');
                restartButton.classList.add('restart-button');
                restartButton.setAttribute('room', room);
                restartButton.textContent = `restart`;
                restartButton.addEventListener('click',restartMatch)

                let deleteButton = document.createElement('button');
                deleteButton.classList.add('delete-button');
                deleteButton.setAttribute('room', room);
                deleteButton.textContent = `X`;
                deleteButton.addEventListener('click',deleteRoom)

                buttonsRoom.appendChild(restartButton);
                buttonsRoom.appendChild(deleteButton);

                divRoom.appendChild(buttonsRoom)

                container.appendChild(divRoom);
            });
        }else{
            let container = document.getElementById('rooms-container')
            data.rooms.forEach((room, index) => {                    // for each element add a button

                let button = document.createElement('button');
                button.classList.add('partecipaBtn');
                button.setAttribute('room', room);

                // if the match in the room is ended it has a different color and on the click show the final leaderbord, else it send the client to the match 
                if(data.status[index] == 'end'){
                    button.style.backgroundColor = 'grey'
                    button.textContent = `Result Room ${room}`;
                    button.setAttribute('matchId', data.matches[index]);
                    button.addEventListener('click', showResultMatch)
                }else{
                    button.textContent = `Join Room ${room}`;
                    button.addEventListener('click',requestJoinMatch)
                }
                 
                container.appendChild(button);
            });
        }

    }catch (error) {
        console.error('Error:', error);
    }
    
}
export { defineContainerRooms };

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

/* the function request to the server for the socket to join the match in the selected room  */
function requestJoinMatch(event){
    
    var url = '/game';
    url += '?room=' + encodeURIComponent(event.target.getAttribute('room')); 

    console.log("go to room: ", event.target.getAttribute('room'))

    window.location.href = url; 
}

/* the function show the end leaderbord of the last match of a room */
function showResultMatch(event){
    
    let matchId = event.target.getAttribute('matchId') 
    console.log('MaTCHID:', matchId)
    document.body.innerHTML ='';            // clear the body
    //change the style of the body
    document.body.style.display = 'flex';
    document.body.style.alignItems = 'center';
    showLeaderbord(matchId, document.body)  // add the leaderbord
}

/* the function define the the status part of the match descriptio based on the match status*/
function getStatusText(status) {
    if (status === 'play') return ' active';
    if (status === 'stop') return ' pause';
    if (status === 'end') return ' end';
    return 'undefined status';
}

/* the function define the text of the button status based on the match status*/
function getStatusButtonText(status) {
    if (status === 'stop') return 'play';
    if (status === 'play') return 'stop';
    return 'undefined';
}

/* the function restart the match in the room, first request the config of the last match; then ask to the user if he want to change it 
 and after it make a request ot the api put room/id/match */
async function restartMatch(event){

    const token_admin = getAdminCookie();
    const roomId = event.target.getAttribute('room');

    console.log('Restart match in room ', roomId);

    fetch('/api/config', {
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
        showMatchForm();
        document.getElementById('matchFormContainer').style.display = 'block';

        // MENGAE THE SUBMIT ACTION 
        document.getElementById('matchForm').addEventListener('submit', function(event) {
            event.preventDefault(); // Impedisce l'invio del form predefinito
            requestNewMatch(roomId, token_admin)
        })

        return data
    })
    .then(data => {
        console.log(data);
        if(!data){console.log('Error get past config'); return}

        // Put the input to the default value
        document.getElementById('mapFile').value = data.MAP_FILE;
        document.getElementById('matchTimeout').value = data.MATCH_TIMEOUT;
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
    .catch(error => {
        console.error('It occures an error:', error);
    });
}

/* the function request to the server to start or stop the selected match. The stop or play action is choose based on the text of the button. 
After the request it update the match description and the play/stop button*/
function sendPlayStopMatch(event){
    
    const token_admin = getAdminCookie();
    const roomId = event.target.getAttribute('room');

    console.log('Cange staus match ', roomId + ' to ', event.currentTarget.textContent);

    fetch(`/api/rooms/${roomId}/match/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${token_admin}`
        },
        body: JSON.stringify({ id: roomId}) // Invia l'ID del match e il nuovo stato
      })
      .then(response => {
        if (response.ok) {
          return response.json(); 
        } else {
          throw new Error('Error during data sending');
        }
      })
      .then(data => {
        console.log('Correct: ', data.message)

        // Update the description
        const descriptionElement = event.target.parentElement.querySelector('.description-match')
        descriptionElement.textContent = 'Match ' + data.matchId +' status is ' + getStatusText(data.status);;

        // Update the botton
        event.target.textContent = getStatusButtonText(data.status)

      })
      .catch(error => {
        console.error('An error occurred:', error.message);
      });
    
}

/* the function request all the matches of a room*/
function reqMatches(event){

    const roomId = event.target.getAttribute('room');

    fetch(`/api/rooms/${roomId}/matches`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
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
        console.log('Correct: ', data.result)
        displayMatches(data.result)
    })
    .catch(error => {
        console.error('An error occurred:', error.message);
    });
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



