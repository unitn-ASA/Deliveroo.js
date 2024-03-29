import { Color } from 'three';
import { goToMatch } from './deliveroo.js';
var params = new URLSearchParams(window.location.search);

console.log(params)
if (!params.has('room')) {
    params.append('room', '0');
}
console.log(params)

allertAskName();


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//--------------------------------------------------- FUNCTIONS -----------------------------------------------------------------------
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

    // Add all the element to the form
    popupDiv.appendChild(title);
    
    let cookies = getAllCookies();
    var cookiesContainer = document.createElement('div'); 
    cookiesContainer.setAttribute('id','cookiesContainer')

    //console.log(cookies);
    for(let cookie in cookies){
        //console.log(cookie)
        let cookieDiv = createCookieDiv(cookie, cookies[cookie])        // call the function that create the html element for the cookie 
        if(cookieDiv) { cookiesContainer.appendChild(cookieDiv); }      // if the creation of the html go right we add it to the cookiesContainer element
    }
    // Aggiungi il form al popupDiv
    popupDiv.appendChild(cookiesContainer);

    // form new agent
    var form = document.createElement('form');
    form.classList = 'form-add-agent';

    var inputDiv = document.createElement('div');
    inputDiv.classList = 'inputs';

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

    inputDiv.appendChild(nameInput);        inputDiv.appendChild(teamInput);

    var submitButton = document.createElement('button'); // create button
    submitButton.setAttribute('id', 'addButton');
    submitButton.type = 'submit';
    submitButton.textContent = 'Submit';

    form.appendChild(inputDiv);
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


async function addAgent() {

    let inputTeam = document.getElementById('teamInput');
    let inputName = document.getElementById('nameInput');
    
    let name = inputName.value;
    let team = inputTeam.value;

    let cookiesContainer = document.getElementById('cookiesContainer')

    let response = await richiediToken(name, team);     // ask a new token  
    //console.log(response);
    
    // try to save the new token in the cookie, in case add the div element
    let cookieName = setCookie( response, 365 );
    if(cookieName){  
        let cookieDiv = createCookieDiv(cookieName, response.token)
        cookiesContainer.appendChild(cookieDiv);
    }

}

//////////////////////////////////////////////////
/* -- Function for the menage of the cookies -- */
//////////////////////////////////////////////////
function setCookie(response, exdays) {

    // define the name of the cookie
    let cname = 'token_' + response.id + '_'+ response.name + '_' + response.teamId + '_' +response.teamName

    // first verify that the browser don't have already the cookie 
    let alreadyPresentToken = getCookie( cname );
    if ( alreadyPresentToken ) { console.log('cookie already saved in the browser'); return false }

    const d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires="+d.toUTCString();
    
    document.cookie = cname + "=" + response.token + ";" + expires + ";path=/";
    return cname;
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

    return false;
}

function getAllCookies() {
    let cookies = document.cookie.split(';');
    let cookiesObject = {};
    
    if(cookies != ''){                              // make the action only if there are cookies
        cookies.forEach(function(cookie) {
            let parts = cookie.split('=');
            let name = parts[0].trim();
            let token = parts[1];

            // check if the cookie starts with "token_"
            if (name.startsWith('token_')) {
                cookiesObject[name] = token;
            }
           
        });
    }
    
    return cookiesObject;
}

function deleteCookie(name) {
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}

