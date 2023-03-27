const server = require('./src/server.js');
const { createClient } = require('redis');
const Redis = require('./src/deliveroo/Redis');



const port = process.env.PORT || 8080;
const REDIS_URL = process.env.REDIS_URL;



async function startServer () {

    /**
     *  Start Redis
     */

    if ( REDIS_URL ) {
    
        const client = Redis.client = createClient({
            url: REDIS_URL
        });
        
        client.on('error', err => console.log('Redis Client Error', err) );
        client.on('ready', () => console.log('Redis connected and ready') );
        client.on('reconnecting', () => console.log('Redis reconnecting') );
        
        await client.connect()
            
        console.log("Connected to Redis");
    
    } else {
        
        console.log('Redis disabled');
    
    }

    /**
     *  Start http server
     */

    server.listen( port, () => {
        
        console.log(`Server listening on port ${port}`);
    
    } );

}

startServer();