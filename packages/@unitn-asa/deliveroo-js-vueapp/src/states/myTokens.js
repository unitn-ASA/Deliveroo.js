import { ref, reactive, watch } from 'vue';
import { jwtDecode } from "jwt-decode";

const myTokens = reactive(new Array());

function removeToken ( token ) {
    const index = myTokens.indexOf( token );
    console.log( myTokens );
    console.log( index );
    if ( index > -1 ) {
        myTokens.splice( index, 1 );
    }
    console.log( myTokens );
}

if ( localStorage.getItem('myTokens') ) {
    for (const token of JSON.parse( localStorage.getItem('myTokens') ) ) { // parse from array of entries
        try {
            jwtDecode( token );
            myTokens.push( token );
        } catch (error) {
            console.error( 'Invalid token', token.value, error );
        }
    }
}

watch( myTokens, (myTokens) => {
    localStorage.setItem( 'myTokens', JSON.stringify(myTokens)); // stringify as array of entries
});

export { myTokens, removeToken };