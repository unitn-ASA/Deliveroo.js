import { showMatchForm } from './tools/showMatchForm.js';
import { requestNewRoom } from './tools/requestNewRoom.js';

function newRoom() {
  const token_admin = getAdminCookie();
  
  // request the default config of the match
  fetch('/api/config', {
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
      showMatchForm();
      document.getElementById('matchFormContainer').style.display = 'block';

      // MENGAE THE SUBMIT ACTION 
      document.getElementById('matchForm').addEventListener('submit', function(event) {
        event.preventDefault(); // Impedisce l'invio del form predefinito
        requestNewRoom(token_admin)
      })

      return data
  })
  .then(data => {
      //console.log(data);
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
  
      document.getElementById('agentsObservationDistance').value = data.AGENTS_OBSERVATION_DISTANCE;
      document.getElementById('parcelsObservationDistance').value = data.PARCELS_OBSERVATION_DISTANCE;

  })
  .catch(error => {
      console.error('It occures an error:', error);
  });
}

export{newRoom}

