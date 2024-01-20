import { goToMatch } from './deliveroo.js';
var params = new URLSearchParams(window.location.search);

allertAskName();


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//--------------------------------------------------- FUNZIONI SECONDARIE -----------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// funzione che gestisce la parte html dell'allert
function allertAskName() {

    // Crea il div del popup
    var popupDiv = document.createElement('div');
    popupDiv.id = 'allertAskName';
    popupDiv.classList = 'allertPopUp';

    var title = document.createElement('h2');
    title.innerText = 'Agent Login';
    title.classList = 'h2Allert';

    // Crea il form all'interno del popupDiv
    var form = document.createElement('form');
    form.classList = 'formAllert';
    form.id = "formUnico";

    var label = document.createElement('label');
    label.textContent = 'Enter your Agent Name:';
    label.classList='labelAllert';

    var input = document.createElement('input');
    input.type = 'text';
    input.id = 'nameInput';
    input.classList='inputAllert';

    var button = document.createElement('button');
    button.id = "buttonSubmit"
    button.textContent = 'Submit';
    button.type = 'button';
    button.onclick = submitName;
    button.classList="buttonAllert";

    // Aggiungi gli elementi al form
    form.appendChild(title);
    form.appendChild(label);
    form.appendChild(input);
    form.appendChild(button);

    // Aggiungi il form al popupDiv
    popupDiv.appendChild(form);

    // Aggiungi il popupDiv al corpo del documento
    document.body.appendChild(popupDiv);
}

function closePopup() {
    var popupDiv = document.getElementById('allertAskName');
    if (popupDiv) {
        popupDiv.remove();
    }
}

async  function submitName() {
    var input = document.getElementById('nameInput').value;
    var form = document.getElementById("formUnico");
    
    //controllo se l'input inserito è un token o un nome 
    if(verificaTokenOrNome(input)=='Nome'){

        // rimuovo il bottone submit 
        let button = document.getElementById("buttonSubmit")
        form.removeChild(button);

        var token = checkCookieForToken( input )    // controllo se il browser ha un token salvato per l'utente

        // definisco i vari div per mostrare a schermo il token
        var resultToken = document.createElement('div');
        var tokenDiv = document.createElement('div');
        tokenDiv.id ="tokenBox";
        var tokenMessage = document.createElement('div');
        var space = document.createElement('div');
        space.style.height = '20px';

        // se il browser non contiene un token per il nome ne richiede uno
        if(token == ""){
            tokenMessage.innerText = "Nessun token esistente per il nome inserito, ecco qui un nuovo token";
            token = await richiediToken(input);     // richiedi un nuovo token per nome input
                        
        }else{
            tokenMessage.innerText = "Ben tornato il browser ha questo token per tè" 
        }

        tokenDiv.innerText = token;
        setCookie( 'token_'+input, token, 365 );

        resultToken.appendChild(space);
        resultToken.appendChild(tokenMessage);
        resultToken.appendChild(tokenDiv);

        form.appendChild(resultToken);

        console.log("goToMatch parameters: \n\t match: " + params.get("match") + "\n\t name: " + input + "\n\t token" + token );     
        
        // Aggiungo un nuovo bottone che permette l'effettivo accesso al gioco 
        var newButton = document.createElement('button');
        newButton.textContent = 'Join Match';
        newButton.onclick = function() { goToMatchWrap(params.get("match"), input, token); }
        newButton.classList="buttonAllert";

        form.appendChild(newButton)

    }else{

        verificaTokenOrNome(input)=='Token';
        goToMatchWrap(params.get("match"), "NaN", input)
    }
    
}

function verificaTokenOrNome(input) {

    if (input.length >= 20 ) {
        return 'Token';
    }else{
        return 'Nome';
    }

}

function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    let name = cname + "=";
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
    return "";
}

function checkCookieForToken ( name ) {
    let token = getCookie( 'token_'+name );
    if ( token == "" || token == null ) {
        return ""
    } else {
        return token
    }
}

function richiediToken(nome, callback) {
    return new Promise((resolve, reject) => {

        console.log("Nome fetch: " + nome);

        fetch('/token', {
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
            throw new Error(`Errore nella generazione del token, Codice di stato: ${response.status}`);
        })
        .then(data => {
            console.log("token ottenuto: " + data.token);
            resolve(data.token);
        })
        .catch(error => {
            console.error('Si è verificato un errore:', error);
            reject('Nessun token disponibile al momento.');
        });
    });
}

function goToMatchWrap(match,name,token){
    closePopup()                    // chiudi il pop-up di allert
    goToMatch(match,name,token)     // fai partire il gioco
}




