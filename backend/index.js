import './scripts/generateGitRevision.js';
import httpServer from './src/httpServer.js';
import ioServer from './src/ioServer.js';
import { PORT } from './src/config/config.js';

async function start() {

    /**
     * Start http server and wait for it to be ready
     */
    await new Promise( res => {
        httpServer.listen(PORT, () => {
            console.log(`Server listening on http://localhost:${PORT}`);
            res(undefined);
        });
    });

    /**
     * Initialize Socket.IO server after HTTP server is listening
     */
    // const { default: ioServer } = await import('./src/ioServer.js');

    /**
     * Graceful shutdown
     * @param {string} signal - The signal that triggered the shutdown (e.g., 'SIGTERM', 'SIGINT')
     */
    const shutdown = (signal) => {
        console.log(`\n${signal} received: closing server gracefully...`);

        httpServer.close(() => {
            console.log('HTTP server closed');
            process.exit(0);
        });

        // Force close after 1 second
        setTimeout(() => {
            console.error('Forced shutdown after timeout');
            process.exit(0);
        }, 1000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
}

// Add timestamp to all console logs
const oldLog = console.log;
global.console.log = function ( ...message ) {
    oldLog.apply( console, [ new Date().toLocaleTimeString(), ...message ] );
}

start().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
