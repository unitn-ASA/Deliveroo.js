
import { user } from './states/user.js';

var HOST = import.meta.env.VITE_SOCKET_IO_HOST || 'http://localhost:8080';

async function richiediToken(nome, team, password) {
    
    return new Promise((resolve, reject) => {

        console.log("Nome fetch: ", nome + " team fetch: ", team);

        fetch(HOST+'/api/tokens', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'name': nome,
                'team': team,
                'password': password
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

export { richiediToken }