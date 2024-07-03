const redis = require('redis');
const config = require('../config');
const myGrid = require('./grid');
const Agent = require('./deliveroo/Agent');



const REDIS_URL = config.REDIS_URL || process.env.REDIS_URL; // no default value



var client;

if ( REDIS_URL ) {

    client = redis.createClient( {
        url: REDIS_URL
    } );
    
    client.on('error', err => console.log('Redis Client Error', err) );
    client.on('ready', () => console.log('Redis connected and ready') );
    client.on('reconnecting', () => console.log('Redis reconnecting') );

    myGrid.on( 'agent score', /** @type {function(Agent)} */ async (agent) => {
        if ( ! client || ! client.isReady )
            return;
        console.log( 'Redis hSet', agent.id, 'score', agent.score )
        await client.hSet( agent.id, 'score', agent.score );
    } )

    myGrid.on( 'agent created', async (agent) => {
        if ( ! client || ! client.isReady )
            return;
        let entry = await client.hGetAll( agent.id );
        console.log( 'Redis hGetAll', agent.id, entry );
        if ( entry && entry.score && parseInt(entry.score) )
            agent.score = parseInt( entry.score );
        else
            await client.hSet( agent.id, 'name', agent.name );
    } )
    
} else {

    console.log('Redis disabled');

}
    
module.exports = client;
