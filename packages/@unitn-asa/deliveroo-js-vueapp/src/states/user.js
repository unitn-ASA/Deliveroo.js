import { ref, watch } from 'vue';
import { myConnections, getConnectionByName } from './myConnections';

const user = ref( { token: '', payload: {} } );

// get name from query params ?name=marco
const urlParams = new URLSearchParams(window.location.search);
const name = urlParams.get('name');
if ( name ) {
    const connection = getConnectionByName( name );
    if ( connection ) {
        user.value.token = connection.token;
        user.value.payload = connection.payload;
    }
}

console.log( "user.js user.value.token", user.value.token );

watch( user, ({token, payload}) => {
    console.log( "user.js watch user.value", token, payload );
    // set query param to payload.name e.g. ?name=marco
    const url = new URL(window.location);
    url.searchParams.set('name', payload.name);
    window.history.replaceState({}, '', url);
});

export { user };