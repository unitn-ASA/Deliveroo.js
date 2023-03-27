const http = require('http');
const { Server } = require("socket.io");
const app = require('./expressApp');
const game = require('./game');
const myGrid = require('./myGrid');



const server = http.createServer(app);

const io = new Server( server, {
    cors: {
        origin: "*", // http://localhost:3000",
        methods: ["GET", "POST"]
    }
} );

game(io, myGrid)



module.exports = server;