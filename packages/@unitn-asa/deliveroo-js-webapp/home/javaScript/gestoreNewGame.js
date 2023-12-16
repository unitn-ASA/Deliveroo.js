document.getElementById('createGameButton').addEventListener('click', function() {
    document.getElementById('gameFormContainer').style.display = 'block';
});
  
document.getElementsByClassName('close')[0].addEventListener('click', function() {
    document.getElementById('gameFormContainer').style.display = 'none';
});
  
// Chiudi il form pop-up cliccando al di fuori del contenuto
window.addEventListener('click', function(event) {
    if (event.target == document.getElementById('gameFormContainer')) {
      document.getElementById('gameFormContainer').style.display = 'none';
    }
});




/* Gestione Invio Settaggi */

var agentsObservationDistance =''
var parcelsObservationDistance =''

document.getElementById('gameForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Impedisce l'invio del form predefinito
    
    // Ottieni i valori dai campi del form
    const mapFile = document.getElementById('mapFile').value;

    const parcelsInterval = document.getElementById('parcelsInterval').value;
    const parcelsMax = document.getElementById('parcelsMax').value;
    const parcelsRewardAvg = document.getElementById('parcelsRewardAvg').value;
    const parcelsRewardVariance = document.getElementById('parcelsRewardVariance').value;
    const parcelsDecadingInterval = document.getElementById('parcelsDecadingInterval').value;

    const randomlyMovingAgents = document.getElementById('randomlyMovingAgents').value;
    const randomlyAgentSpeed = document.getElementById('randomlyAgentSpeed').value;

    if(agentsObservationDistance != 'infinite'){
      agentsObservationDistance = document.getElementById('agentsObservationDistance').value;
    }

    if(parcelsObservationDistance != 'infinite'){
      parcelsObservationDistance = document.getElementById('parcelsObservationDistance').value;
    }
    
  
    // Crea un oggetto con i dati del form
    const formData = {
      MAP_FILE: mapFile,

      PARCELS_GENERATION_INTERVAL: parcelsInterval,
      PARCELS_MAX: parseInt(parcelsMax),
      PARCEL_REWARD_AVG: parseInt(parcelsRewardAvg),
      PARCEL_REWARD_VARIANCE: parseInt(parcelsRewardVariance),
      PARCE_DECADING_INTERVALL: parcelsDecadingInterval,

      RANDOMLY_MOVING_AGENTS: parseInt(randomlyMovingAgents),
      RANDOM_AGENT_SPEED: randomlyAgentSpeed,

      AGENTS_OBSERVATION_DISTANCE: agentsObservationDistance,
      PARCELS_OBSERVATION_DISTANCE: parcelsObservationDistance

    };
  
    // Effettua la richiesta POST utilizzando fetch
    fetch('/games', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    })
    .then(response => {
      // Gestisci la risposta dal server
      if (response.ok) {
        // Fai qualcosa se la richiesta ha avuto successo
        console.log('Dati inviati con successo al server: ');
      } else {
        // Fai qualcosa se la richiesta ha fallito
        console.error('Errore durante l\'invio dei dati al server.');
      }
    })
    .catch(error => {
      // Gestisci gli errori di rete o altri errori
      console.error('Si è verificato un errore:', error);
    });
});


//Funzioni per Input Osserabili
function setInfinity(Oss) {
  const inputContainer = document.getElementById('inputContainer'+Oss);
  const textContainer = document.getElementById('textContainer'+Oss);
  inputContainer.style.display = 'none';
  textContainer.style.display = 'block';
  if(Oss == 'Agent') agentsObservationDistance = 'infinite';
  if(Oss == 'Parcels') parcelsObservationDistance = 'infinite';
}

function returnToInput(Oss) {
  const inputContainer = document.getElementById('inputContainer'+Oss);
  const textContainer = document.getElementById('textContainer'+Oss);
  inputContainer.style.display = 'block';
  textContainer.style.display = 'none';
  if(Oss == 'Agent') agentsObservationDistance = '';
  if(Oss == 'Parcels') parcelsObservationDistance = '';
}