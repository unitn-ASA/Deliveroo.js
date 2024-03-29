/* The File contain some Global function that are called from different part of the home page and for this reason they must be global */

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
        if (!response.ok) {
            throw new Error('Errore durante il caricamento delle mappe');
        }
        return response.json();
    })
    .then(data => {

        // Genera la rappresentazione grafica delle mappe
        data.forEach((map) => {
            mapListDiv.innerHTML += '<div><div class="map-title">' +
                `<h3>${map.name}</h3>` +
                `<span class="returnButton" onclick="selectMap(\'${map.name}\')">Select</span>` +
                '</div>' + generateMapRepresentation(map.map) + '</div>'; // Supponendo che la chiave matrix contenga la matrice della mappa
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
    closeSpan.onclick = function() {
        closeMapList();
    };
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



/* -------------------------------- FUNCTIONS for the menage of the OBSERVATION DISTANCE input o the new Match Form --------------------------*/
//function to set to infinity the range observation input   
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


/* -------------------------------- FUNCTIONS to MEANGE ADMIN COOKIE --------------------------*/
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

function deleteAdminCookie() {
    document.cookie = 'admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}
