import express from 'express';
import { myNPCSpawner } from '../myGrid.js';
import { authorizeAdmin } from '../middlewares/token.js';

const router = express.Router();

/**
 * @swagger
 * /api/npcs:
 *   get:
 *     summary: Get the list of NPC controlled agents
 *     description: Retrieves the list of NPC controlled agents currently in the game.
 *     tags: [NPCs]
 *     responses:
 *       200:
 *         description: List of NPC controlled agents retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/NPC'
 */

// GET /npcs get the list of all npcs on the grid
router.get('/', async (req, res) => {

    console.log( `GET /api/npcs` );

    const agents = Array.from( myNPCSpawner.NPCs.values() ).map( npc => {
        return {
            id: npc.agent.id,
            name: npc.agent.name,
            agent: npc.agent,
            running: npc.running,
            stopRequested: npc.stopRequested
        };
    });
    res.status(200).json( agents );
  
});



/**
 * @swagger
 * /api/npcs/{npcId}:
 *   get:
 *     summary: Get an NPC controlled agent
 *     description: Retrieves a specific NPC controlled agent from the game.
 *     tags: [NPCs]
 *     parameters:
 *       - name: npcId
 *         in: path
 *         required: true
 *         description: ID of the NPC controlled agent
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: NPC controlled agent retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NPC'
 *       404:
 *         description: NPC not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

// GET /npcs/:id get the npc with id
router.get('/:id', async (req, res) => {

    console.log( `GET /npcs/${req.params.id}` );

    const npc = myNPCSpawner.NPCs.get( req.params.id );
    if ( npc ) {
        res.status(200).json( {
            id: npc.agent.id,
            name: npc.agent.name,
            agent: npc.agent,
            running: npc.running,
            stopRequested: npc.stopRequested
        } );
    }
    else {
        res.status(404).json( { message: `NPC ${req.params.id} not found` } );
    }
  
});



/**
 * @swagger
 * /api/npcs/{npcId}:
 *   patch:
 *     summary: Update an NPC controlled agent's information
 *     description: Updates the information of an NPC controlled agent in the game.
 *     tags: [NPCs]
 *     parameters:
 *       - name: npcId
 *         in: path
 *         required: true
 *         description: ID of the NPC controlled agent to be updated
 *         schema:
 *           type: string
 *     security:
 *       - AdminQueryToken: []
 *         AdminHeaderToken: []
 *     requestBody:
 *       description: The NPC controlled agent information to be updated. Only the fields that are present will be updated.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               running:
 *                 type: boolean
 *                 description: Indicates if the NPC controlled agent is running
 *               stopRequested:
 *                 type: boolean
 *                 description: Indicates if a stop request has been made for the NPC controlled agent
 *     responses:
 *       200:
 *         description: NPC controlled agent information updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NPC'
 *       404:
 *         description: NPC not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

// PATCH /npcs/:id start or stop the npc with id
router.patch('/:id', authorizeAdmin, async (req, res) => {

    console.log( `PATCH /api/npcs/${req.params.id}`, req.body );

    const npc = myNPCSpawner.NPCs.get( req.params.id );
    if ( npc ) {
        if ( req.body.running && ! npc.running ) {
            npc.start();
        }
        else if ( req.body.stopRequested && ! npc.stopRequested ) {
            npc.stop();
        }
        res.status(200).json( {
            id: npc.agent.id,
            name: npc.agent.name,
            agent: npc.agent,
            running: npc.running,
            stopRequested: npc.stopRequested
        } );
    }
    else {
        res.status(404).json( { message: `NPC ${req.params.id} not found` } );
    }
  
});



/**
 * @swagger
 * /api/npcs:
 *   post:
 *     summary: Create a new NPC controlled agent
 *     description: Creates a new NPC controlled agent in the game.
 *     tags: [NPCs]
 *     security:
 *       - AdminQueryToken: []
 *         AdminHeaderToken: []
 *     requestBody:
 *       description: The NPC controlled agent information to create.
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the NPC
 *               x:
 *                 type: number
 *                 description: Initial X coordinate
 *               y:
 *                 type: number
 *                 description: Initial Y coordinate
 *     responses:
 *       200:
 *         description: NPC controlled agent created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NPC'
 *       500:
 *         description: No NPC spawners available
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

// POST /npcs create a new npc
router.post('/', authorizeAdmin, async (req, res) => {

    console.log( `POST /api/npcs`, req.body );

    if ( myNPCSpawner.NPCs.size === 0 ) {
        res.status(500).json( { message: `No NPC spawners available` } );
        return;
    }
    
    const npc = myNPCSpawner.createNPC(req.body);

    res.status(200).json( {
        id: npc.agent.id,
        name: npc.agent.name,
        agent: npc.agent,
        running: npc.running,
        stopRequested: npc.stopRequested
    } );

});



export default router;
