// open the login form at the press of the login button
document.getElementById('loginButton').addEventListener('click', function() {
    let loginFormContainer = document.getElementById('loginFormContainer');
    let overlay = document.getElementById('overlay');
    if (loginFormContainer.style.display === 'none' || loginFormContainer.style.display === '') {
        loginFormContainer.style.display = 'block';
        overlay.style.display = 'block';
    } else {
        loginFormContainer.style.display = 'none';
        overlay.style.display = 'none';
    }
});

// close the login form whem the user click the x 
document.querySelector('#loginHeader button.close-button').addEventListener('click', function() {
    let loginFormContainer = document.getElementById('loginFormContainer');
    let overlay = document.getElementById('overlay');
    loginFormContainer.style.display = 'none';
    overlay.style.display = 'none';
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
        location.reload();
    } else {
        console.log("LOGIN ADMIN ERROR")
        document.getElementById('username-login').classList.add('error');
        document.getElementById('password-login').classList.add('error');
    }
});


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


