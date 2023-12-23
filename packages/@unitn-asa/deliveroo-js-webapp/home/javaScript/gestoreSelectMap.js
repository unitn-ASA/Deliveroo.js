function openMapList() {
    var modal = document.getElementById('mapListModal');
    modal.style.display = 'block';

    var mapListDiv = document.getElementById('map-container');
    mapListDiv.innerHTML = '';

    // Effettua una richiesta Fetch per ottenere le mappe dal server
    fetch('/maps', {
        method: 'get',
        headers: {
          'Content-Type': 'application/json'
        },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Errore durante il caricamento delle mappe');
        }
        return response.json();
    })
    .then(data => {

        // Genera la rappresentazione grafica delle mappe
        data.forEach((map) => {
            mapListDiv.innerHTML += '<div><div class="map-title">' +
                `<h3>${map.mapId}</h3>` +
                `<span class="returnButton" onclick="selectMap(\'${map.mapId}\')">Select</span>` +
                '</div>' + generateMapRepresentation(map.matrix) + '</div>'; // Supponendo che la chiave matrix contenga la matrice della mappa
        });
    })
    .catch(error => {
        console.error('Errore:', error);
        // Gestisci l'errore o visualizza un messaggio all'utente in caso di fallimento del caricamento delle mappe
    });
}

// Funzione per chiudere la finestra modale
function closeMapList() {
    var modal = document.getElementById('mapListModal');
    modal.style.display = 'none';
}

function selectMap(mapName) {
    var selectedMapInput = document.getElementById('mapFile'); 
    selectedMapInput.value = mapName;  

    closeMapList();
}