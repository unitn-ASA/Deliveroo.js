import { newRoom } from './NewRoom.js'
import { defineContainerRooms } from './ContainerRooms.js';
import { showLoginForm } from './ShowLoginForm.js'

main()

function main(){

    document.getElementById('loginButton').addEventListener('click', function() {
        let loggedButton = document.getElementById('loginButton');
        console.log(loggedButton)

        if(loggedButton.classList.contains('logged')){ 
            deleteAdminCookie(); 
            location.reload();
            console.log('LOGOUT ADMIN SUCSESS'); 
            return; 
        }
        
        showLoginForm(); 
    });

    let cookie = getAdminCookie()

    if(cookie !== 'false'){
        
        let loggedButton = document.getElementById('loginButton');                  // change the login button to logged status
        loggedButton.classList.add('logged');
        loggedButton.innerText = 'Logged'
        
        let admin = document.getElementById('admin-part');                          // show the admin part 
        admin.style.display = 'block'; 

        let user = document.getElementById('user-part');                            // hide the user part 
        user.style.display = 'none'; 

        defineContainerRooms(true)                                                  // define the container of the match for admin 

        document.getElementById('createRoomButton').addEventListener('click', function() { newRoom() })         // add the listener to the botton create New Room
        document.getElementById('oldMatch').addEventListener('click', function() { 
            var url = '/old_matches';
            window.location.href = url; 
        })

    }else{

        // change the login button to login status
        let loggedButton = document.getElementById('loginButton');
        loggedButton.classList.remove('logged');
        loggedButton.innerText = 'Login'

        //hide the admin part 
        let admin = document.getElementById('admin-part');
        admin.style.display = 'none'; 

        //show the user part 
        let user = document.getElementById('user-part');
        user.style.display = 'block'; 

        // we define the container of the match for user 
        defineContainerRooms(false)
        
    }

    
}