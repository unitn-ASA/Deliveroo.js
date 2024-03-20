const redisClient = require('./src/redisClient');
const httpServer = require('./src/httpServer.js');
const ioServer = require('./src/ioServer');



const PORT = process.env.PORT || 8080;



async function start () {

    /**
     *  Start Redis
     */
    
    if ( redisClient ) {

        await redisClient.connect();
        console.log("Connected to Redis");
        
    } else {

        console.log('Redis disabled');

    }

    /**
     *  Start http server
     */

    httpServer.listen( PORT, () => {
        
        console.log(`Server listening on http://localhost:${PORT}`);
    
    } );

    /**
     * Start io server
     */

    ioServer.listen( httpServer );


    
}

start();