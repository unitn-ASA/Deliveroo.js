import { Leaderboard } from "./Leaderboard";

var HOST = import.meta.env.VITE_SOCKET_IO_HOST || 'http://localhost:8080';

/* the class is used to menage the right top pannel, wich show the home and login button; timer and leable of match on or off
and contain all the admin part to menage the room */
class Panel{
    roomId;     // the roomId is eccential for execute the different request to the server, for this reason it is saved as an attribute
    game        // reference to the parent object

    // wrap the build function becouse the costructor can not defined as async 
    constructor(roomId, game){ 
        this.roomId = roomId
        this.game = game
        this.build() 
    }
    // the method menage the build of all the panel
    async build(){

        // chack and in case remove the old dasboard and create the new one 
        let rightColum = await document.getElementById('right-colum');
        let panel = await document.getElementById('panel');

        // in the Allert page the right colum is hiden, now we have to make it visible
        rightColum.style.display = 'block'

        //the build is devide between top part and central part, this for a more clear mengae of all the parts
        let topPart = await this.buildTopPart()
        panel.appendChild(topPart)
        
        let centralPart = await this.buildCentralPart();
        panel.appendChild(centralPart)

        const firstChild = rightColum.firstChild;        //obtain the first child of the panel 
        rightColum.insertBefore(panel, firstChild);      //put the admin div as first element

    }

