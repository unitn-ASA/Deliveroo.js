
/**
 * @typedef {import("../types/IOAgent.js").IOAgent} IOAgent
 * @typedef {import("../types/IOParcel.js").IOParcel} IOParcel
 * @typedef {import("../types/IOConfig.js").IOConfig} IOConfig
 */



/**
 * @typedef {{
 *      'agents': () => IOAgent[],
 *      'agents/:id': () => IOAgent,
 *      'configs': () => IOConfig,
 *      'levels': () => IOConfig[],
 *      'level': () => IOConfig,
 *      'maps': () => any[],
 *      'map': () => any,
 *      'npcs': () => any[],
 *      'npc': () => any,
 *      'parcels': () => IOParcel[],
 *      'parcel': () => IOParcel,
 * }} IODeliveroojsGETRoutes
 */

/**
 * @typedef {{
 *      'agents': (body: IOAgent) => IOAgent,
 *      'levels': (body: IOConfig) => IOConfig,
 *      'maps': (body: any) => IOConfig,
 *      'npcs': (body: any) => {},
 *      'parcels': (body: IOParcel) => IOParcel,
 * }} IODeliveroojsPOSTRoutes
 */

/**
 * @typedef {{
 *      'agents': () => IOAgent[],
 *      'agents/:id': () => IOAgent,
 *      'npcs': () => any[],
 *      'npc': (id: string) => any,
 *      'parcels': () => IOParcel[],
 *      'parcel': (id: string) => IOParcel,
 * }} IODeliveroojsDELETERoutes
 */



/**
 * @class
 */
export class DjsRestClient {



    /** @type {string} */
    #HOST = 'http://localhost:8080';
    /** @type {string} */
    get HOST() { return this.#HOST }



    /**
     * Initialize HOST for API calls.
     * @param {string} HOST
     */
    constructor( HOST ) {
        this.#HOST = HOST;
        console.log("DjsRestClient (API RESTful Client) initialized with HOST:", this.HOST);
    }



    /**
     * @template { keyof IODeliveroojsGETRoutes } K
     * @param { K } resource
     * @param { string } token
     * @returns {Promise<ReturnType<IODeliveroojsGETRoutes[K][]>>}
     */
    async getAll ( resource, token ) {

        return new Promise( (resolve, reject) => {

            const url = this.HOST+'/api/'+resource;

            console.log( 'GET', url );

            fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-token': token
                }
            })
            
            .then( JSON.stringify )
            
            .then( body => resolve( /** @type {any} */ (body)) )
            
            .catch(error => {
                console.error('An error occurred:', error);
                reject('Error getting config');
            });

        } );
    }



    /**
     * @template { keyof IODeliveroojsGETRoutes } K
     * @param { K } resource
     * @param { string } id
     * @param { string } token
     * @returns {Promise<ReturnType<IODeliveroojsGETRoutes[K]>>}
     */
    async get ( resource, id, token ) {

        return new Promise( (resolve, reject) => {

            // replace placeholder ':id' with value of id in string resource
            const url = this.HOST+'/api/'+resource.replace( ':id', id );

            console.log( 'GET', url );

            fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-token': token
                }
            })
            
            .then( JSON.stringify )
            
            .then( body => resolve( /** @type {any} */ (body)) )
            
            .catch(error => {
                console.error('An error occurred:', error);
                reject('Error getting config');
            });

        } );

    }



    /**
     * @template { keyof IODeliveroojsPOSTRoutes } K
     * @param { K } resource
     * @param { string } token
     * @param { Parameters<IODeliveroojsPOSTRoutes[K]>[0] } body
     * @returns {Promise<ReturnType<IODeliveroojsPOSTRoutes[K]>>}
     */
    async post ( resource, token, body ) {

        return new Promise( (resolve, reject) => {

            const url = this.HOST+'/api/'+resource;
            
            console.log( 'POST', url, body );

            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-token': token
                },
                body: JSON.stringify( body )
            })
            
            .then( JSON.stringify )
            
            .then( body => resolve( /** @type {any} */ (body)) )
            
            .catch(error => {
                console.error('An error occurred:', error);
                reject('Error getting config');
            });

        } );

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
            .then( (/** @type {{token:string}} */ data) => {
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



// Example usage:
// 
// const api = new DeliveroojsRestClient('http://localhost:8080');
// api.get('agents', '', 'some-token').then( agents => console.log( agents ) );
// api.get('agents/:id', 'some-id', 'some-token').then( agent => console.log( agent ) );
// api.post('agents', 'some-token', {
//     id: 'agent-123',
//     name: 'Agent 123',
//     teamId: 'team-1',
//     teamName: 'Team 1',
//     score: 0,
//     penalty: 0,
//     x: 0,
//     y: 0
// } )
// .then( agent => console.log( agent ) );
