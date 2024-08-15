const redisClient = require('./src/redisClient');
const httpServer = require('./src/httpServer.js');
const ioServer = require('./src/ioServer');
const selectorPlugin = require('./src/selectorPlugin')
const config = require('./config')

const PORT = process.env.PORT || 8080;

async function start () {

    /**
     *  Start Redis
     */
    
    if ( redisClient ) {

        // await redisClient.connect();
        console.log("Connected to Redis");
        
    } else {

        console.log('Redis disabled');

    }

    /**
     * Setup  io server
     */
    await selectorPlugin();
    console.log('game configuration: ', config)
    await ioServer.init();

    /**
     *  Start http server
     */

    await httpServer.listen( PORT, () => {
        
        console.log(`Server listening on http://localhost:${PORT}`);
    
    } );

    /**
     * Start io server
     */
    ioServer.listen( httpServer );
   
}

start();