const { server, app } = require('./src/server.js');

const port = process.env.PORT || 8080;

function startServer () {

    server.listen( port, () => {
        
        console.log(`Server listening on port ${port}`);
    
    } );

}



/**
 * Configure Redis
 */

const { createClient } = require('redis');
const Redis = require('./src/deliveroo/Redis');

const REDIS_URL = process.env.REDIS_URL;


async function startRedis () {

    if ( REDIS_URL ) {
    
        const client = Redis.client = createClient({
            url: REDIS_URL
        });
        
        client.on('error', err => console.log('Redis Client Error', err) );
        client.on('ready', () => console.log('Redis connected and ready') );
        client.on('reconnecting', () => console.log('Redis reconnecting') );
        
        await client.connect()
            
        // console.log("Connected to Redis");
        
        startServer();
    
    } else {
        
        console.log('Redis disabled');
        startServer();
    
    }

}

startRedis ();