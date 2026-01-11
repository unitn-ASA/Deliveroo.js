
class APIClient {

    /**
     * @param {string} HOST
     */
    HOST = 'http://localhost:8080';

    /**
     * Initialize HOST for API calls.
     * @param {string} HOST
     */
    constructor( HOST ) {
        this.HOST = HOST;
        console.log("API Client initialized with HOST:", this.HOST);
    }

    async getToken(name, team, password) {
        return new Promise((resolve, reject) => {

            console.log("Name fetch: ", name + " team fetch: ", team);
            fetch(this.HOST+'/api/tokens', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'name': name,
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

    async getConfig ( token ) {
        return new Promise((resolve, reject) => {
            fetch(this.HOST+'/api/configs', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-token': token
                }
            })
            .then( JSON.stringify )
            .catch(error => {
                console.error('An error occurred:', error);
                reject('Error getting config');
            });
        });
    }

    /**
     * 
     * @param {string} token 
     * @param {{}} config 
     * @returns 
     */
    async patchConfig ( token, config ) {

        console.log( "Patching config: ", config );

        return new Promise((resolve, reject) => {
            fetch(this.HOST+'/api/configs', {
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

    /**
     * @param {string} token
     * @param {string} id 
     * @returns 
     */
    async deleteAgent ( token, id ) {
        return new Promise((resolve, reject) => {
            fetch(this.HOST+'/api/agents/'+id, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'x-token': token
                }
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error(`Error deleting agent, Status code: ${response.status}`);
            })
            .then(data => {
                console.log("agent deleted: " + data);
                resolve(data);
            })
            .catch(error => {
                console.error('An error occurred:', error);
                reject('Error deleting agent');
            });
        });
    }

    /**
     * @param {string} token 
     * @param {string} id 
     * @param {{score?:number, penalty?:number}} agent
     * @returns 
     */
    async patchAgent ( token, id, agent ) {
        return new Promise((resolve, reject) => {
            fetch(this.HOST+'/api/agents/'+id, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-token': token
                },
                body: JSON.stringify(agent)
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error(`Error patching agent, Status code: ${response.status}`);
            })
            .then(data => {
                console.log("agent patched: " + data);
                resolve(data);
            })
            .catch(error => {
                console.warn('An error occurred:', error);
                reject('Error patching agent');
            });
        });
    }

    /**
     * 
     * @param {string} token
     * @param {string} id
     * @returns
     */
    async deleteParcel( token, id ) {
        return new Promise((resolve, reject) => {
            fetch(this.HOST+'/api/parcels/'+id, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'x-token': token
                }
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error(`Error deleting parcel, Status code: ${response.status}`);
            })
            .then(data => {
                console.log("parcel deleted: " + data);
                resolve(data);
            })
            .catch(error => {
                console.warn('An error occurred:', error);
                reject('Error deleting parcel');
            });
        });
    }


    /**
     * Delete all parcels from the grid.
     * @param {*} token 
     */
    async deleteAllParcels( token ) {
        return new Promise((resolve, reject) => {
            fetch(this.HOST+'/api/parcels', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'x-token': token
                }
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                else {
                    throw new Error(`Error deleting all parcels, Status code: ${response.status}`);
                }
            })
            .then(data => {
                console.log("all parcels deleted: " + data);
                resolve(data);
            })
            .catch(error => {
                console.warn('An error occurred:', error);
                reject('Error deleting all parcels');
            });
        });
    }

}

export default APIClient;
