import './scripts/generateGitRevision.js';
import httpServer from './src/httpServer.js';
import ioServer from './src/ioServer.js';
import config from './config.js';

async function start () {

    /**
     *  Start http server
     */

    httpServer.listen( config.PORT, () => {
        
        console.log(`Server listening on http://localhost:${config.PORT}`);
    
    } );

    /**
     * Start io server
     */

    // ioServer.listen( httpServer );


    
}

start();