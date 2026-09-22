import express from 'express';
const router = express.Router();
import { myGrid } from '../myGrid.js';
import { authorizeAdmin, authorizeUser } from '../middlewares/token.js';

/** @typedef {import("@unitn-asa/deliveroo-js-sdk").IOAgent} IOAgent */

/**
 * @swagger
 * /api/agents:
 *   get:
 *     summary: Get the list of agents
 *     description: Retrieves the list of agents currently in the game.
 *     tags: [Agents]
 *     responses:
 *       200:
 *         description: List of agents retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Agent'
 */
// GET /agents get the list of all the agents on the grid
router.get('/', async (req, res) => {

    console.log( `GET /api/agents` );

    /** @type {IOAgent[]} */
    const agents = Array.from( await myGrid.agents.getIterator() ).map( agent => {
        return {
            id: agent.id,
            name: agent.name,
            teamId: agent.teamId,
            teamName: agent.teamName,
            score: agent.score,
            penalty: agent.penalty
        };
    });
    res.status(200).json( agents );
  
});



/**
 * @swagger
 * /api/agents/{agentId}/commands:
 *   get:
 *     summary: Get the commands available to an agent
 *     description: |
 *       Lists every command registered on the agent's command bus, native
 *       ones included (up, down, left, right, pickup, putdown). Commands are
 *       joystick-like buttons, parameterless in practice; the optional
 *       descriptor documents each command and is exposed here. Commands are
 *       invoked through the socket 'action' event, acknowledged with the
 *       IOActionEnvelope ({ success, result | error }). Readable by the
 *       agent itself or by an admin.
 *     tags: [Agents]
 *     parameters:
 *       - name: agentId
 *         in: path
 *         required: true
 *         description: ID of the agent
 *         schema:
 *           type: string
 *     security:
 *       - AdminQueryToken: []
 *         AdminHeaderToken: []
 *     responses:
 *       200:
 *         description: Commands available to the agent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 commands:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       command:
 *                         type: string
 *                       owner:
 *                         type: string
 *                       description:
 *                         type: string
 *                       params:
 *                         type: object
 *                         additionalProperties:
 *                           type: string
 *                         description: Documentation-only type labels, reserved for future plugin commands
 *       403:
 *         description: Only the agent itself or an admin can read the list
 *       404:
 *         description: Agent not found
 */
// GET /agents/:id/commands list the commands available to an agent
router.get('/:id/commands', authorizeUser, async (req, res) => {

    const id = req.params.id;

    if ( req['payload'].id !== id && req['payload'].role !== 'admin' ) {
        return res.status(403).json( { message: `Only the agent itself or an admin can read the command list` } );
    }

    const agent = myGrid.agents.get( id );
    if ( ! agent ) {
        return res.status(404).json( { message: `Agent ${id} not found` } );
    }

    res.status(200).json( { commands: agent.commands.getRegisteredCommands() } );

});



/**
 * @swagger
 * /api/agents/{agentId}:
 *   delete:
 *     summary: Remove an agent
 *     description: Removes an agent from the game.
 *     tags: [Agents]
 *     parameters:
 *       - name: agentId
 *         in: path
 *         required: true
 *         description: ID of the agent to be removed
 *         schema:
 *           type: string
 *     security:
 *       - AdminQueryToken: []
 *         AdminHeaderToken: []
 *     responses:
 *       200:
 *         description: Agent removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Agent not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
// DELETE /agents/:id delete an agent from the grid
router.delete('/:id', authorizeAdmin, async (req, res) => {

    console.log( `DELETE /api/agents/${req.params.id}` );

    const id = req.params.id;
    const agent = myGrid.agents.get( id );
    if ( agent ) {
        agent.delete();
        res.status(200).json( { message: `Agent ${id} deleted` } );
    } else {
        res.status(404).json( { message: `Agent ${id} not found` } );
    }
  
});



/**
 * @swagger
 * /api/agents/{agentId}:
 *   patch:
 *     summary: Update an agent's information
 *     description: Updates the information of an agent in the game.
 *     tags: [Agents]
 *     parameters:
 *       - name: agentId
 *         in: path
 *         required: true
 *         description: ID of the agent to be updated
 *         schema:
 *           type: string
 *     security:
 *       - AdminQueryToken: []
 *         AdminHeaderToken: []
 *     requestBody:
 *       description: The agent information to be updated. Only the fields that are present will be updated.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               score:
 *                 type: number
 *                 description: Current score of the agent
 *               penalty:
 *                 type: number
 *                 description: Current penalty of the agent
 *               attributes:
 *                 type: object
 *                 description: Observable attributes to write (merge; no deletion). Values must be numbers or strings, e.g. {"movement_mode": "ghost", "rank": 5}
 *                 additionalProperties:
 *                   oneOf:
 *                     - type: number
 *                     - type: string
 *     responses:
 *       200:
 *         description: Agent information updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 score:
 *                   type: number
 *                 penalty:
 *                   type: number
 *                 attributes:
 *                   type: array
 *                   description: The updated observable attributes, in the same format exposed by sensing
 *                   items:
 *                     type: object
 *                     properties:
 *                       kind:
 *                         type: string
 *                       value:
 *                         oneOf:
 *                           - type: number
 *                           - type: string
 *                       max:
 *                         type: number
 *       400:
 *         description: No supported field provided
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Agent not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
// PATCH /agents/:id update an agent's score, penalty, or observable attributes
router.patch('/:id', authorizeAdmin, async (req, res) => {

    // log a message on same line as previous log
    process.stdout.write( `PATCH /api/agents/${req.params.id} ${JSON.stringify(req.body)}: ` );

    const id = req.params.id;
    const agent = myGrid.agents.get( id );
    if ( agent ) {
        if ( req.body.attributes !== undefined ) {
            const attributes = req.body.attributes;
            if ( typeof attributes !== 'object' || attributes === null || Array.isArray( attributes ) ) {
                return res.status(400).json( { message: `attributes must be an object mapping kinds to number or string values` } );
            }
            for ( const [kind, value] of Object.entries( attributes ) ) {
                if ( typeof value !== 'number' && typeof value !== 'string' ) {
                    return res.status(400).json( { message: `attribute '${kind}' must be a number or a string` } );
                }
            }
            // Merge each kind onto the observable attributes (no deletion):
            // watchers and plugins react to the changes
            for ( const [kind, value] of Object.entries( attributes ) ) {
                agent.attributes.set( kind, value );
            }
        }
        if ( req.body.score !== undefined || req.body.penalty !== undefined ) {
            if ( req.body.score !== undefined )
                agent.score = Number.parseInt(req.body.score);
            if ( req.body.penalty !== undefined )
                agent.penalty = Number.parseInt(req.body.penalty);
        }
        if ( req.body.score === undefined && req.body.penalty === undefined && req.body.attributes === undefined ) {
            return res.status(400).json( { message: `Score, penalty, or attributes not provided` } );
        }
        res.status(200).json( {
            message: `Agent ${id} updated`,
            score: agent.score,
            penalty: agent.penalty,
            attributes: agent.attributes.toArray(),
            components: agent.commands.getRegisteredCommands()
        } );
        console.log( `${agent.name}(${agent.id})`, JSON.stringify({score: agent.score, penalty: agent.penalty}) );
    } else {
        res.status(404).json( { message: `Agent ${id} not found` } );
        console.warn( `Agent ${id} not found` );
    }
  
});



export default router;
