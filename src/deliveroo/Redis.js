const Grid = require('./Grid');
const { RedisClientType, createClient } = require('redis');

class Redis {

    /** @type {RedisClientType} */
    static client;
    
    /** @type {Grid} */
    grid;

    /** @type {function(Grid)} */
    constructor ( grid ) {

        this.grid = grid;

        // If redis enabled
        if ( Redis.client && Redis.client.isReady ) {

            grid.on( 'agent score', async (agent) => {
                if ( Redis.client.isReady )
                    await Redis.client.set( agent.id, {name: agent.name, score: agent.score} );
            } )
    
            grid.on( 'agent created', async (agent) => {
                if ( Redis.client.isReady )
                    agent.score = await Redis.client.get( agent.id ).score;
            } )

        }

    }

}

module.exports = Redis