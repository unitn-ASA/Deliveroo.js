import express from 'express';
import { pluginRegistry } from '../plugins/runtime.js';
import { authorizeAdmin } from '../middlewares/token.js';

const router = express.Router();

/**
 * The missions REST surface operates on the missions plugin.
 * @returns {(import('../plugins/PluginBase.js').default & { describeMissions: () => object[] }) | null} null when the plugin is not running
 */
function getMissionsPlugin() {
    if (!pluginRegistry.isRunning('missions')) {
        return null;
    }
    return /** @type {import('../plugins/PluginBase.js').default & { describeMissions: () => object[] }} */ (pluginRegistry.get('missions'));
}

/**
 * @swagger
 * /api/missions:
 *   get:
 *     summary: Get the missions of the game
 *     description: 'Retrieves every mission of the game script (config.GAME.missions), including the ones still waiting for their start timer, with their prompts, bonuses, activation state and award statistics. Requires admin privileges: agents must interpret the announced prompts, not read the script.'
 *     tags: [Missions]
 *     responses:
 *       200:
 *         description: Missions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 missions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       index:
 *                         type: number
 *                         description: Position of the mission in the game script
 *                       type:
 *                         type: string
 *                         description: Mission type
 *                       prompt:
 *                         type: string
 *                         description: Prompt announced in chat
 *                       bonus:
 *                         type: number
 *                         description: Points awarded (negative for penalties)
 *                       unatantum:
 *                         type: boolean
 *                         description: Claimable at most once per agent
 *                       active:
 *                         type: boolean
 *                         description: Whether the start timer already fired
 *                       startsAt:
 *                         type: number
 *                         nullable: true
 *                         description: Epoch ms when the start timer fires, null once active
 *                       config:
 *                         type: object
 *                         description: Type-specific mission configuration
 *                       stats:
 *                         type: object
 *                         properties:
 *                           awards:
 *                             type: number
 *       403:
 *         description: Admin privileges required
 *       503:
 *         description: Missions plugin is not running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

// GET /missions get the missions of the current game script (admin only:
// the script holds the answers, agents only get the announced prompts)
router.get('/', authorizeAdmin, async (req, res) => {

    console.log( `GET /api/missions` );

    const missionsPlugin = getMissionsPlugin();
    if ( ! missionsPlugin ) {
        res.status(503).json( { message: `Missions plugin is not running` } );
        return;
    }

    res.status(200).json( { missions: missionsPlugin.describeMissions() } );

});

export default router;
