import express from 'express';
import { config, PORT } from '../config/config.js';
import { authorizeAdmin } from '../middlewares/token.js';
import { loadGameConfig } from '../config/config.js';

const router = express.Router();

/**
 * @swagger
 * /api/configs:
 *   get:
 *     summary: Get current configuration settings
 *     description: Retrieves the current configuration settings for the game.
 *     tags: [Configs]
 *     responses:
 *       200:
 *         description: Current configuration settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 PORT:
 *                   type: number
 *                   description: Server port
 *                 CLOCK:
 *                   type: number
 *                   description: Clock speed in milliseconds
 *                 AGENT_TIMEOUT:
 *                   type: number
 *                   description: Timeout for agent actions
 *                 BROADCAST_LOGS:
 *                   type: boolean
 *                   description: Whether logs are broadcast
 *                 PENALTY:
 *                   type: number
 *                   description: Penalty for invalid actions
 *                 GAME:
 *                   type: object
 *                   description: Game configuration
 */
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
 * @swagger
 * /api/configs:
 *   patch:
 *     summary: Update configuration settings
 *     description: Updates the configuration settings for the game.
 *     tags: [Configs]
 *     security:
 *       - AdminQueryToken: []
 *         AdminHeaderToken: []
 *     requestBody:
 *       description: The configuration settings to be updated. Only the fields that are present will be updated.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               BROADCAST_LOGS:
 *                 type: boolean
 *                 description: Enable or disable broadcast logs
 *               AGENT_TIMEOUT:
 *                 type: number
 *                 description: Timeout for agent actions
 *               CLOCK:
 *                 type: number
 *                 description: Clock speed in milliseconds
 *               PENALTY:
 *                 type: number
 *                 description: Penalty for invalid actions
 *               GAME:
 *                 type: object
 *                 description: Game configuration
 *     responses:
 *       200:
 *         description: Configuration settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 PORT:
 *                   type: number
 *                 CLOCK:
 *                   type: number
 *                 AGENT_TIMEOUT:
 *                   type: number
 *                 BROADCAST_LOGS:
 *                   type: boolean
 *                 PENALTY:
 *                   type: number
 */
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
