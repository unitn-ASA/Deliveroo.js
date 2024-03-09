const app = require('./src/app.js');
const { createServer } = require('http');
const ioServer = require('./src/ioServer.js');
const mongoose = require('mongoose');


const PORT = process.env.PORT || 8080;

async function start () {    

    /**
     * Connect to MongoDB
     */
    // mongoose.Promise = global.Promise;
    try {
        // const connection = mongoose.createConnection(process.env.DB_URL);
        // app.locals.db = await connection.asPromise();
        // console.log("Connected to MongoDB at", connection.host, connection.port, connection.name);
        
        app.locals.db = await mongoose.connect(process.env.DB_URL, {});
        console.log("Connected to MongoDB");
    } catch (error) {
        // Gestione degli errori in caso di fallimento della connessione
        console.log("Not connected to MongoDB", error);
    }
    
    /**
     *  Start http server
     */
    const httpServer = createServer(app);

    new ioServer( httpServer );

    httpServer.listen( PORT, () => {
        
        console.log(`Server listening on port ${PORT}`);
    
    } );
    
}

start();