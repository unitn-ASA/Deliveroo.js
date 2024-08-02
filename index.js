const redisClient = require('./src/redisClient');
const httpServer = require('./src/httpServer.js');
const ioServer = require('./src/ioServer');
const config = require('./config')
const readline = require('readline');

const PORT = process.env.PORT || 8080;

//Ask what plugins to add to the game and try to include them.
async function setupIoServer() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    let plugins = config.PLUGINS || [];   // load the default plugins 

    function askForPlugin() {
        return new Promise((resolve) => {
            rl.question('Enter plugin name to add (or "done" to finish): ', (answer) => {
                if (answer.toLowerCase() === 'done') {
                    rl.close();
                    resolve();
                } else {
                    plugins.push(answer);
                    resolve(askForPlugin());
                }
            });
        });
    }

    await askForPlugin();

    //addPlugin` is the method to add a plugin to ioServer
    plugins.forEach(plugin => {
        ioServer.addPlugin(plugin); 
    });

    console.log('ioServer configured with plugins:', plugins);
}

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
    await setupIoServer();
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