function createCookieDiv(cookieName, cookieToken) {

    let cookieDiv = document.createElement('div');          // Create a new div to visualize the cookie
    cookieDiv.classList.add('cookie-container');

    // the full name is the union of the agent id, name and team id, name of the cookie
    let AgentTeam = document.createElement('div');
    AgentTeam.classList.add('agent-team');

    let agentDiv = document.createElement('div');        // Add agent info of the cookie
    let teamDiv = document.createElement('div');         // Add team info of the cookie
    agentDiv.classList.add('info-div');
    teamDiv.classList.add('info-div');


    let idSpan = document.createElement('span');          // Add the agent id of the cookie
    let nameSpan = document.createElement('span');        // Add the agent name of the cookie
    let teamIdSpan = document.createElement('span');      // Add the team id of the cookie
    let teamNameSpan = document.createElement('span');    // Add the team name of the cookie
    
    nameSpan.classList.add('name-span');
    teamNameSpan.classList.add('name-span')
    idSpan.classList.add('id-span');
    teamIdSpan.classList.add('id-span');
    
    // divide the cookie name in parts splitting it at '_'; that from the part define the texts for the d
    let parts = cookieName.split('_');

    // check that the part are 5, if not the name of the cookie has a wronk structure, so we are not enable to show it 
    if(parts.length != 5){ console.log(cookieName + ' ha a wrong structure, unable to show'); return false; }

    let idSpanText = parts[1].trim();              
    let nameSpanText = parts[2].trim();             if(nameSpanText.length > 10){nameSpanText = nameSpanText.substring(0, 10)+'...'};
    let teamIdSpanText = parts[3].trim();           
    let teamNameSpanText = parts[4].trim();         if(teamNameSpanText.length > 10){teamNameSpanText = teamNameSpanText.substring(0, 10)+'...'};

    // put the id element inside () for extetic scope
    idSpanText = '(' + idSpanText + ')';            teamIdSpanText = '(' + teamIdSpanText + ')';

    // check if the teamName is false; so the agent has no team; in this case the html element change a little
    if(teamNameSpanText === 'false'){
        teamNameSpanText = 'no team';
        teamIdSpanText = ''
        teamNameSpan.style.color = 'red';
    }

    // put the extracted text inside the html elements
    idSpan.textContent = idSpanText;                nameSpan.textContent = nameSpanText;   
    teamIdSpan.textContent = teamIdSpanText;        teamNameSpan.textContent = teamNameSpanText; 

    // include all the element in the corrispondending father elements
    agentDiv.appendChild(nameSpan);                 agentDiv.appendChild(idSpan);   
    teamDiv.appendChild(teamNameSpan);              teamDiv.appendChild(teamIdSpan);
    AgentTeam.appendChild(agentDiv);                AgentTeam.appendChild(teamDiv);
    cookieDiv.appendChild(AgentTeam);

    // Now define the buttons
    let buttonsDiv = document.createElement('div');
    buttonsDiv.classList.add('buttons');

    var copyButton = document.createElement('button');    // Create a button to copy the cookie 
    copyButton.textContent = 'Copy';
    copyButton.classList.add('copy-button');
    copyButton.addEventListener('click', function() {
        //console.log("COPY: ",cookieToken)
        copyToClipboard(cookieToken);
    });
    buttonsDiv.appendChild(copyButton);
    
    let deleteButton = document.createElement('button');    // Create a button to eliminate the cookie 
    deleteButton.textContent = 'X';
    deleteButton.classList.add('delete-button');
    deleteButton.addEventListener('click', function() {
        deleteCookie(cookieName);                             // Call the function to eliminate the cookie
        cookieDiv.parentNode.removeChild(cookieDiv);          // Rimuve the cookie div
    });
    buttonsDiv.appendChild(deleteButton);

    let joinButton = document.createElement('button');    // Create a button to join the match with the token of the cookie 
    joinButton.textContent = 'Join';
    joinButton.addEventListener('click', function() {
        goToMatchWrap(params.get("room"), cookieToken);
    });
    buttonsDiv.appendChild(joinButton);

    cookieDiv.appendChild(buttonsDiv);
      
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



function richiediToken(nome, team, callback) {
    return new Promise((resolve, reject) => {

        console.log("Nome fetch: ", nome + " team fetch: ", team);

        fetch('/api/token', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'name': nome,
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
            resolve(data);
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

function goToMatchWrap(roomId, token){
    closePopup()                    // chiudi il pop-up di allert
    goToMatch(roomId, token)       // fai partire il gioco
}




