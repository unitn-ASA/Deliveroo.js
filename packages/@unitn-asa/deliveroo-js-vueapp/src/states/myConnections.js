import { Connection } from '../Connection.js';

/**
 * @type {Map<string,Connection>} Token to Connection
 */
export const myConnections = new Map();

/**
 * @param {string} token 
 * @returns Connection
 */
export function getOrCreateConnection ( token ) {
    // console.log( "getOrCreateConnection", token );
    let connection = myConnections.get( token );
    if ( ! connection ) {
        connection = new Connection( token );
        if ( connection.payload )
            myConnections.set( token, connection );
    }
    return connection;
}

/**
 * @param {string} name 
 * @returns Connection
 */
export function getConnectionByName ( name ) {
    for (const connection of myConnections.values()) {
        if ( connection.payload.name === name ) {
            return connection;
        }
    }
    return null;
}

/**
 * Instantiate a new connection for each token
 */
import { myTokens } from './myTokens.js';
for (const token of myTokens) {
    getOrCreateConnection( token );
}
