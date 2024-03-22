async function requestMatch(){
    // Ask the list of the matchs
    try {
        const response = await fetch('/api/matchs', {
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
            data.matches.forEach((match, index) => {
                // for each element add a id, description, delete button and play button
                
                let divMatch = document.createElement('div'); 
                divMatch.classList = 'div-match';

                let idMatch = document.createElement('div');          
                idMatch.classList = 'id-match';
                idMatch.textContent = match;
    
                let descriptionMatch = document.createElement('div');          
                descriptionMatch.classList = 'description-match';
                descriptionMatch.textContent = getStatusText(data.status[index]);

                divMatch.appendChild(idMatch);
                divMatch.appendChild(descriptionMatch);

                if(data.status[index] != 'end'){
                    let joinButton = document.createElement('button');
                    joinButton.classList.add('join-button');
                    joinButton.setAttribute('match', match);
                    joinButton.textContent = `join`;
                    joinButton.addEventListener('click',sendRequestJoinMatch)
                    
                    let deleteButton = document.createElement('button');
                    deleteButton.classList.add('delete-button');
                    deleteButton.setAttribute('match', match);
                    deleteButton.textContent = `X`;
                    deleteButton.addEventListener('click',deleteMatch)
                    
                    let playButton = document.createElement('button');
                    playButton.classList.add('play-stop-button');
                    playButton.setAttribute('match', match);
                    playButton.textContent = getStatusButtonText(data.status[index]);
                    playButton.addEventListener('click',sendPlayStopMatch)

                    divMatch.appendChild(joinButton);
                    divMatch.appendChild(deleteButton);
                    divMatch.appendChild(playButton);
                }else{
                    let viewResultButton = document.createElement('button');
                    viewResultButton.classList.add('view-result-button');
                    viewResultButton.setAttribute('match', match);
                    viewResultButton.textContent = 'view result';
                    viewResultButton.addEventListener('click',sendRequestJoinMatch)

                    divMatch.appendChild(viewResultButton);
                }                

                container.appendChild(divMatch);
            });
    
        }else{
            let container = document.getElementById('match-container')
            data.matches.forEach((match) => {                    // for each element add a button
                let button = document.createElement('button');
                button.classList.add('partecipaBtn');
                button.setAttribute('match', match);
                button.textContent = `Join Match ${match}`;
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
    if (status === 'play') return 'Match in active';
    if (status === 'stop') return 'Match is pause';
    if (status === 'end') return 'Match is end';
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

    fetch(`/api/matchs/${matchId}`, {
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

        // Update the description
        const descriptionElement = event.target.parentElement.querySelector('.description-match')
        descriptionElement.textContent = getStatusText(event.target.textContent);

        // Update the botton
        event.target.textContent = getStatusButtonText(event.target.textContent)

      })
      .catch(error => {
        console.error('An error occurred:', error.message);
      });
    
}


function deleteMatch(event){

    const token_admin = getAdminCookie();
    const matchId = event.target.getAttribute('match');

    fetch(`/api/matchs/${matchId}`, {
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