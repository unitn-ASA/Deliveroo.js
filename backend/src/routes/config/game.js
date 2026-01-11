import express from 'express';
import { myGrid } from '../../myGrid.js';
import { authorizeAdmin } from '../../middlewares/token.js';
import { loadMap } from '@unitn-asa/deliveroo-js-assets';
import { getGamesList, loadGame } from '@unitn-asa/deliveroo-js-assets';
import { config, loadGameConfig } from '../../config/config.js';

const router = express.Router();

/**
 * GET /api/config/game
 * Get current game configuration
 */
router.get('/', async (req, res) => {
    console.log(`GET /api/config/game`);
    res.status(200).json(config.GAME);
});

/**
 * GET /api/config/game/available
 * List all available games
 */
router.get('/available', async (req, res) => {
    console.log(`GET /api/config/game/available`);

    try {
        const games = getGamesList();
        const gameDetails = games.map(gameName => {
            const game = loadGame(gameName);
            return {
                name: gameName,
                title: game.title,
                description: game.description,
                maxPlayers: game.maxPlayers,
            };
        });

        res.status(200).json(gameDetails);
    } catch (error) {
        console.error(`GET /api/config/game/available: error`, error);
        res.status(500).json({ error: 'Failed to load games list' });
    }
});

/**
 * POST /api/config/game/load
 * Load a specific game configuration (admin only)
 * Body: { name: string } - Game name to load
 */
router.post('/load', authorizeAdmin, async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Game name is required' });
    }

    console.log(`POST /api/config/game/load: loading game "${name}"`);

    try {
        // Load game JSON
        const game = await loadGame(name);

        // Load map if specified
        if (game.map?.file) {
            const map = loadMap(game.map.file);
            myGrid.loadMap(map);
            console.log(`POST /api/config/game/load: loaded map ${game.map.file}`);
        }

        // Apply game configuration
        loadGameConfig(game);

        // Notify clients of game change
        const { default: ioServer } = await import('../../ioServer.js');
        ioServer.emit('config', { game: config.GAME });

        res.status(200).json(config.GAME);
    } catch (error) {
        console.error(`POST /api/config/game/load: error loading game "${name}"`, error);
        res.status(404).json({ error: `Game "${name}" not found or invalid` });
    }
});

export default router;
