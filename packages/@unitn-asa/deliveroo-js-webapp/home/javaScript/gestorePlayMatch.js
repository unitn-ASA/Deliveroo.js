const partecipaBtn = document.getElementsByClassName('partecipaBtn');

document.getElementById('formPrivateMatch').addEventListener('submit', function(event) {
    event.preventDefault();                                     // Evita il comportamento di default del form: refresh della pagina

    const inputValue = document.getElementById('matchId').value;                    // Ottiene il valore inserito nell'input
    document.getElementById('formPrivateMatch').setAttribute('match', inputValue);  // Imposta il valore come attributo 'match' del form

    sendRequestJoinMatch(event)
});

Array.from(partecipaBtn).forEach(bottone => {
    bottone.addEventListener('click', sendRequestJoinMatch);
});


function sendRequestJoinMatch(event){

    var url = 'game';
    url += '?match=' + encodeURIComponent(event.target.getAttribute('match')); 

    window.location.href = url; 
}