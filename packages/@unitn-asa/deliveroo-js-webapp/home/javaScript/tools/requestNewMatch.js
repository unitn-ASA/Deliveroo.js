import { showConfirmationPopup } from './showCofirmationPopup.js'

/* REQUEST NEW MATCH IN A ROOM */
function requestNewMatch(roomId, token_admin){

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
      if (response.ok) {
        return response.json(); 
      } else {
        throw new Error('Errore durante l\'invio dei dati al server.');
      }
    })
    .then(data => {
      console.log('Dati sucsessfully sended to server: ');
      let matchForm = document.getElementById('matchFormContainer')
      document.body.removeChild(matchForm)                      // delete the new match form
      
      showConfirmationPopup(data.id, data.config, data.map);    // add confirmation new match pop-up
    })
    .catch(error => {
      console.error('Si è verificato un errore:', error);
    });
}

export{requestNewMatch}