const generateTokenBtn = document.getElementById('generateTokenBtn');
const copyTokenBtn = document.getElementById('copyTokenBtn');
const tokenBox = document.getElementById('tokenBox');
const nomeInput = document.getElementById('nome');

generateTokenBtn.addEventListener('click', function() {

    // Prendo e controllo il nome inserito
    const nome = nomeInput.value.trim();
    if (nome === '') {
        nomeInput.classList.add('error');
        return;
    }
    nomeInput.classList.remove('error');


    fetch('token', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'nome': nome
        }
   
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Errore nella generazione del token');
    })
    .then(data => {
        // Mostra il token ricevuto nel riquadro
        tokenBox.textContent = data.token; // Supponendo che il token ricevuto sia nel campo 'token'
        addCopyTokenButton();
    })
    .catch(error => {
        console.error('Si è verificato un errore:', error);
        // In caso di errore, mostra un messaggio appropriato o mantieni il riquadro vuoto
        tokenBox.textContent = 'Nessun token disponibile al momento.';
        addCopyTokenButton();
    });
});


// Funzione per aggiungere il pulsante "Copia Token" dopo il pulsante "Genera Token"
function addCopyTokenButton() {
    copyTokenBtn.style.display = 'inline-block'; // Mostra il bottone "Copia Token"

    copyTokenBtn.addEventListener('click', function() {
        const tempInput = document.createElement('input');
        tempInput.value = tokenBox.textContent.trim(); // Copia il testo del token
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        alert('Token copiato negli appunti!');
    });

    generateTokenBtn.insertAdjacentElement('afterend', copyTokenBtn);
}