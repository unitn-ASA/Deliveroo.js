import { forEach } from '../../../../levels/maps/challenge_21.js';
import { goToMatch } from './deliveroo.js';
var params = new URLSearchParams(window.location.search);

allertAskName();


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//--------------------------------------------------- FUNZIONI -----------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// menage the allert 
function allertAskName() {

    var popupDivScreen = document.createElement('div');       // crate the div for the allert
    popupDivScreen.id = 'allertAskName';
    popupDivScreen.classList = 'allertPopUpScreen';

    var popupDiv = document.createElement('div');       // crate the div for the allert
    popupDiv.classList = 'allertPopUp';

    var title = document.createElement('h2');           
    title.innerText = 'Agent Login';
    title.classList = 'h2Allert';

    // Aggiungi gli elementi al form
    popupDiv.appendChild(title);
    
    let cookies = getAllCookies();
    var cookiesContainer = document.createElement('div'); 
    cookiesContainer.setAttribute('id','cookiesContainer')

    console.log(cookies);
    for(let cookie in cookies){
        //console.log(cookie)
        let cookieDiv = createCookieDiv(cookie, cookies[cookie], false)
        cookiesContainer.appendChild(cookieDiv);
    }
    // Aggiungi il form al popupDiv
    popupDiv.appendChild(cookiesContainer);

    // form new agent
    var form = document.createElement('form');
    form.classList = 'form-add-agent';

    var nameInput = document.createElement('input');    // input name
    nameInput.setAttribute('id', 'nameInput');
    nameInput.type = 'text';
    nameInput.name = 'name';
    nameInput.placeholder = 'Name/Token';
    nameInput.style.marginRight = '10px'; 

    var teamInput = document.createElement('input');    // input team
    teamInput.setAttribute('id', 'teamInput');
    teamInput.type = 'text';
    teamInput.name = 'team';
    teamInput.placeholder = 'Team';
    teamInput.style.marginRight = '10px'; 

    var submitButton = document.createElement('button'); // create button
    submitButton.setAttribute('id', 'addButton');
    submitButton.type = 'submit';
    submitButton.textContent = 'Submit';

    form.appendChild(nameInput);
    form.appendChild(teamInput);
    form.appendChild(submitButton);

    // Menage the submit action
    form.addEventListener('submit', function(event) {
        event.preventDefault(); 
        addAgent(); 
    });

    popupDiv.appendChild(form);
    popupDivScreen.appendChild(popupDiv)
    document.body.appendChild(popupDivScreen);
}


async  function addAgent() {

    let inputTeam = document.getElementById('teamInput');
    let inputName = document.getElementById('nameInput');
    
    let name = inputName.value;
    let team = inputTeam.value;

    let cookiesContainer = document.getElementById('cookiesContainer')
        
    //check if the name is a name or a token 
    if(verificaTokenOrNome(name, team)=='Nome'){
        let token = checkCookieForToken(name, team )    //chek if the browser has already a token associeted with the name

        // se il browser non contiene un token per il nome ne richiede uno
        if(token == ""){
            console.log("No existing token for the name entered, here is a new token");
            token = await richiediToken(name, team);     // ask a new token  
            
            // add a new cookie for the now token
            setCookie( 'token_'+name+'_'+team, token, 365 );
            let cookieDiv = createCookieDiv('token_'+name+'_'+team, token)
            cookiesContainer.appendChild(cookieDiv);                         
        }else{
            console.log("Welcome back the browser has this token for you");
        }
        
    }else{
        let cookieDiv = createCookieDiv('', name, true)
        cookiesContainer.appendChild(cookieDiv);
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
    console.log(name);
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

function getAllCookies() {
    let cookies = document.cookie.split(';');
    let cookiesObject = {};
    
    if(cookies != ''){                              // make the action only if there are cookies
        cookies.forEach(function(cookie) {
            let parts = cookie.split('=');
            let name = parts[0].trim();
            let token = parts[1];
            cookiesObject[name] = token;
        });
    }
    
    return cookiesObject;
}

// Funzione per eliminare un cookie
function deleteCookie(name) {
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}

function createCookieDiv(cookieName, cookieToken, onlyToken) {

    let cookieDiv = document.createElement('div');          // Create a new div to visualize the cookie
    cookieDiv.classList.add('cookie-container');

    let nameTeam = document.createElement('div');
    nameTeam.classList.add('name-team');

    let nameSpan = document.createElement('span');          // Add the name of the cookie
    let teamSpan = document.createElement('span');          // Add the team of the cookie
    nameSpan.classList.add('name-span');
    teamSpan.classList.add('team-span');
    
    if(onlyToken){
        let sliceToken = cookieToken.substring(0, 10);
        nameSpan.textContent = sliceToken+'...';
    }else{
        let displayName = cookieName.replace('token_', '');     // Extract the name without 'token_'
        let parts = displayName.split('_');
        let name = parts[0].trim();
        let team = parts[1];

        if(name.length >= 10){name = name.substring(0, 10)+'...'};
        if(team.length >= 10){team = team.substring(0, 10)+'...'};

        team = '(' + team + ')';

        nameSpan.textContent = name;  
        teamSpan.textContent = team;
    }

    nameTeam.appendChild(nameSpan);
    nameTeam.appendChild(teamSpan);

    cookieDiv.appendChild(nameTeam);

    var copyButton = document.createElement('button');    // Create a button to eliminate the cookie 
    copyButton.textContent = 'Copy';
    copyButton.classList.add('copy-button');
    copyButton.addEventListener('click', function() {
        console.log("COPY")
        copyToClipboard(cookieToken);
    });
    cookieDiv.appendChild(copyButton);
    
    let deleteButton = document.createElement('button');    // Create a button to eliminate the cookie 
    deleteButton.textContent = 'X';
    deleteButton.classList.add('delete-button');
    deleteButton.addEventListener('click', function() {
        deleteCookie(cookieName);                             // Call the function to eliminate the cookie
        cookieDiv.parentNode.removeChild(cookieDiv);          // Rimuve the cookie div
    });
    cookieDiv.appendChild(deleteButton);

    let joinButton = document.createElement('button');    // Create a button to eliminate the cookie 
    joinButton.textContent = 'Join';
    joinButton.addEventListener('click', function() {
        goToMatchWrap(params.get("match"), cookieToken);
    });
    cookieDiv.appendChild(joinButton);
      
    return cookieDiv;
}

function copyToClipboard(text) {
    var tempInput = document.createElement('textarea');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
}

function checkCookieForToken ( name, team ) {
    let token = getCookie( 'token_'+name+'_'+team );
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

function closePopup() {
    var popupDiv = document.getElementById('allertAskName');
    if (popupDiv) {
        popupDiv.remove();
    }
}

function goToMatchWrap(match,token){
    closePopup()                           // chiudi il pop-up di allert
    goToMatch(match,token)       // fai partire il gioco
}




