import express from 'express';
const router = express.Router();
import { myGrid } from '../myGrid.js';
import { authorizeAdmin } from '../middlewares/token.js';

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
    const agents = Array.from( await myGrid.agentRegistry.getIterator() ).map( agent => {
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
    const agent = myGrid.agentRegistry.get( id );
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
 *       400:
 *         description: Score or penalty not provided
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
// PATCH /agents/:id update an agent's score
router.patch('/:id', authorizeAdmin, async (req, res) => {

    // log a message on same line as previous log
    process.stdout.write( `PATCH /api/agents/${req.params.id} ${JSON.stringify(req.body)}: ` );

    const id = req.params.id;
    const agent = myGrid.agentRegistry.get( id );
    if ( agent ) {
        if ( req.body.score !== undefined || req.body.penalty !== undefined ) {
            if ( req.body.score !== undefined )
                agent.score = Number.parseInt(req.body.score);
            if ( req.body.penalty !== undefined )
                agent.penalty = Number.parseInt(req.body.penalty);
            res.status(200).json( { message: `Agent ${id} updated`, score: agent.score, penalty: agent.penalty } );
        } else {
            res.status(400).json( { message: `Score or penalty not provided` } );
        }
        console.log( `${agent.name}(${agent.id})`, JSON.stringify({score: agent.score, penalty: agent.penalty}) );
    } else {
        res.status(404).json( { message: `Agent ${id} not found` } );
        console.warn( `Agent ${id} not found` );
    }
  
});



export default router;
