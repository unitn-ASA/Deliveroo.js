const partecipaBtn = document.getElementById('partecipaBtn');

partecipaBtn.addEventListener('click', function() {
    // Simulazione di una richiesta GET (da sostituire con la tua logica reale)
    fetch('https://api.example.com/partecipa-partita', {
        method: 'GET'
        // Aggiungi altre opzioni come headers, body, etc. se necessario
    })
    .then(response => {
        // Gestione della risposta
        if (response.ok) {
            // Gestisci la risposta positiva
            console.log('Richiesta GET eseguita con successo!');
        } else {
            // Gestisci eventuali errori nella risposta
            console.error('Errore durante la richiesta GET!');
        }
    })
    .catch(error => {
        // Gestione degli errori di rete o altre eccezioni
        console.error('Si è verificato un errore:', error);
    });
});