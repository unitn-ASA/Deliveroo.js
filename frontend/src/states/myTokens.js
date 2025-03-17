import { ref, reactive, watch } from 'vue';
import { jwtDecode } from "jwt-decode";

/**
 * @type {import("vue").Reactive<Array<String>>}
 */
export const myTokens = reactive(new Array());

/**
 * @type {function(string):void}
 */ 
export function removeToken ( token ) {
    const index = myTokens.indexOf( token );
    // console.log( myTokens, index );
    if ( index > -1 ) {
        myTokens.splice( index, 1 );
    }
    // console.log( myTokens );
}

/**
 * Load tokens from local storage
 */
if ( localStorage.getItem('myTokens') ) {
    for (const token of JSON.parse( localStorage.getItem('myTokens') ) ) { // parse from array of entries
        try {
            jwtDecode( token );
            myTokens.push( token );
        } catch (error) {
            removeToken( token );
            console.warn( 'Invalid token', token, 'removed' );
        }
    }
}

/**
 * Sync with local storage when a new token is added
 */
watch( myTokens, (myTokens) => {
    localStorage.setItem( 'myTokens', JSON.stringify(myTokens)); // stringify as array of entries
});
