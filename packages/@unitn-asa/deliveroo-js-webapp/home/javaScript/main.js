import { newRoom } from './NewRoom.js'
import { defineContainerRooms } from './ContainerRooms.js';
import { showLoginForm } from './tools/showLoginForm.js'

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
        
        // change the login button to logged status
        let loggedButton = document.getElementById('loginButton');
        loggedButton.classList.add('logged');
        loggedButton.innerText = 'Logged'
        
        //show the admin part 
        let admin = document.getElementById('admin-part');
        admin.style.display = 'block'; 

        //hide the user part 
        let user = document.getElementById('user-part');
        user.style.display = 'none'; 

        //define the container of the match for admin 
        defineContainerRooms(true)

        //add the listener to the botton create New Room
        document.getElementById('createRoomButton').addEventListener('click', function() { newRoom() })

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