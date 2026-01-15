import express from 'express';
import { config, PORT } from '../config/config.js';
import { authorizeAdmin } from '../middlewares/token.js';
import { loadGameConfig } from '../config/config.js';

const router = express.Router();

/**
 * GET /api/config/server
 * Get server configuration
 */
router.get('/', async (req, res) => {
    console.log(`GET /api/config/server`);

    const serverConfig = {
        PORT: PORT,
        CLOCK: config.CLOCK,
        AGENT_TIMEOUT: config.AGENT_TIMEOUT,
        BROADCAST_LOGS: config.BROADCAST_LOGS,
        PENALTY: config.PENALTY,
        GAME: config.GAME,
    };

    res.status(200).json(serverConfig);
});

/**
 * PATCH /api/config/server
 * Update server configuration (admin only)
 * Note: Some settings like PORT require server restart
 */
router.patch('/', authorizeAdmin, async (req, res) => {
    console.log(`PATCH /api/config/server`, req.body);

    // Update only server-configurable properties
    const updatable = ['BROADCAST_LOGS', 'AGENT_TIMEOUT', 'CLOCK', 'PENALTY'];

    for (const key of updatable) {
        if (req.body[key] !== undefined && config[key] !== req.body[key]) {
            config[key] = req.body[key];
            console.log(`PATCH /api/config/server: ${key} = ${req.body[key]}`);
        }
    }

    if ( req.body['GAME'] !== undefined ) {
            // Apply game configuration
            loadGameConfig(req.body['GAME']);
    }

    // Notify clients of config change
    const { default: ioServer } = await import('../ioServer.js');
    ioServer.emit('config', config);

    res.status(200).json({
        PORT: PORT,
        CLOCK: config.CLOCK,
        AGENT_TIMEOUT: config.AGENT_TIMEOUT,
        BROADCAST_LOGS: config.BROADCAST_LOGS,
        PENALTY: config.PENALTY,
    });
});

export default router;
