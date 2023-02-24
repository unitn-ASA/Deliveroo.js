const Grid = require('./Grid');
const Agent = require('./Agent');
const { RedisClientType, createClient } = require('redis');

class Redis {

    /** @type {RedisClientType} */
    static client;
    
    /** @type {Grid} */
    grid;

    /** @type {function(Grid)} */
    constructor ( grid ) {

        this.grid = grid;

        grid.on( 'agent score', /** @type {function(Agent)} */ async (agent) => {
            if ( ! Redis.client || ! Redis.client.isReady )
                return;
            console.log( 'Redis set', agent.id, agent.score )
            await Redis.client.hSet( agent.id, 'score', agent.score );
        } )

        grid.on( 'agent created', async (agent) => {
            if ( ! Redis.client || ! Redis.client.isReady )
                return;
            let entry = await Redis.client.hGetAll( agent.id );
            console.log( 'Redis get', agent.id, entry )
            if ( entry )
                agent.score = parseInt( entry.score );
            else
                await Redis.client.hSet( agent.id, 'name', agent.name );
        } )

    }

}

module.exports = Redis