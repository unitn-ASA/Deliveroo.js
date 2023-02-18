const server = require('./src/server.js');

const port = 8080;

server.listen( port, () => {
    
    console.log(`Server listening on port ${port}`);

} );