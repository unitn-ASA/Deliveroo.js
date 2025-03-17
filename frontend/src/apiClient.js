var HOST = import.meta.env.VITE_SOCKET_IO_HOST || window.location.origin;

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

async function patchConfig ( token, key, value ) {

    const config = {}
    config[key] = value;

    console.log( "Patching config: ", config );

    return new Promise((resolve, reject) => {
        fetch(HOST+'/api/configs', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'x-token': token
            },
            body: JSON.stringify(config)
        })
        // parsing response
        .then( JSON.stringify )
        // .then( response => {
        //     console.log("config patched: " + response);
        //     for ( let [key,value] of Object.entries(response) ) {
        //         settings[key] = value;
        //     }
        //     resolve(settings);
        // })
        .catch(error => {
            console.error('An error occurred:', error);
            reject('Error patching config');
        });
    });
}

export { richiediToken, patchConfig }