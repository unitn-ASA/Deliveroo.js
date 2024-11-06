import { reactive, watch } from 'vue';
import { Connection } from '../Connection.js';
import { jwtDecode } from "jwt-decode";

/**
 * @type {Map<string,Connection>} Token to Connection
 */
const myConnections = new Map();

function getOrCreateConnection ( token ) {
    // console.log( "getOrCreateConnection", token );
    let connection = myConnections.get( token );
    if ( ! connection ) {
        connection = new Connection( token );
        if ( connection.payload )
            myConnections.set( token, connection );
    }
    return connection;
}

function getConnectionByName ( name ) {
    for (const connection of myConnections.values()) {
        if ( connection.payload.name === name ) {
            return connection;
        }
    }
    return null;
}

import { myTokens } from './myTokens.js';

for (const token of myTokens) {
    getOrCreateConnection( token );
}

export { myConnections, getOrCreateConnection, getConnectionByName };