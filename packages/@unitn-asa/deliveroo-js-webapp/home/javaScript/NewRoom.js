function newRoom() {
  const token_admin = getAdminCookie();
  
  fetch('/api/config', {                                                 // request the default config of the match
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  .then(response => {
    if (response.ok) {return response.json(); }
    else {throw new Error('Error in the request of config data'); }
  })
  .then(data => {
    let form = showGridForm();
          
    form.addEventListener('submit', function(event) {
      event.preventDefault();                                             // Impedisce l'invio del form predefinito
      requestNewRoom(token_admin)
    })

    return data
  })
  .then(data => {
    if(!data){console.log('Error get past config'); return}
    console.log(data)

    // Put the input to the default value
    document.getElementById('mapFile').value = data.MAP_FILE;
    document.getElementById('parcelsInterval').value = data.PARCELS_GENERATION_INTERVAL;
    document.getElementById('parcelsMax').value = data.PARCELS_MAX;
    document.getElementById('parcelsRewardAvg').value = data.PARCEL_REWARD_AVG;
    document.getElementById('parcelsRewardVariance').value = data.PARCEL_REWARD_VARIANCE;
    document.getElementById('parcelsDecadingInterval').value = data.PARCEL_DECADING_INTERVAL;

    document.getElementById('randomlyMovingAgents').value = data.RANDOMLY_MOVING_AGENTS;
    document.getElementById('randomlyAgentSpeed').value = data.RANDOM_AGENT_SPEED;

    document.getElementById('agentsObservationDistance').value = data.AGENTS_OBSERVATION_DISTANCE;
    document.getElementById('parcelsObservationDistance').value = data.PARCELS_OBSERVATION_DISTANCE;

    })
    .catch(error => { console.error('It occures an error:', error); });
}

export{newRoom}


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
    document.body.removeChild(modalDiv);
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

/* request a new Room */
function requestNewRoom(token_admin){

  const mapFile = document.getElementById('mapFile').value;                                     // Get the value from the different input of the form
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
  
  const formData = {                                                // Create an object with all the input value
  
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

  fetch(`/api/rooms`, {                                             // Make the request for a new room
    method: 'POST',
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
    location.reload()
  })
  .catch(error => {
    console.error('Si è verificato un errore:', error);
  });
}


