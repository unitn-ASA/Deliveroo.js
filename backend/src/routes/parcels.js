import express from 'express';
import { myGrid } from '../myGrid.js';
import { authorizeAdmin } from '../middlewares/token.js';

const router = express.Router();

/**
 * @swagger
 * /api/parcels:
 *   get:
 *     summary: Get the list of parcels
 *     description: Retrieves the list of parcels currently in the game.
 *     tags: [Parcels]
 *     responses:
 *       200:
 *         description: List of parcels retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: ID of the parcel
 */

// GET /parcels get the list of all the parcels on the grid
router.get('/', async (req, res) => {

    console.log( `GET /api/parcels` );

    const parcels = Array.from( myGrid.parcelRegistry.getIterator() ).map( parcel => {
        return {
            id: parcel.id
        };
    });
    res.status(200).json( parcels );
  
});



/**
 * @swagger
 * /api/parcels:
 *   delete:
 *     summary: Remove all parcels
 *     description: Removes all parcels from the game.
 *     tags: [Parcels]
 *     security:
 *       - AdminQueryToken: []
 *         AdminHeaderToken: []
 *     responses:
 *       200:
 *         description: All parcels removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

// DELETE /parcels delete all parcels from the grid
router.delete('/', authorizeAdmin, async (req, res) => {

    console.log( `DELETE /api/parcels` );

    for ( const parcel of myGrid.parcelRegistry.getIterator() ) {
        myGrid.parcelRegistry.get( parcel.id )?.delete();
    }
    
    res.status(200).json( { message: 'All parcels deleted' } );

});



/**
 * @swagger
 * /api/parcels/{parcelId}:
 *   delete:
 *     summary: Remove a parcel
 *     description: Removes a parcel from the game.
 *     tags: [Parcels]
 *     parameters:
 *       - name: parcelId
 *         in: path
 *         required: true
 *         description: ID of the parcel to be removed
 *         schema:
 *           type: string
 *     security:
 *       - AdminQueryToken: []
 *         AdminHeaderToken: []
 *     responses:
 *       200:
 *         description: Parcel removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Parcel not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

// DELETE /parcels/:id delete an parcel from the grid
router.delete('/:id', authorizeAdmin, async (req, res) => {

    console.log( `DELETE /api/parcels/${req.params.id}` );

    const id = req.params.id;
    const parcel = myGrid.parcelRegistry.get( id );
    if ( parcel ) {
        myGrid.parcelRegistry.get( parcel.id )?.delete();
        res.status(200).json( { message: `Parcel ${id} deleted` } );
    } else {
        res.status(404).json( { message: `Parcel ${id} not found` } );
    }
  
});



export default router;
