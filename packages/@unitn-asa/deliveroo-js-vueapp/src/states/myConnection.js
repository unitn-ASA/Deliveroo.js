import { ref } from "vue";
import { myTokens } from "./myTokens.js";
import { getOrCreateConnection, getConnectionByName } from "./myConnections.js";



/**
 * @type {import("@/Connection.js").Connection} connection
 */
export var connection = null;



/**
 * @type {import("vue").Ref<number>}
 */
export const connectionKey = ref(0);



/**
 * playToken
 * @param {string} token
 * @returns {void}
 */
export function playToken ( token ) {
    connection = getOrCreateConnection( token );
    if ( connection ) {
        connection.connect();

        // set query param to payload.name e.g. ?name=marco
        const url = new URL(window.location);
        url.searchParams.set('name', connection.payload.name);
        url.searchParams.set('token', connection.token);
        window.history.replaceState({}, '', url);
        // router.push({ query: {name:payload.name} });
    
        connectionKey.value += 1; // Increment the key to force reload Deliveroojs
    }
};



/**
 * Autoplay by token or name in URL
 */
const urlParams = new URLSearchParams(window.location.search);
// get ?name= and ?token= from query params
const name = urlParams.get('name');
const token = urlParams.get('token');
if ( token ) {
    console.log( 'myGame.js token in URL:', token );
    if ( ! myTokens.includes(token) )
        // store new token
        myTokens.push( token );
    playToken( token );
} else if ( name ) {
    console.log( 'myGame.js name in URL:', name );
    connection = getConnectionByName( name );
    playToken( connection.token );
} else {
    console.log( 'myGame.js no token nor name in URL' );
}

