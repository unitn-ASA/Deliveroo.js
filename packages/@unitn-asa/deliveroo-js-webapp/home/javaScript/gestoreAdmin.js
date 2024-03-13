//check if the user is already logged like admin, in that case dinenable and change the loggin botton
checkLogged()

function checkLogged(){
    let cookie = getAdminCookie()
    if(cookie !== 'false'){
        let loginButton = document.getElementById('loginButton');
        if (loginButton) { loginButton.style.display = 'none'; }
        
        let loggedButton = document.getElementById('loggedButton');
        if (loggedButton) { loggedButton.style.display = 'block'; }

        let admin = document.getElementById('admin-part');
        admin.style.display = 'block'; 

        let user = document.getElementById('user-part');
        user.style.display = 'none'; 

        defineContainerMatch(true);
    }else{
        let loginButton = document.getElementById('loginButton');
        if (loginButton) { loginButton.style.display = 'block'; }
        
        let loggedButton = document.getElementById('loggedButton');
        if (loggedButton) { loggedButton.style.display = 'none'; }

        let admin = document.getElementById('admin-part');
        admin.style.display = 'none'; 

        let user = document.getElementById('user-part');
        user.style.display = 'block'; 

        defineContainerMatch(false);
    }
}

