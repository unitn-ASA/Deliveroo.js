import express from 'express';
import { agentComponentRegistry } from '../agentComponents/registry.js';

const router = express.Router();

/**
 * @swagger
 * /api/agent-presets:
 *   get:
 *     summary: List agent presets
 *     description: Returns the agent presets currently registered in the agent component registry. Presets attach per-agent components that register commands on each agent.
 *     tags: [Agents]
 *     responses:
 *       200:
 *         description: Agent presets retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 presets:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: [standard, ghost, push, rotation]
 */
router.get('/', (req, res) => {
    res.status(200).json({ presets: agentComponentRegistry.getPresets() });
});

export default router;
