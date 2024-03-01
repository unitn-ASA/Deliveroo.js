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
            data.data.forEach((match) => {
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
                playButton.textContent = `Play`;
                playButton.addEventListener('click',sendRequestJoinMatch)
                
                divMatch.appendChild(idMatch);
                divMatch.appendChild(descriptionMatch);
                divMatch.appendChild(deleteButton);
                divMatch.appendChild(playButton);

                container.appendChild(divMatch);
            });
    
        }else{
            let container = document.getElementById('match-container')
            data.data.forEach((match) => {                    // for each element add a button
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


function deleteMatch(event){
    console.log('delete match');
}