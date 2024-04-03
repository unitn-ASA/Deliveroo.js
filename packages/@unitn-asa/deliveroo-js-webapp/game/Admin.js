class Admin{

    roomId // the room Id is usefull becouse define where the action of admin have a conseguence 

    constructor(roomId){

        this.roomId = roomId

        // define the handle of home and login buttons
        document.getElementById('home-button').addEventListener('click', function() {
            var url = '/home';
            window.location.href = url; 
        });

        // open the login form at the press of the login button
        document.getElementById('loginButton').addEventListener('click', () => {
            
            let loggedButton = document.getElementById('loginButton');
            if(loggedButton.classList.contains('logged')){ this.deleteAdminCookie(); console.log('LOGOUT ADMIN SUCSESS'); return; }
            openORcloseLoginForm(); 
        });

        // close the login form whem the user click the x 
        document.querySelector('#loginHeader button.close-button').addEventListener('click', function() {
            openORcloseLoginForm(); 
        });

        document.getElementById('loginForm').addEventListener('submit', async (event) => {
            event.preventDefault();

            const username = document.getElementById('username-login').value;
            const password = document.getElementById('password-login').value;

            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success) {
                console.log("LOGIN ADMIN SUCSESS")
                setAdminCookie(data.token)
                openORcloseLoginForm(); 
                this.checkLogged();
            } else {
                console.log("LOGIN ADMIN ERROR")
                document.getElementById('username-login').classList.add('error');
                document.getElementById('password-login').classList.add('error');
            }
        });
    }

    
    checkLogged(){
        let roomId = this.roomId
        let cookie = getAdminCookie()
        console.log('COOCKIE:', cookie)
        if(cookie !== 'false'){
            
        // change the login button to logged status
            let loggedButton = document.getElementById('loginButton');
            loggedButton.classList.add('logged');
            loggedButton.innerText = 'Logged'

            // add the delete and play/stop buotton to menage the match
            let divButtons = document.createElement('div'); 
            divButtons.id ='div-buttons'

            // request the status of the match to the server
            fetch(`/api/rooms/${roomId}/status`, {
                method: 'GET',
                headers: {
                'Content-Type': 'application/json',
                },
            })
            .then(response => {
                if (response.ok) { return response.json(); 
                } else { throw new Error('Error during data sending', response.json()); }
            })
            .then(data => {
                console.log('Correct: ', data.status)

                let deleteButton = document.createElement('button');
                deleteButton.classList.add('delete-button');
                deleteButton.setAttribute('room', roomId);
                deleteButton.innerHTML = `<i class="fas fa-trash-alt"></i>`;
                deleteButton.addEventListener('click',deleteMatch)
                        
                let playButton = document.createElement('button');
                playButton.classList.add('play-stop-button');
                playButton.setAttribute('room', roomId);
                playButton.textContent = invertPlayStop(data.status);
                playButton.addEventListener('click',sendPlayStopRoom)

                let restartButton = document.createElement('button');
                restartButton.classList.add('restart-button');
                restartButton.setAttribute('room', roomId);
                restartButton.textContent = 'restart'
                restartButton.addEventListener('click',showMatchForm)

                divButtons.appendChild(playButton);
                divButtons.appendChild(restartButton);
                divButtons.appendChild(deleteButton);
                
                let divAdmin = document.getElementById('admin-div');
                divAdmin.appendChild(divButtons)
            })
            .catch(error => {
                console.error('An error occurred:', error.message);
            });

            
        }else{

            // change the login button to login status
            let loggedButton = document.getElementById('loginButton');
            loggedButton.classList.remove('logged');
            loggedButton.innerText = 'Login'

            let divAdmin = document.getElementById('admin-div');
            let divButtons  = document.getElementById('div-buttons')
            if(divAdmin && divButtons){divAdmin.removeChild(divButtons) }
            
        }
    }

    deleteAdminCookie() {
        document.cookie = 'admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        this.checkLogged();
    }
}



function openORcloseLoginForm(){
    let loginFormContainer = document.getElementById('loginFormContainer');
    let overlay = document.getElementById('overlay');
    if (loginFormContainer.style.display === 'none' || loginFormContainer.style.display === '') {
        loginFormContainer.style.display = 'block';
        overlay.style.display = 'block';
    } else {
        loginFormContainer.style.display = 'none';
        overlay.style.display = 'none';
    }
}


