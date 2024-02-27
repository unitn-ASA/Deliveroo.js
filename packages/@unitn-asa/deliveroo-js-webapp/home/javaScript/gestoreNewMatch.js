document.getElementById('createMatchButton').addEventListener('click', function() {
    document.getElementById('matchFormContainer').style.display = 'block';
});
  
document.getElementsByClassName('close')[0].addEventListener('click', function() {
    document.getElementById('matchFormContainer').style.display = 'none';
});
  
// Chiudi il form pop-up cliccando al di fuori del contenuto
window.addEventListener('click', function(event) {
    if (event.target == document.getElementById('matchFormContainer')) {
      document.getElementById('matchFormContainer').style.display = 'none';
    }
});




/* Gestione Invio Settaggi */

var agentsObservationDistance =''
var parcelsObservationDistance =''

document.getElementById('matchForm').addEventListener('submit', function(event) {
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
    
    if (mapFile === '') {
      document.getElementById('mapFile').classList.add('error');
      return;
    }else{
      document.getElementById('mapFile').classList.remove('error');
    }
    

    // Crea un oggetto con i dati del form
    const formData = {
    
      mappa: mapFile,

      parcels_generation_interval: parcelsInterval,
      parcels_max: parseInt(parcelsMax),
      parcel_rewar_avg: parseInt(parcelsRewardAvg),
      parcel_reward_variance: parseInt(parcelsRewardVariance),
      parcel_decading_interval: parcelsDecadingInterval,

      random_mov_agents: parseInt(randomlyMovingAgents),
      random_agent_speed: randomlyAgentSpeed,

      agents_observation_distance: agentsObservationDistance,
      parcels_observation_distance: parcelsObservationDistance,
      movement_duration: 50

    };
  
    // Effettua la richiesta POST utilizzando fetch ---------------------------
    fetch('/matches', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
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
      /* Gestione dei dati ricevuti: chiudo il pop-up di new game e apro uno di conferma 
      creazione che ritorna i dati del game creato -----------------------------------*/
      console.log('Dati inviati con successo al server: ', data.data, data.mappa);
      document.getElementById('matchFormContainer').style.display = 'none';
      showConfirmationPopup(data.id, data.data, data.mappa); 
    })
    .catch(error => {
      // Gestione degli errori
      console.error('Si è verificato un errore:', error);
    });
});


//Funzioni per Input Osservabili
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


// Funzione per configurare il pop-up di conferma creazione nuovo match
function showConfirmationPopup(id, options, mappa) {

  // Creazione degli elementi DOM per il pop-up ----------------------------
  const popup_window = document.createElement('div');
  popup_window.classList.add('modal');

  const popup = document.createElement('div');
  popup.classList.add('modal-content');


  //creo un div per riferire l'id del nuovo match --------------------------
  const title = document.createElement('h3');
  title.innerText='Avviato nuovo match con id:' + id;


  //creo un div per mostrare le opzioni del game ----------------------------
  const optionsList = document.createElement('div');
  optionsList.classList.add('options-list');

  //leggo gli argomenti di options per inserirli nel testo ------------------
  let optionsText = '';
  for (const key in options) {
    if (options.hasOwnProperty(key)) {
      optionsText += `${key}: ${options[key]}\n`;
    }
  }
  optionsList.innerText=optionsText


  //aggiunto la rappresentazione grafica della mappa selezionata ------------ 
  const mapRepresentation = document.createElement('div');
  mapRepresentation.innerHTML= generateMapRepresentation(mappa)


  //aggiungo div di contenimento per rendere gradevole la visualizzazione ----
  const description = document.createElement('div')
  description.appendChild(title)
  description.appendChild(optionsList)

  const mapOptions = document.createElement('div');
  mapOptions.classList.add('map_options');
  mapOptions.appendChild(mapRepresentation);
  mapOptions.appendChild(description)


  //chiusura del pop_up ------------------------------------------------------
  const close = document.createElement('div');
  close.innerText = '✕';
  close.classList.add('close');
  close.addEventListener('click', function() {
    popup_window.style.display = 'none';
  });

  
  // Aggiunta della lista delle opzioni e della rappresentazione della mappa al pop-up
  popup.appendChild(close);
  popup.appendChild(mapOptions);
  

  popup_window.appendChild(popup);
  popup_window.style.display = 'block';

  // Aggiunta del pop-up al body del documento
  document.body.appendChild(popup_window);

}