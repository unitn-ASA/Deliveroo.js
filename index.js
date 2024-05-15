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
    if ( process.env.DB_URL ) {
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

    }

    /**
     * Use mongodb-memory-server-global
     */
    if ( ! app.locals.db ) {
        const { MongoMemoryServer } = require('mongodb-memory-server-global');
        const mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        app.locals.db = await mongoose.connect(uri, {});
        console.log("Connected to MongoDB in memory");
    }
    
    /**
     *  Start http server
     */
    const httpServer = createServer(app);

    const server = await new ioServer(httpServer);  

    httpServer.listen( PORT, () => {
        
        console.log(`Server listening on http://localhost:${PORT}`);
    
    } );
    
}

start();