// Function to menage the cookie
function setAdminCookie(token) {
    const d = new Date();
    d.setTime(d.getTime() + (1 * 24 * 60 * 60 * 1000));
    let expires = "expires="+d.toUTCString();
    document.cookie = "admin_token" + "=" + token + ";" + expires + ";path=/";
}

function getAdminCookie() {
    let name = "admin_token="
    let ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "false";
}


function sendPlayStopRoom(event){
    
    const token_admin = getAdminCookie();
    const roomId = event.target.getAttribute('room');
    //console.log(event)
    //console.log('Cange staus match ', matchId + ' to ', event.currentTarget.textContent);

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
        // Update the botton
        event.target.textContent = invertPlayStop(data.status)
      })
      .catch(error => {
        console.error('An error occurred:', error.message);
      });
    
}

function invertPlayStop(status){
    if(status == 'stop') return 'play';
    if(status == 'play') return 'stop';
}


function deleteMatch(event){

    const token_admin = getAdminCookie();
    const roomId = event.target.getAttribute('room');

    console.log(roomId)

    fetch(`/api/rooms/${roomId}/match`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${token_admin}`
        },
    })
    .then(response => {
        if (response.ok) {return response.json(); } 
        else { throw new Error('Error during data sending', response.json().message); }
    })
    .then(data => {
        console.log('Correct: ', data.message)
    })
    .catch(error => {
        console.error('An error occurred:', error.message);
    });
    
}
export{Admin}

/* DEFINE THE HTML OF THE NEW MATCH FORM */
function showMatchForm(event) {

    const token_admin = getAdminCookie();
    const roomId = event.target.getAttribute('room');
    console.log('show Match Form')

    //div modal to set a darker background
    var modalDiv = document.createElement('div');
    modalDiv.id = 'matchFormContainer';
    modalDiv.classList.add('modal');

    // div modal-content that is the colored pop-up
    var modalContentDiv = document.createElement('div');
    modalContentDiv.classList.add('modal-content');

    // close button 
    var closeDiv = document.createElement('div');
    closeDiv.classList.add('close');
    closeDiv.innerHTML = '&times;';
    closeDiv.onclick = function() {
        document.body.removeChild(modalDiv);
    };
    modalContentDiv.appendChild(closeDiv);

    // new match form
    var form = document.createElement('form');
    form.id = 'matchForm';

    // HTML code of the form 
    form.innerHTML = `
    <div style="text-align: center;">
        <div style="display: inline-block;">
            <h1 style="font-weight: bolder; display: inline-block;">NEW MATCH</h1>
        </div>
    </div>

    <label for="mapFile" class="lableNewMap">MAP_FILE:</label>
    <input type="text" id="mapFile"  class="inputNewMap" name='mapFile' readonly>
    <span class="returnButton">Seleziona</span>

    <label for="parcelsMax" class="lableNewMap">MATCH_TIMEOUT:</label>
    <input type="number" id="matchTimeout" class="inputNewMap" name="matchTimeout" required>

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
    // add the listener to the select button
    form.querySelector('.returnButton').addEventListener('click', openMapList);

    //set the config of the actual match in the new match form
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
        console.log(data.AGENTS_OBSERVATION_DISTANCE);
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

    //define what happen on the submit action
    form.addEventListener('submit',(event) => {
        event.preventDefault();

        // Get the value from the different input of the form
        const mapFile = document.getElementById('mapFile').value;
        const matchTimeout = document.getElementById('matchTimeout').value
        const parcelsInterval = document.getElementById('parcelsInterval').value;
        const parcelsMax = document.getElementById('parcelsMax').value;
        const parcelsRewardAvg = document.getElementById('parcelsRewardAvg').value;
        const parcelsRewardVariance = document.getElementById('parcelsRewardVariance').value;
        const parcelsDecadingInterval = document.getElementById('parcelsDecadingInterval').value;
        const randomlyMovingAgents = document.getElementById('randomlyMovingAgents').value;
        const randomlyAgentSpeed = document.getElementById('randomlyAgentSpeed').value;

        const agentsObservationDistance = document.getElementById('agentsObservationDistance').value;
        const parcelsObservationDistance = document.getElementById('parcelsObservationDistance').value;

        // check if the map input is empty
        if (mapFile === '') { document.getElementById('mapFile').classList.add('error'); return;}
        else{ document.getElementById('mapFile').classList.remove('error'); }
        
        // Create an object with all the input value
        const formData = {
        
        MAP_FILE: mapFile,
        MATCH_TIMEOUT: matchTimeout,
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

        // Make the request for a new match
        fetch(`/api/rooms/${roomId}/match`, {
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
        .then(data => {
            console.log('Dati sucsessfully sended to server: ');
            let matchForm = document.getElementById('matchFormContainer')
            document.body.removeChild(matchForm)                      // delete the new match form
        })
        .catch(error => { console.error('Si è verificato un errore:', error); });

        location.reload()
    })

    // add the form to the div modal-content
    modalContentDiv.appendChild(form);

    // add the div modal-content to the div modal
    modalDiv.appendChild(modalContentDiv);

    // add the div modal in the body
    document.body.appendChild(modalDiv);

}

/* ----------------------------------- FUNCTIONS for the menage of the MAP LIST during the process of new Match --------------------------*/
// function for open the list of maps 
function openMapList() {

    buildMapListModal();

    var modal = document.getElementById('mapListModal');
    modal.style.display = 'block';

    var mapListDiv = document.getElementById('map-container');
    mapListDiv.innerHTML = '';

    // request all the maps from the server
    fetch('/api/maps', {
        method: 'get',
        headers: {
        'Content-Type': 'application/json'
        },
    })
    .then(response => {
        if (!response.ok) { throw new Error('Errore durante il caricamento delle mappe'); }
        return response.json();
    })
    .then(data => {
        // Genera la rappresentazione grafica delle mappe
        data.forEach((map) => {
            let mapDiv = document.createElement('div')
            mapDiv.innerHTML += '<div class="map-title">' +
            `<h3>${map.name}</h3>` +
            `<span class="returnButton">Select</span>` +
            '</div>' + generateMapRepresentation(map.map);

            // add the listener to the select button
            mapDiv.querySelector('.returnButton').addEventListener('click', function(){
                console.log('Selected Map: ', map.name)
                selectMap(map.name)
            });

            // add the single map to the map list
            mapListDiv.appendChild(mapDiv)
        });
    })
}

// function that create the HTML element with all the map
function buildMapListModal() {

    // div modal to set a darker background
    var modalDiv = document.createElement('div');
    modalDiv.id = 'mapListModal';

    // div modal-content
    var modalContentDiv = document.createElement('div');
    modalContentDiv.id = 'mapListModal-content';

    // close button
    var closeSpan = document.createElement('span');
    closeSpan.classList.add('close');
    closeSpan.innerHTML = '&times;';
    closeSpan.onclick = function() { closeMapList(); };
    modalContentDiv.appendChild(closeSpan);

    var header = document.createElement('h2');
    header.textContent = 'Lista Mappe';
    modalContentDiv.appendChild(header);

    var mapContainerDiv = document.createElement('div');
    mapContainerDiv.id = 'map-container';
    modalContentDiv.appendChild(mapContainerDiv);

    modalDiv.appendChild(modalContentDiv);

    document.body.appendChild(modalDiv);
}

// function to generete the grafic rappresentation of the map 
function generateMapRepresentation(map) {
    var rows = map.length;

    var representation = '<div class="map" style="--rows: ' + rows + ';">';
    for (var i = 0; i < rows; i++) {
        representation += '<div class="row">';
        for (var j = 0; j < map[i].length; j++) {
            var cellClass = '';
            switch (map[i][j]) {
                case 0:
                    cellClass = 'light-green';
                    break;
                case 1:
                    cellClass = 'dark-green';
                    break;
                case 2:
                    cellClass = 'red';
                    break;
                case 3:
                    cellClass = 'black';
                    break;
                default:
                    cellClass = '';
                    break;
            }
            representation += '<div class="cell ' + cellClass + '"></div>';
        }
        representation += '</div>';
    }
    representation += '</div>';
    return representation;
}

// function to cles the map list pop-up
function closeMapList() {
    var modal = document.getElementById('mapListModal');
    modal.style.display = 'none';
}

// function to select one map, it save the choosen one in the map input of the new match form and close the pop-up
function selectMap(mapName) {
    var selectedMapInput = document.getElementById('mapFile'); 
    selectedMapInput.value = mapName;  

    closeMapList();
}

