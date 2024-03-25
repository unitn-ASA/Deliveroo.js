checkLogged()

function checkLogged(){
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

        // we define the container of the match for admin 
        defineContainerMatch(true)

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
        defineContainerMatch(false)
        
    }
}



// open the login form at the press of the login button
document.getElementById('loginButton').addEventListener('click', function() {
    
    let loggedButton = document.getElementById('loginButton');
    if(loggedButton.classList.contains('logged')){ deleteAdminCookie(); console.log('LOGOUT ADMIN SUCSESS'); return; }
    openORcloseLoginForm(); 
});

// close the login form whem the user click the x 
document.querySelector('#loginHeader button.close-button').addEventListener('click', function() {
    openORcloseLoginForm(); 
});

document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('username-login').value;
    const password = document.getElementById('password-login').value;

    const response = await fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (data.success) {
        console.log("LOGIN ADMIN SUCSESS")
        setAdminCookie(data.token)
        openORcloseLoginForm(); 
        checkLogged();
    } else {
        console.log("LOGIN ADMIN ERROR")
        document.getElementById('username-login').classList.add('error');
        document.getElementById('password-login').classList.add('error');
    }
});


function openORcloseLoginForm(){
    let loginFormContainer = document.getElementById('loginFormContainer');
    let overlay = document.getElementById('overlay');
    if (loginFormContainer.style.display === 'none' || loginFormContainer.style.display === '') {
        loginFormContainer.style.display = 'block';
        overlay.style.display = 'block';
    } else {
        loginFormContainer.style.display = 'none';
        overlay.style.display = 'none';
    }
}


// Function to menage the cookie
function setAdminCookie(token) {
    const d = new Date();
    d.setTime(d.getTime() + (1 * 24 * 60 * 60 * 1000));
    let expires = "expires="+d.toUTCString();
    document.cookie = "admin_token" + "=" + token + ";" + expires + ";path=/";
}

function getAdminCookie() {
    let name = "admin_token="
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
    return "false";
}

function deleteAdminCookie() {
    document.cookie = 'admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    checkLogged();
}


function invertPlayStop(status){
    if(status == 'stop') return 'play';
    if(status == 'play') return 'stop';
}
