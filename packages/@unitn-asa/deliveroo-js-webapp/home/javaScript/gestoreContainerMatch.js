defineContainerMatch()

function defineContainerMatch(){
    let container = document.getElementById('match-container')

    // Ask the list of the matchs
    fetch('/api/matchs', {
        method: 'get',
        headers: {
          'Content-Type': 'application/json'
        },
    })
        .then(response => response.json())
        .then(data => {
            console.log(data)
            data.data.forEach((match) => {                    // for each element add a button
                let button = document.createElement('button');
                button.classList.add('partecipaBtn');
                button.setAttribute('match', match);
                button.textContent = `Join Match ${match}`;
                button.addEventListener('click',sendRequestJoinMatch)
                
                // Aggiungi il bottone al container
                container.appendChild(button);
            });
        })
        
        .catch(error => {
            console.error('Error:', error);
        });

}


function sendRequestJoinMatch(event){
    
    var url = 'game';
    url += '?match=' + encodeURIComponent(event.target.getAttribute('match')); 

    console.log("go to match: ", event.target.getAttribute('match'))

    window.location.href = url; 
}