    // the method define the top part of the Pael, it contains the home and login/logout botton 
    async buildTopPart(){

        let topPart = document.createElement('div')

        // create the div home-login 
        const homeLoginDiv = document.createElement('div');
        homeLoginDiv.id = 'home-login-buttons'

        // create the button "Home"
        const homeButton = document.createElement('button');
        homeButton.classList.add('home-button');
        homeButton.id = 'home-button';
        const homeIcon = document.createElement('i');
        homeIcon.classList.add('fas', 'fa-home');
        homeButton.appendChild(homeIcon);

        // define the handle of home and login buttons
        homeButton.addEventListener('click', function() {
            var url = '/home';
            window.location.href = url; 
        });

        // create the button "Login"
        const loginButton = document.createElement('button');
        loginButton.classList.add('login-button');
        loginButton.id = 'loginButton';
        // chack if the browser has already the admin cookies, the result define the style and the text of the button 
        if(getAdminCookie()){ 
            loginButton.textContent = 'Logged';
            loginButton.classList.add('logged');
        }else{
            loginButton.textContent = 'Login';
        }
        
        // open the login form at the press of the login button
        loginButton.addEventListener('click', () => {
            // if the user is already logged as admin, so it's cookies contain the admin cookie, the press of the loginButton esecute the logout
            if(getAdminCookie()){ 
                deleteAdminCookie();                       // delete the admin cookie
                loginButton.classList.remove('logged')     // remove the class loged to the login button for change it style 
                loginButton.innerText = 'Login'            // change also the text of the login button 
                this.updateCentralPart();                  // then the user is not more an admin so we have to update the central part of the panel      
                console.log('LOGOUT ADMIN SUCSESS');            
                return; 
            }
            openORcloseLoginForm(); 
        });

        // define also the handler of the login form
        // close the login form whem the user click the x 
        document.querySelector('#loginHeader button.close-button').addEventListener('click', function() { openORcloseLoginForm();});
        // menage the submit action
        document.getElementById('loginForm').addEventListener('submit', async (event) => {
            event.preventDefault();

            const username = document.getElementById('username-login').value;   // take the username input
            const password = document.getElementById('password-login').value;   // take the password input

            const response = await fetch(HOST+'/api/tokens', {                            // request the login with the given credetials
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success) {                        // if the request is sucsessfull 
                console.log("LOGIN ADMIN SUCSESS")                               
                setAdminCookie(data.token)             // add the token to the cookie 
                this.updateCentralPart();              // then the user is not more a normal one so we have to update the central part of the panel
                loginButton.classList.add('logged')    // add the class loged to the login button for change it style
                loginButton.innerText = 'Logged'       // change also the text of the login button 
                openORcloseLoginForm();                // close the login form
            } else {
                console.log("LOGIN ADMIN ERROR")                                            // if the request is fail, 
                document.getElementById('username-login').classList.add('error');           // show that there is an error in the credentials inputs
                document.getElementById('password-login').classList.add('error');
            }
        });

        // Add the home e login buttons
        homeLoginDiv.appendChild(homeButton);
        homeLoginDiv.appendChild(loginButton);
        topPart.appendChild(homeLoginDiv)

        return topPart;
    }

    /* The method request the status of the room (match,timer and grid) to the server, then based on this information 
    it build the correct central part */
    async buildCentralPart(){

        let centralPart = document.createElement('div'); 
        centralPart.id ='central-part'

        // request the status of the match to the server, based on this information the method can build the correct central part 
        await fetch(`${HOST}/api/rooms/${this.roomId}`, {
            method: 'GET',
            headers: {
            'Content-Type': 'application/json',
            },
        })
        .then(response => {
            if (response.ok) { return response.json(); 
            } else { throw new Error('Error during data sending', response.json()); }
        })
        .then(data => {
            console.log('Correct: matchId', data.matchId + ', match status: ', data.matchStatus + ', grid status: ', data.gridStatus + ' timer status: ', data.timerStatus + ' remaning time: ', data.remainingTime)
            
            // for the real build of the central part it call a specific function based on if the user is admin or not
            if(getAdminCookie()) this.buildAdminCentralPart(centralPart, data)
            else this.buildClientCentralPart(centralPart, data)

            return data; 
        })
        .then(data => {
            if(data.matchStatus == 'on'){
                this.game.leaderboard = new Leaderboard(this.game, this.roomId)       // if the match is active add costruct the leaderbord
            }
        })
        .catch(error => { console.error('An error occurred:', error.message); });

        return centralPart
    }

    /*The method define the central part of the Panel for the admin, it contain a first row with the botton to interct with the grid: change the grid an 
    freeze/ unfreeze. A second row that refers to the timer: the timer counter ( that work also like input ) and the timer button for change
    its status. A possible third row that contain the match id and the button to change the status of the match, this layer exist only if the 
    match is active in the room.The admin central part has also a botton to open the list of agents in the game*/
    buildAdminCentralPart(centralPart, data){

        let token_admin = getAdminCookie()              // take the admin token, it is used during the request to the server ro authentique the client

        // create the div for the GRID PART: change grid buttons and freeze/unfreeze buttons
        let gridButtons = document.createElement('div'); 
        gridButtons.id ='grid-buttons'
        gridButtons.classList.add('admin-row')

        let freezeButton = document.createElement('button');                    //freeze/unfreeze buttons
        freezeButton.id = 'freeze-button';
        freezeButton.classList.add('freeze-button');
        freezeButton.setAttribute('room', this.roomId);                         // save the room id in the buttons, in this way the handler functions can access to it 
        freezeButton.textContent = getStatusGridButtonText(data.gridStatus);    // call an external function for defie the text that depend on the state of the grid
        freezeButton.addEventListener('click', requestFreezeUnfreezeGrid)       // define the handle of the click action    

        let restartButton = document.createElement('button');                   // change grid button
        restartButton.classList.add('change-grid-button');
        restartButton.setAttribute('room', this.roomId);                        // save the room id in the buttons, in this way the handler functions can access to it 
        restartButton.textContent = 'grid'
        restartButton.addEventListener('click',showGridForm)                    // define the handle of the click action   

        gridButtons.appendChild(restartButton);
        gridButtons.appendChild(freezeButton);
        centralPart.appendChild(gridButtons)


        //create the div for the TIMER PART: counter/input timer, timer button for change it status
        const timerContainer = document.createElement('div');
        timerContainer.id = 'timer-container'

        const timerInput = document.createElement('input');     // Create the input for the timer, it work also as counter 
        timerInput.type = 'text';
        timerInput.id ='timer-input'
        // for the value of the input it upload the time coming from the server, if there is one; otherway put it to 00:00
        if(data.remainingTime){         
            let minutes = Math.floor(data.remainingTime / 60);                let seconds = data.remainingTime % 60; 

            let formattedMinutes = minutes < 10 ? `0${minutes}` : minutes; // Add a zero if the minutes are less than 10 
            let formattedSeconds = seconds < 10 ? `0${seconds}` : seconds; // Add a zero if the seconds are less than 10 
        
            timerInput.value = formattedMinutes + ':' + formattedSeconds; // Update the value of input with the pattern __:__  
        }else{
            timerInput.value = '00:00'
        }
        // menage the input of the time value in order to follow the pattern __:__
        timerInput.addEventListener('input', function() {           
            const inputValue = this.value;  
            const maxLength = 4;                                    // the timer go max to 60 minutes

            let numericValue = inputValue.replace(/[^0-9]/g, '');   // remove all the caracters not numbers  
            numericValue = numericValue.slice(-maxLength);          // remove the left value if moe then 4 numbers have been inserted

            const paddedValue = numericValue.padEnd(maxLength, '0');                        // eventualy add 0 to complete the pattern   __:__
            const formattedValue = `${paddedValue.slice(0, 2)}:${paddedValue.slice(2)}`;    // format the input value 
            
            this.value = formattedValue;                            // Update the value of input with the pattern __:__ 
        });
    
        const timerButton = document.createElement('button');   // Create the buttone for change the status of the timer 
        timerButton.id ='timer-button'
        /* Now to define the text of the button we check the status of timer sended by the server, base on it values it also define the 
        attribute 'status' of the button that will be sed for define the action executed on the click of this button.
        Furthermore we also define if the timer input is writable or only readable from the user. */
        if(data.timerStatus === undefined){ 
            timerButton.textContent = 'avvia';                  // if the status is undefined means that the room has a new timer, that is never started
            timerButton.setAttribute('status', 'undefined')     
            timerInput.readOnly = false                         // in this case the user can modify the timer input, so it can decide from wich time the timer shoul start
        }
        else if(data.timerStatus === true){ 
            timerButton.textContent = 'clear';                  // if the status is true means that the room has a running timer
            timerButton.setAttribute('status', 'running')
            timerInput.readOnly = true                          // in this case the user can't modify the timer input that work only like counter
        }
        else if(data.timerStatus === false){ 
            timerButton.textContent = 'resume';                 // if the status is true means that the room has a timer tha is in pause
            timerButton.setAttribute('status', 'waiting')
            timerInput.readOnly = false                         // in this case the user can modify the timer input, so it can decide from wich time the timer shoul restart
        }
        // How said before the action is choosen based on the state of the timer wich is save in it's attribute
        timerButton.addEventListener('click', async (event) => {
            let status = await event.target.getAttribute('status')
            console.log('TIMER BUTTON: status:', status)
    
            // if the timer don't exist the status is undefined. So the button request to start the timer   
            if(status == 'undefined') { 
                let result = await startTimer(token_admin, this.roomId, timerInput);                   
                if(result){                                             // if the result is positive, means that the request go right, and the now the timer is running 
                    event.target.setAttribute('status', 'running');     // so we have to chenge the status saved in the buttons to running,
                    event.target.innerText = 'clear'                    // also the text of the button 
                    timerInput.readOnly  = true;                        // and block the input that now work as counter  
                    this.updateAdminMatchDiv(result, false)             // update the admin match div, put the match id received fromt the server and don't add the exit button
                }
            }
            // if the timer is running the status is true. So the button request to stop the timer 
            else if(status === 'running'){
                let result = await stopTimer(token_admin, this.roomId, timerInput);  
                if(result){                                             // if the result is positive, means that the request go right, and the now the timer is paused
                    event.target.setAttribute('status', 'waiting');     // so we have to chenge the status saved in the buttons to waiting,
                    event.target.innerText = 'resume'                   // also the text of the button
                    timerInput.readOnly  = false;                       // and enable the user to change the timer value for the resume 
                    this.updateAdminMatchDiv(result, true)              // update the admin match div, put the match id received fromt the server and add the exit button 
                }
            }
            // if the timer is running the status is true. So the button request to start the timer     
            else if(status === 'waiting'){
                let result = await startTimer(token_admin, this.roomId, timerInput);    
                if(result){                                             //if the result is positive, means that the request go right, and the now the timer is running
                    event.target.setAttribute('status', 'running');     // so we have to chenge the status saved in the buttons to running,
                    event.target.innerText = 'clear'                    // also the text of the button 
                    timerInput.readOnly  = true;                        // and block the input that now work as counter
                    this.updateAdminMatchDiv(result, false)             // update the admin match div, put the match id received fromt the server and don't add the exit button
                }   
            }
    
        });

        timerContainer.appendChild(timerInput);
        timerContainer.appendChild(timerButton);
        centralPart.appendChild(timerContainer)

        //create the div for the MATCH PART: match id and exit button
        if(data.timerStatus !== undefined){                                    // if the timer is undefined, means that the match in the room don't exist
            let matchIdDiv = document.createElement('div');                    // create the div 
            matchIdDiv.id = 'match-id'
            matchIdDiv.classList.add('match-id-admin')                         // use the style for the admin div version 
            
            let matchIdLable = document.createElement('div');                  // lable that contain the id of the active match
            matchIdLable.id = 'match-id-lable-admin';
            matchIdLable.textContent = 'MATCH ID: ' + data.matchId;

            matchIdDiv.appendChild(matchIdLable)

            if( data.timerStatus == false ){                                // if the timer is in pause we add the exit button, this becouse this is
                let matchIdDivExit = document.createElement('button');      // only moment where is permitted to the user to delete the match
                matchIdDivExit.textContent = 'exit'
                matchIdDivExit.id = 'match-id-exit-admin'
                matchIdDivExit.addEventListener('click', () => { 
                    deleteMatch(this.roomId)                                // the exit button request to delete the present match
                    timerInput.readOnly  = false;                           // futhemore put the input in R/W mode, so the user is able to define the new time for the new timer       
                    timerButton.setAttribute('status', 'undefined');        // Update the status and the text of the button      
                    timerButton.innerText = 'start';

                    let presentMatchDiv = document.getElementById('match-id')    // then we have to remove the match div part
                    centralPart.removeChild(presentMatchDiv)
                })
                matchIdDiv.appendChild(matchIdDivExit)
            }
            centralPart.appendChild(matchIdDiv)
        }

        //create the div element for open the list of agents
        let openAgentsList = document.createElement('div');              // it formed by
        openAgentsList.id = 'open-agents-list'

        let leftText = document.createElement('span');                   // an left write: 'Agents'
        leftText.textContent = 'Agents';
        leftText.id = 'open-agents-list-left-text'

        let downArrow = document.createElement('span');                  // a down arrow in the right 
        downArrow.textContent = '▼';    
        downArrow.id = 'open-agents-list-down-arrow'; 

        let agentsListDiv = document.createElement('div');               // this is the div where will be show the list of agents, it start 
        agentsListDiv.id = 'agents-list';                                // invisible until the click of the open agent list element 

        openAgentsList.appendChild(leftText);
        openAgentsList.appendChild(downArrow);
        centralPart.appendChild(openAgentsList);
        centralPart.appendChild(agentsListDiv);

        downArrow.addEventListener('click', () => {
            downArrow.classList.toggle('rotated');                                                       // rotate the arrow
                                                               
            if (agentsListDiv.style.display === 'none' || agentsListDiv.style.display === '' ) { 
                agentsListDiv.style.display = 'block';                                                   // if the list is close, open it;
                requestShowAgents(this.roomId, agentsListDiv);                                           // after the open of the div, add the real agent list
            }else{ agentsListDiv.style.display = 'none'; agentsListDiv.innerHTML =''}                    //  else if the list is open, close it and clean it 

        })

        


    }

    /*The method define the central part of the Panel for the normal client, it contain a row where the left part is a counter of the timer 
    of the room; the right part contain the leable that indiacte if the match is on or of and the leable that notify if the grid is freeze or not */
    buildClientCentralPart(centralPart, data){
        const timerContainer = document.createElement('div');           // create the unique row of the central part
        timerContainer.id = 'timer-container'; 

        const timerInput = document.createElement('input');             // Create the counter for the timer
        timerInput.type = 'text';
        timerInput.id ='timer-input'
        timerInput.classList.add('timer-input');
        timerInput.readOnly = true
        timerInput.style.flex = 1

        // for the value of the input it upload the time coming from the server, if there is one; otherway put it to 00:00
        if(data.remainingTime){         
            let minutes = Math.floor(data.remainingTime / 60);                let seconds = data.remainingTime % 60; 

            let formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;    // Add a zero if the minutes are less than 10 
            let formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;    // Add a zero if the seconds are less than 10 
        
            timerInput.value = formattedMinutes + ':' + formattedSeconds; // Update the value of input with the pattern __:__  
        }else{
            timerInput.value = '00:00'
        }

        timerContainer.appendChild(timerInput);

        let leableDiv = document.createElement('div');              // Create the side part for the leable 
        leableDiv.id = 'panel-leable-div'

        const lightTextGroup = document.createElement('div');       // create a div for the status of the match: 
        lightTextGroup.classList.add('light-text-match');           // it is composed by a text and a 'light'
        lightTextGroup.id = 'light-text-match'                      // the light indicate if the match is on ( red ) or off ( gray )

        const light = document.createElement('div');
        light.id = 'match-light'
        light.classList.add('match-light');
        if (data.matchStatus == 'on') { light.classList.add('on'); }             // Add the class "on" if the matchStatus is true

        const matchText = document.createElement('div');
        matchText.classList.add('match-text');
        matchText.textContent = 'match:';

        lightTextGroup.appendChild(matchText);
        lightTextGroup.appendChild(light);

        leableDiv.appendChild(lightTextGroup)
    
        if (data.gridStatus === 'freeze') {                         // chacke if the the grid is freeze 
            const freezeButton = document.createElement('button');  // in case add the freeze button to indicate it
            freezeButton.textContent = 'freeze';
            freezeButton.id = 'freeze-button'
            freezeButton.classList.add('freeze-button');

            leableDiv.appendChild(freezeButton)
        }

        timerContainer.appendChild(leableDiv);
        centralPart.appendChild(timerContainer)
    }

    // The method update the central part of the panel
    async updateCentralPart(){
        let centralPart = document.getElementById('central-part')       // take the reference of the central part 
        if(centralPart){                                                // if exist a central part delete it 
            let parent = centralPart.parentNode;
            parent.removeChild(centralPart)
        }
        centralPart = await this.buildCentralPart();                          // build the new central part

        let panel = document.getElementById('panel');                   // take the referenco of the right colum
        panel.appendChild(centralPart)

    }

    /* The method menage the creation and adding of the match div for the admin in the pannel; it take in input the id of the match and 
    a boolean exitButton that indicate if the applicant want the exit buttons or not */
    updateAdminMatchDiv(matchId, exitButton){
        
        let centralPart = document.getElementById('central-part');      // take the referenc to the central part
        if(!centralPart)  return                                        // if the central part is not found, there is an error
        
        let matchIdDiv =  document.getElementById('match-id');          // take the referenc of an ipotetic already existing match div 
        if(matchIdDiv){                                                 // if the match div already exist, it must be removed
            let parent = matchIdDiv.parentElement;                      // first we find the parent node
            parent.removeChild(matchIdDiv)                              // then remove the match div from the parent node
        }                                           

        matchIdDiv = document.createElement('div');                     // create the div
        matchIdDiv.id = 'match-id'
        matchIdDiv.classList.add('match-id-admin')                      // use the style for the admin div version 

        let matchIdLable = document.createElement('div');               // lable that contain the id of the active match
        matchIdLable.id = 'match-id-lable-admin';
        matchIdLable.textContent = 'MATCH ID: ' + matchId;

        matchIdDiv.appendChild(matchIdLable)

        if( exitButton ){                                               // if requested by the applicant add the exit button
            let matchIdDivExit = document.createElement('button');
            matchIdDivExit.textContent = 'exit'
            matchIdDivExit.id = 'match-id-exit-admin'
            matchIdDivExit.addEventListener('click', () => { 
                deleteMatch(this.roomId)                                     // the exit button request to delete the present match
                
                let timerInput = document.getElementById('timer-input')         // update the timer parts
                let timerButton = document.getElementById('timer-button')

                timerInput.readOnly  = false;                                   // put the input in R/W mode, so the user is able to define the new time for the new timer       
                timerButton.setAttribute('status', 'undefined');                // update the status and the text of the button 
                timerButton.innerText = 'start';

                let presentMatchDiv = document.getElementById('match-id')    // then we have to remove the match div part
                centralPart.removeChild(presentMatchDiv)
            })
            matchIdDiv.appendChild(matchIdDivExit)
        }

        let openAgentsList = document.getElementById('open-agents-list')     // take the reference of the open agents list element, becouse we want to
        centralPart.insertBefore(matchIdDiv, openAgentsList);                // add it before that element

    }

    // the method is used to change the write inside the freeze button 
    updateFreezeButton(){
        let freezeButton = document.getElementById('freeze-button')     // take the reference to the freeze button

        if(getAdminCookie()){                                                           // if the user is an admin
            freezeButton.innerText = getStatusGridButtonText(freezeButton.innerText)    // invert the write inside the button
        }else{                                                                          // if the user is not an admin
            if(freezeButton){                               // if exist the freeze button we remove it 
                let parent = freezeButton.parentElement     // find the parent of the button for then remove it
                parent.removeChild(freezeButton)
            }else{                                                // else if it don't exist add the freeze button 
                freezeButton = document.createElement('button');  
                freezeButton.textContent = 'freeze';
                freezeButton.id = 'freeze-button'
                freezeButton.classList.add('freeze-button');

                let leableDiv = document.getElementById('panel-leable-div')     // add to the left part of the client panel
                if(leableDiv) leableDiv.appendChild(freezeButton)
            }
        }
    }

    // the method is used to update the match light in the client panel
    updateMatchLight(){
        if(getAdminCookie()){ return }                                // if the user is an admin return, this work only for client panel
        
        let lightMatch = document.getElementById('match-light');
        if(lightMatch){
            if(lightMatch.classList.contains('on')) { lightMatch.classList.remove('on') }
            else { lightMatch.classList.add('on') }
        }
    }
}




/* FUNCTIONS for the ADMIN CENTRAL PART */
//Function for send request to chenge the staus of the grid
function requestFreezeUnfreezeGrid(event){

    const token_admin = getAdminCookie();
    const roomId = event.target.getAttribute('room');
    console.log('CHAGE STATUS GRID: REQUEST')
    
    fetch(`${HOST}/api/grids/${roomId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${token_admin}`
        },
    })
    .then(response => {
        if (response.ok) { return response.json(); } 
        else { throw new Error('Error during data sending');}
    })
    .then(data => { 
        console.log('CHAGE STATUS GRID: ', data.message)
        event.target.textContent = getStatusGridButtonText(data.status) // Update the botton
    })  
    .catch(error => { console.error('An error occurred:', error.message); });
}
// Function for define the text of the freeze/unfreeze button 
function getStatusGridButtonText(status){
    if (status === 'freeze') return 'unfreeze';
    if (status === 'unfreeze') return 'freeze';
    return 'undefined';
}
// Function for create the form for the request of change grid
function showGridForm(event) {

    const token_admin = getAdminCookie();
    const roomId = event.target.getAttribute('room');

    //div modal to set a darker background
    var modalDiv = document.createElement('div');
    modalDiv.id = 'gridFormContainer';
    modalDiv.classList.add('modal');

    // div modal-content that is the colored pop-up
    var modalContentDiv = document.createElement('div');
    modalContentDiv.classList.add('modal-content');

    // close button 
    var closeDiv = document.createElement('div');
    closeDiv.classList.add('close');
    closeDiv.innerHTML = '&times;';
    closeDiv.onclick = function() {
        document.body.removeChild(modalDiv);
    };
    modalContentDiv.appendChild(closeDiv);

    // new grid form
    var form = document.createElement('form');
    form.id = 'gridForm';

    // HTML code of the form 
    form.innerHTML = `
    <div style="text-align: center;">
        <div style="display: inline-block;">
            <h1 style="font-weight: bolder; display: inline-block;">CHANGE GRID</h1>
        </div>
    </div>

    <label for="mapFile" class="lableNewMap">MAP_FILE:</label>
    <input type="text" id="mapFile"  class="inputNewMap" name='mapFile' readonly>
    <span class="returnButton">Seleziona</span>

    <label for="parcelsInterval" class="lableNewMap">PARCELS_GENERATION_INTERVAL:</label>
    <select id="parcelsInterval" class="inputNewMap" name="parcelsInterval">
        <option value="1s">1 second</option>
        <option value="2s" selected>2 second</option>
        <option value="5s">5 second</option>
        <option value="10s">10 second</option>
    </select>

    <label for="parcelsMax" class="lableNewMap">PARCELS_MAX:</label>
    <input type="number" id="parcelsMax" class="inputNewMap" name="parcelsMax" required>

    <label for="parcelsRewardAvg" class="lableNewMap">PARCEL_REWARD_AVG:</label>
    <input type="number" id="parcelsRewardAvg" class="inputNewMap" name="parcelsRewardAvg" required>

    <label for="parcelsRewardVariance" class="lableNewMap">PARCEL_REWARD_VARIANCE:</label>
    <input type="number" id="parcelsRewardVariance" class="inputNewMap" name="parcelsRewardVariance" required>

    <label for="parcelsDecadingInterval" class="lableNewMap">PARCE_DECADING_INTERVALL:</label>
    <select id="parcelsDecadingInterval" class="inputNewMap" name="parcelsDecadingInterval">
        <option value="infinite" selected>Costanti</option>
        <option value="1s">1 second</option>
        <option value="2s">2 second</option>
        <option value="5s">5 second</option>
        <option value="10s">10 second</option>
    </select><br>

    <label for="randomlyMovingAgents" class="lableNewMap">RANDOMLY_MOVING_AGENTS:</label>
    <input type="number" id="randomlyMovingAgents" class="inputNewMap" name="randomlyMovingAgents" required>

    <label for="randomlyAgentSpeed" class="lableNewMap">RANDOM_AGENT_SPEED:</label>
    <select id="randomlyAgentSpeed" class="inputNewMap" name="randomlyAgentSpeed">
        <option value="1s">1 second</option>
        <option value="2s" selected>2 second</option>
        <option value="5s">5 second</option>
        <option value="10s">10 second</option>
    </select><br><br>

    
    <label for="agentsObservationDistance" class="lableNewMap">AGENTS_OBSERVATION_DISTANCE:</label>
    <input type="text" id="agentsObservationDistance" class="inputNewMap" name="agentsObservationDistance" value=5>
    
    <label for="parcelsObservationDistance" class="lableNewMap">PARCELS_OBSERVATION_DISTANCE:</label>
    <input type="text" id="parcelsObservationDistance" class="inputNewMap" name="parcelsObservationDistance" value=5>
    <br><br>

    <div style="text-align: center;">
        <div style="display: inline-block;">
            <input type="submit" class="submitNewMap" value="Submit">
        </div>
    </div>
    `;
    // add the listener to the select button
    form.querySelector('.returnButton').addEventListener('click', openMapList);

    //set as default the config of the actual grid in the new match form
    fetch(`${HOST}/api/config`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'roomId': roomId
        },
    })
    .then(response => {
        if (response.ok) {return response.json(); }
        else {throw new Error('Error in the request of config data'); }
    })
    .then(data => {
        console.log(data.AGENTS_OBSERVATION_DISTANCE);
        if(!data){console.log('Error get past config'); return}

        // Put the input to the default value
        document.getElementById('mapFile').value = data.MAP_FILE;
        document.getElementById('parcelsInterval').value = data.PARCELS_GENERATION_INTERVAL;
        document.getElementById('parcelsMax').value = data.PARCELS_MAX;
        document.getElementById('parcelsRewardAvg').value = data.PARCEL_REWARD_AVG;
        document.getElementById('parcelsRewardVariance').value = data.PARCEL_REWARD_VARIANCE;
        document.getElementById('parcelsDecadingInterval').value = data.PARCEL_DECADING_INTERVAL;
    
        document.getElementById('randomlyMovingAgents').value = data.RANDOMLY_MOVING_AGENTS;
        document.getElementById('randomlyAgentSpeed').value = data.RANDOM_AGENT_SPEED;
        
        if(isNaN(data.AGENTS_OBSERVATION_DISTANCE)){document.getElementById('agentsObservationDistance').value = 'infinite'}
        else { document.getElementById('agentsObservationDistance').value = data.AGENTS_OBSERVATION_DISTANCE; }

        if(isNaN(data.PARCELS_OBSERVATION_DISTANCE)){document.getElementById('parcelsObservationDistance').value = 'infinite'}
        else{ document.getElementById('parcelsObservationDistance').value = data.PARCELS_OBSERVATION_DISTANCE; }

    })
    .catch(error => {
        console.error('It occures an error:', error);
    });

    //define what happen on the submit action
    form.addEventListener('submit',(event) => {
        event.preventDefault();

        // Get the value from the different input of the form
        const mapFile = document.getElementById('mapFile').value;
        const parcelsInterval = document.getElementById('parcelsInterval').value;
        const parcelsMax = document.getElementById('parcelsMax').value;
        const parcelsRewardAvg = document.getElementById('parcelsRewardAvg').value;
        const parcelsRewardVariance = document.getElementById('parcelsRewardVariance').value;
        const parcelsDecadingInterval = document.getElementById('parcelsDecadingInterval').value;
        const randomlyMovingAgents = document.getElementById('randomlyMovingAgents').value;
        const randomlyAgentSpeed = document.getElementById('randomlyAgentSpeed').value;

        const agentsObservationDistance = document.getElementById('agentsObservationDistance').value;
        const parcelsObservationDistance = document.getElementById('parcelsObservationDistance').value;

        // check if the map input is empty
        if (mapFile === '') { document.getElementById('mapFile').classList.add('error'); return;}
        else{ document.getElementById('mapFile').classList.remove('error'); }
        
        // Create an object with all the input value
        const formData = {
        
        MAP_FILE: mapFile,
        PARCELS_GENERATION_INTERVAL: parcelsInterval,
        PARCELS_MAX: parseInt(parcelsMax),
        PARCEL_REWARD_AVG: parseInt(parcelsRewardAvg),
        PARCEL_REWARD_VARIANCE: parseInt(parcelsRewardVariance),
        PARCEL_DECADING_INTERVAL: parcelsDecadingInterval,

        RANDOMLY_MOVING_AGENTS: parseInt(randomlyMovingAgents),
        RANDOM_AGENT_SPEED: randomlyAgentSpeed,

        AGENTS_OBSERVATION_DISTANCE: agentsObservationDistance,
        PARCELS_OBSERVATION_DISTANCE: parcelsObservationDistance,
        MOVEMENT_DURATION: 50

        };

        // Make the request for a new grid
        fetch(`${HOST}/api/grids/${roomId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `${token_admin}`
        },
        body: JSON.stringify(formData)
        })
        .then(response => {
            if (response.ok) { return response.json(); } 
            else { throw new Error('Errore durante l\'invio dei dati al server.'); }
        })
        .then(data => {
            console.log('GRID CHANGE: ', data.message);
            location.reload();
        })
        .catch(error => { console.error('Si è verificato un errore:', error); });

       
    })

    // add the form to the div modal-content
    modalContentDiv.appendChild(form);

    // add the div modal-content to the div modal
    modalDiv.appendChild(modalContentDiv);

    // add the div modal in the body
    document.body.appendChild(modalDiv);

}
/* the function menege the start or resume  of the timer that lead also to the start of the match, if the request go right it block the 
timerInput, and start the count down. The return indicate if the request goes right or not */
async function startTimer(token_admin, roomId, timerInput){
    
    const timerValue = timerInput.value
    const timerPattern = /^(\d{1,2}):(\d{1,2})$/;       // pattern for "__:__"
    const value = timerValue.match(timerPattern);       // check the format "__:__"

    if(!value){                                         // If the value isn't correct show the error with the vibration of the input timer.
        console.log('Invalid timerValue format. Use the format "__:__".');  
        
        timerInput.classList.add('invalid');
        if (navigator.vibrate) {  navigator.vibrate(200); }
        setTimeout(() => { timerInput.classList.remove('invalid'); }, 2000); 

        return false    
    }

    const minutes = parseInt(value[1], 10);             // Extraxct the left digits that stay for the minutes 
    const seconds = parseInt(value[2], 10);             // Extraxct the right digits that stay for the seconds

    const totalSeconds = minutes * 60 + seconds;        // Calculate the total seconds 

    if(totalSeconds == 0){                              // if the total seconds is 0 return an error, else call the api for start the timer of the room
        timerInput.classList.add('invalid');
        if (navigator.vibrate) {  navigator.vibrate(200); }
        setTimeout(() => { timerInput.classList.remove('invalid'); }, 2000);   
        
        return false    
    }

    let matchId = false                                 // is the varaible where save the matchId received in the response
    await fetch(`${HOST}/api/timers/${roomId}/start`, {              // request to the server to start the timer
        method: 'PUT',      
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `${token_admin}`
        },
        body: JSON.stringify({ time: totalSeconds})
    })
    .then(response => {
        if (response.ok) { return response.json(); } 
        else { throw new Error('Error during data sending');}
    })
    .then(data => {  console.log('TIMER START: ', data.message); matchId = data.matchId })            
    .catch(error => { console.error('An error occurred:', error.message); return false;});

    return matchId;

}
// the function menege the stop of the timer that lead also to a stop of the match.The return indicate if the request goes right or not
async function stopTimer(token_admin, roomId){
    let matchId = false                                 // is the varaible where save the matchId received in the response
    await fetch(`${HOST}/api/timers/${roomId}/stop`, {         // request to start the timer
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `${token_admin}`
        },
    })
    .then(response => {
        if (response.ok) { return response.json(); } 
        else { throw new Error('Error during data sending'); }
    })
    .then(data => { console.log('TIMER STOP: ', data.message);  matchId = data.matchId })            
    .catch(error => { console.error('An error occurred:', error.message); return false;});

    return matchId;
}
//function for the deletion of the match
async function deleteMatch(roomId){

    const token_admin = getAdminCookie();
    await fetch(`${HOST}/api/matches/${roomId}`, {             // request to delete the match
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `${token_admin}`
        },
    })
    .then(response => {
        if (response.ok) { return response.json(); } 
        else { throw new Error('Error during data sending');}
    })
    .then(data => {  console.log('MATCH DELETE: ', data.message); })            
    .catch(error => { console.error('An error occurred:', error.message); return false;});
}
// function to show the list of agents in the grid
function requestShowAgents(roomId, agentsListDiv){
    const token_admin = getAdminCookie();
    fetch(`${HOST}/api/grids/${roomId}/agents`, {             // request the list of agents
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `${token_admin}`
        },
    })
    .then(response => {
        if (response.ok) { return response.json(); } 
        else { throw new Error('Error during data sending'); }
    })
    .then(data => { 
        console.log('GET AGENTS LIST: ', data.message, data.agentsName, data.agentsId )  
        
        for (let i = 0; i < data.agentsName.length; i++) {                // for each agent we add a row that contain: the name, id of 
            const name = data.agentsName[i];                    // the agent and a botton to throw out
            const id = data.agentsId[i];                        

            const div = document.createElement('div');
            div.classList.add('agent-div'); 

            const nameSpan = document.createElement('span');
            nameSpan.textContent = name;
            nameSpan.classList.add('agent-name');

            const idSpan = document.createElement('span');
            idSpan.textContent = id;
            idSpan.classList.add('agent-id');

            const button = document.createElement('button');
            button.textContent = 'Azione';
            button.addEventListener('click', () => {
                console.log(`Bottone cliccato per ${name}`);
            });

            div.appendChild(nameSpan);      // Nome a sinistra
            div.appendChild(idSpan);        // ID al centro
            // div.appendChild(button);     // Bottone a destra

            agentsListDiv.appendChild(div);
        }
    })  
}


/* FUNCTIONS for the MAP MENAGE during the change of the grid */
// function for open the list of maps 
function openMapList() {

    buildMapListModal();

    var modal = document.getElementById('mapListModal');
    modal.style.display = 'block';

    var mapListDiv = document.getElementById('map-container');
    mapListDiv.innerHTML = '';

    // request all the maps from the server
    fetch(`${HOST}/api/maps`, {
        method: 'get',
        headers: {
        'Content-Type': 'application/json'
        },
    })
    .then(response => {
        if (!response.ok) { throw new Error('Errore durante il caricamento delle mappe'); }
        return response.json();
    })
    .then(data => {
        // Genera la rappresentazione grafica delle mappe
        data.forEach((map) => {
            let mapDiv = document.createElement('div')
            mapDiv.innerHTML += '<div class="map-title">' +
            `<h3>${map.name}</h3>` +
            `<span class="returnButton">Select</span>` +
            '</div>' + generateMapRepresentation(map.map);

            // add the listener to the select button
            mapDiv.querySelector('.returnButton').addEventListener('click', function(){
                console.log('Selected Map: ', map.name)
                selectMap(map.name)
            });

            // add the single map to the map list
            mapListDiv.appendChild(mapDiv)
        });
    })
}
// function that create the HTML element with all the map
function buildMapListModal() {

    // div modal to set a darker background
    var modalDiv = document.createElement('div');
    modalDiv.id = 'mapListModal';

    // div modal-content
    var modalContentDiv = document.createElement('div');
    modalContentDiv.id = 'mapListModal-content';

    // close button
    var closeSpan = document.createElement('span');
    closeSpan.classList.add('close');
    closeSpan.innerHTML = '&times;';
    closeSpan.onclick = function() { closeMapList(); };
    modalContentDiv.appendChild(closeSpan);

    var header = document.createElement('h2');
    header.textContent = 'Lista Mappe';
    modalContentDiv.appendChild(header);

    var mapContainerDiv = document.createElement('div');
    mapContainerDiv.id = 'map-container';
    modalContentDiv.appendChild(mapContainerDiv);

    modalDiv.appendChild(modalContentDiv);

    document.body.appendChild(modalDiv);
}
// function to generete the grafic rappresentation of the map 
function generateMapRepresentation(map) {
    var rows = map.length;

    var representation = '<div class="map" style="--rows: ' + rows + ';">';
    for (var i = 0; i < rows; i++) {
        representation += '<div class="row">';
        for (var j = 0; j < map[i].length; j++) {
            var cellClass = '';
            switch (map[i][j]) {
                case 0:
                    cellClass = 'light-green';
                    break;
                case 1:
                    cellClass = 'dark-green';
                    break;
                case 2:
                    cellClass = 'red';
                    break;
                case 3:
                    cellClass = 'black';
                    break;
                default:
                    cellClass = '';
                    break;
            }
            representation += '<div class="cell ' + cellClass + '"></div>';
        }
        representation += '</div>';
    }
    representation += '</div>';
    return representation;
}
// function to cles the map list pop-up
function closeMapList() {
    var modal = document.getElementById('mapListModal');
    modal.style.display = 'none';
}
// function to select one map, it save the choosen one in the map input of the new match form and close the pop-up
function selectMap(mapName) {
    var selectedMapInput = document.getElementById('mapFile'); 
    selectedMapInput.value = mapName;  

    closeMapList();
}

export {Panel}