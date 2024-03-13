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
                descriptionMatch.textContent = 'description';
                
                let deleteButton = document.createElement('button');
                deleteButton.classList.add('delete-button');
                deleteButton.setAttribute('match', match);
                deleteButton.textContent = `X`;
                deleteButton.addEventListener('click',deleteMatch)
                
                let playButton = document.createElement('button');
                playButton.setAttribute('match', match);
                playButton.textContent = data.status[index];
                playButton.addEventListener('click',sendPlayStopMatch)
                
                divMatch.appendChild(idMatch);
                divMatch.appendChild(descriptionMatch);
                divMatch.appendChild(deleteButton);
                divMatch.appendChild(playButton);

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
    
    var url = 'game';
    url += '?match=' + encodeURIComponent(event.target.getAttribute('match')); 

    console.log("go to match: ", event.target.getAttribute('match'))

    window.location.href = url; 
}

function sendPlayStopMatch(event){
    
    const token_admin = getAdminCookie();
    const matchId = event.currentTarget.getAttribute('match');

    if(event.currentTarget.textContent == 'play'){
        event.currentTarget.textContent = 'stop'
    }else if(event.currentTarget.textContent == 'stop'){
        event.currentTarget.textContent = 'play'
    }else{
        // if the match is not in stop play status there is some error, so we remove the click event and end the function
        event.currentTarget.removeEventListener('click', sendPlayStopMatch);
        return
    }

    let newStatus = event.currentTarget.textContent;
    console.log('Cange staus match ', matchId + ' to ', newStatus);

    fetch(`/api/matchs/${matchId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${token_admin}`
        },
        body: JSON.stringify({ id: matchId, status: newStatus }) // Invia l'ID del match e il nuovo stato
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
      })
      .catch(error => {
        console.error('An error occurred:', error.message);
      });
    
}


function deleteMatch(event){
    console.log('delete match');
}