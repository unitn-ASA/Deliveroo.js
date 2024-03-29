/* BUILD THE HTML ELEMENT FOR THE LOGIN ACTION */
function showLoginForm() {
    
    let overlay = document.createElement('div')
    overlay.id = 'overlay'

    let loginFormContainer = document.createElement('div');
    loginFormContainer.id = 'loginFormContainer';

    let loginHeader = document.createElement('div');
    loginHeader.id = 'loginHeader';

    let loginTitle = document.createElement('h2');
    loginTitle.classList.add('login-title');
    loginTitle.textContent = 'LOGIN';

    let closeButton = document.createElement('button');
    closeButton.classList.add('close-button');
    closeButton.textContent = 'X';
    closeButton.addEventListener('click', function() { document.body.removeChild(overlay) });

    loginHeader.appendChild(loginTitle);
    loginHeader.appendChild(closeButton);

    let loginForm = document.createElement('form');
    loginForm.id = 'loginForm';

    let usernameInput = document.createElement('input');
    usernameInput.type = 'text';
    usernameInput.placeholder = 'Username';
    usernameInput.id = 'username-login';

    let passwordInput = document.createElement('input');
    passwordInput.type = 'password';
    passwordInput.placeholder = 'Password';
    passwordInput.id = 'password-login';

    let submitButton = document.createElement('button');
    submitButton.classList.add('submit');
    submitButton.type = 'submit';
    submitButton.textContent = 'Accedi';

    loginForm.appendChild(usernameInput);
    loginForm.appendChild(passwordInput);
    loginForm.appendChild(submitButton);

    loginForm.addEventListener('submit', async (event) => {
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
            document.body.removeChild(overlay) 
            location.reload();
        } else {
            console.log("LOGIN ADMIN ERROR")
            document.getElementById('username-login').classList.add('error');
            document.getElementById('password-login').classList.add('error');
        }
    });

    loginFormContainer.appendChild(loginHeader);
    loginFormContainer.appendChild(loginForm);

    overlay.append(loginFormContainer)

    document.body.appendChild(overlay);
}

export{showLoginForm}
