
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

async function getRooms () {
    return fetch(HOST+'/api/rooms', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'token': user.value.token
            }
        })
        .then(response => {
            return response.json();
        })
        .catch(error => {
            console.error('An error occurred:', error);
        });
}

async function createRoom () {
    return fetch(HOST+'/api/rooms', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'token': user.value.token
        }
    })
    .then(response => {
        return response.json();
    })
    .catch(error => {
        console.error('An error occurred:', error);
    });
}

async function freezeRoom (roomId) {
    return fetch(HOST+'/api/rooms/'+roomId, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'token': user.value.token
        },
        body: JSON.stringify({freezed: true})
    })
    .then(response => {
        return response.json();
    })
    .catch(error => {
        console.error('An error occurred:', error);
    });
}

async function unfreezeRoom (roomId) {
    return fetch(HOST+'/api/rooms/'+roomId, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'token': user.value.token
        },
        body: JSON.stringify({freezed: false})
    })
    .then(response => {
        return response.json();
    })
    .catch(error => {
        console.error('An error occurred:', error);
    });
}

async function deleteRoom (roomId) {
    return fetch(HOST+'/api/rooms/'+roomId, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'token': user.value.token
        }
    })
    .then(response => {
        return response.json();
    })
    .catch(error => {
        console.error('An error occurred:', error);
    });
}

async function getMatches (roomId) {

    return fetch(HOST+'/api'+(roomId?'/rooms/'+roomId:'')+'/matches', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'token': user.value.token
            }
        })
        .then(response => {
            return response.json();
        })
        .catch(error => {
            console.error('An error occurred:', error);
        });
}

async function createMatch (roomId, startTime, endTime, config) {
    console.log("createMatch: ", roomId, startTime, endTime, config);
    return fetch(HOST+'/api/matches', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'token': user.value.token
        },
        body: JSON.stringify({roomId, startTime, endTime, config})
    })
    .then(response => {
        return response.json();
    })
    .catch(error => {
        console.error('An error occurred:', error);
    });
}

async function deleteMatch (matchId) {
    return fetch(HOST+'/api/matches/'+matchId, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'token': user.value.token
        }
    })
    .then(response => {
        return response.json();
    })
    .catch(error => {
        console.error('An error occurred:', error);
    });
}


export { richiediToken, getRooms, createRoom, freezeRoom, unfreezeRoom, deleteRoom, getMatches, createMatch, deleteMatch }