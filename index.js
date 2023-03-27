/**
 * https://app.aspecto.io/ Open Telemetry
 * https://docs.aspecto.io/v1/send-tracing-data-to-aspecto/aspecto-sdk/nodejs/customize-defaults/advanced
 */
const instrument = require('@aspecto/opentelemetry');
instrument({
    aspectoAuth: 'e2a48aeb-1ae2-495e-bd9d-056fffd9a95d',
    serviceName: 'deliveroo.js-service',
    env: process.ENV || 'dev'
});



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