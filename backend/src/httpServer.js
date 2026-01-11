import { createServer } from 'http';
import app from './app.js';
import { PORT } from './config/config.js';

const httpServer = createServer(app);

// Track open connections so we can destroy them on shutdown.
const connections = new Set();

httpServer.on('connection', (socket) => {
    connections.add(socket);
    socket.on('close', () => connections.delete(socket));
});

httpServer.on('error', (err) => {
    if (err['code'] === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please choose a different port or stop the other process.`);
        process.exit(1);
    } else {
        console.error('HTTP server error:', err);
        process.exit(1);
    }
});

export default httpServer;