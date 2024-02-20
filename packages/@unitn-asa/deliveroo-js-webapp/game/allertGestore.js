import { goToMatch } from './deliveroo.js';
var params = new URLSearchParams(window.location.search);

allertAskName();


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//--------------------------------------------------- FUNZIONI -----------------------------------------------------------------------
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

    // leable e input per il nome 
    var labelName = document.createElement('label');
    labelName.textContent = 'Enter your Agent Name:';
    labelName.classList='labelAllert';

    var inputName = document.createElement('input');
    inputName.type = 'text';
    inputName.id = 'nameInput';
    inputName.classList='inputAllert';
    inputName.required = true;

    //leable e input per il team
    var labelTeam = document.createElement('label');
    labelTeam.textContent = 'Enter Team of your Agent:';
    labelTeam.classList='labelAllert';

    var inputTeam = document.createElement('input');
    inputTeam.type = 'text';
    inputTeam.id = 'teamInput';
    inputTeam.classList='inputAllert';

    // bottone di submit 
    var button = document.createElement('button');
    button.id = "buttonSubmit"
    button.textContent = 'Submit';
    button.type = 'button';
    button.onclick = submitName;
    button.classList="buttonAllert";

    // Aggiungi gli elementi al form
    form.appendChild(title);
    form.appendChild(labelName);
    form.appendChild(inputName);
    form.appendChild(labelTeam);
    form.appendChild(inputTeam);
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

    var inputTeam = document.getElementById('teamInput');
    var inputName = document.getElementById('nameInput');
    var form = document.getElementById("formUnico");

    var input = inputName.value;
    var team = inputTeam.value;
    
    // blocco gli input 
    inputTeam.readOnly = true;
    inputName.readOnly = true;
    
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
            tokenMessage.innerText = "No existing token for the name entered, here is a new token";
            token = await richiediToken(input, team);     // richiedi un nuovo token per nome input
                        
        }else{
            tokenMessage.innerText = "Welcome back the browser has this token for you" 
        }

        tokenDiv.innerText = token;
        setCookie( 'token_'+input, token, 365 );

        resultToken.appendChild(space);
        resultToken.appendChild(tokenMessage);
        resultToken.appendChild(tokenDiv);

        form.appendChild(resultToken);

        console.log("goToMatch parameters: \n\t match: " + params.get("match") + "\n\t name: " + input + "\n\t token: " + token.slice(-30) + "\n\t team: " + team);     
        
        // Aggiungo un nuovo bottone che permette l'effettivo accesso al gioco 
        var newButton = document.createElement('button');
        newButton.textContent = 'Join Match';
        newButton.onclick = function() { goToMatchWrap(params.get("match"), input, token, team); }
        newButton.classList="buttonAllert";

        form.appendChild(newButton)

    }else{

        verificaTokenOrNome(input)=='Token';
        goToMatchWrap(params.get("match"), "NaN", input, team)
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

function richiediToken(nome, team, callback) {
    return new Promise((resolve, reject) => {

        console.log("Nome fetch: " + nome);

        fetch('/token', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'nome': nome,
                'team': team
            }
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error(`Error generating token, Status code: ${response.status}`);
        })
        .then(data => {
            console.log("token ottenuto: " + data.token.slice(-30));
            resolve(data.token);
        })
        .catch(error => {
            console.error('An error occurred:', error);
            reject('No tokens available at the moment');
        });
    });
}

function goToMatchWrap(match,name,token,team){
    closePopup()                           // chiudi il pop-up di allert
    goToMatch(match,name,token,team)       // fai partire il gioco
}




