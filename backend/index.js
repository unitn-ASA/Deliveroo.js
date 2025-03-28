require('./scripts/generateGitRevision.js');
const httpServer = require('./src/httpServer.js');
const ioServer = require('./src/ioServer');
const {PORT} = require('./config');



async function start () {

    /**
     *  Start http server
     */

    httpServer.listen( PORT, () => {
        
        console.log(`Server listening on http://localhost:${PORT}`);
    
    } );

    /**
     * Start io server
     */

    // ioServer.listen( httpServer );


    
}

start();