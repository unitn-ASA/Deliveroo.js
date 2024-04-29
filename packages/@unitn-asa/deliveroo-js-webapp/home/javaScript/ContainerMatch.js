async function requestMatch(){
    // Ask the list of the matches
    try {
        const response = await fetch('/api/matches', {
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

async function defineContainerMatch(admin){
    try {
        var data = await requestMatch();
        console.log(data);
        
        if(admin){
            let container = document.getElementById('match-container-admin')
            data.forEach((match, index) => {
                // for each element add a id, description, delete button and play button
                
                let divMatch = document.createElement('div'); 
                divMatch.classList = 'div-match';

                let idMatch = document.createElement('div');          
                idMatch.classList = 'id-match';
                idMatch.textContent = match.id;
    
                let descriptionMatch = document.createElement('div');          
                descriptionMatch.classList = 'description-match';

                let joinButton = document.createElement('button');
                joinButton.classList.add('join-button');
                joinButton.setAttribute('match', match.id);
                joinButton.textContent = `join`;
                joinButton.addEventListener('click',sendRequestJoinMatch)
                
                let deleteButton = document.createElement('button');
                deleteButton.classList.add('delete-button');
                deleteButton.setAttribute('match', match.id);
                deleteButton.textContent = `X`;
                deleteButton.addEventListener('click',deleteMatch)
                
                let playButton = document.createElement('button');
                deleteButton.classList.add('play-stop-button');
                playButton.setAttribute('match', match.id);
                playButton.textContent = getStatusButtonText(match.status);
                descriptionMatch.textContent = getStatusText(playButton.textContent);
                playButton.addEventListener('click',sendPlayStopMatch)
                
                divMatch.appendChild(idMatch);
                divMatch.appendChild(descriptionMatch);
                divMatch.appendChild(joinButton);
                divMatch.appendChild(deleteButton);
                divMatch.appendChild(playButton);

                container.appendChild(divMatch);
            });
    
        }else{
            let container = document.getElementById('match-container')
            data.forEach((match) => {                    // for each element add a button
                let button = document.createElement('button');
                button.classList.add('partecipaBtn');
                button.setAttribute('match', match.id);
                button.textContent = `Join Match ${match.id}`;
                button.addEventListener('click',sendRequestJoinMatch)
                
                container.appendChild(button);
            });
        }

    } catch (error) {
        console.error('Error:', error);
    }
    
}


function sendRequestJoinMatch(event){
    
    var url = '/game';
    url += '?match=' + encodeURIComponent(event.target.getAttribute('match')); 

    console.log("go to match: ", event.target.getAttribute('match'))

    window.location.href = url; 
}


function getStatusText(status) {
    if (status === 'play') return 'Match in pause';
    if (status === 'stop') return 'Match is active';
    return 'Undefined status';
}

function getStatusButtonText(status) {
    if (status === 'stop') return 'play';
    if (status === 'play') return 'stop';
    return 'Undefined';
}


function sendPlayStopMatch(event){
    
    const token_admin = getAdminCookie();
    const matchId = event.target.getAttribute('match');
    //console.log(event)

    console.log('Cange staus match ', matchId + ' to ', event.currentTarget.textContent);

    fetch(`/api/matches/${matchId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${token_admin}`
        },
        body: JSON.stringify({ id: matchId}) // Invia l'ID del match e il nuovo stato
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
        event.target.textContent = getStatusButtonText(event.target.textContent)

        // Update the description
        const descriptionElement = event.target.parentElement.querySelector('.description-match')
        descriptionElement.textContent = getStatusText(event.target.textContent);

      })
      .catch(error => {
        console.error('An error occurred:', error.message);
      });
    
}


function deleteMatch(event){

    const token_admin = getAdminCookie();
    const matchId = event.target.getAttribute('match');

    fetch(`/api/matches/${matchId}`, {
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