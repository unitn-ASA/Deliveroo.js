import { reactive, watch } from 'vue';
import { Connection } from '../Connection';
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

export { myConnections, getOrCreateConnection, getConnectionByName };