const express = require('express');
const router = express.Router();
const { myGrid } = require('../grid');
const { authorizeAdmin } = require('../middlewares/token');



// GET /parcels get the list of all the parcels on the grid
router.get('/', async (req, res) => {

    console.log( `GET /api/parcels` );

    const parcels = Array.from( await myGrid.getParcels() ).map( parcel => {
        return {
            id: parcel.id
        };
    });
    res.status(200).json( parcels );
  
});



// DELETE /parcels delete all parcels from the grid
router.delete('/', authorizeAdmin, async (req, res) => {

    console.log( `DELETE /api/parcels` );

    for ( const parcel of myGrid.getParcels() ) {
        myGrid.deleteParcel( parcel.id );
    }
    
    res.status(200).json( { message: 'All parcels deleted' } );

});



// DELETE /parcels/:id delete an parcel from the grid
router.delete('/:id', authorizeAdmin, async (req, res) => {

    console.log( `DELETE /api/parcels/${req.params.id}` );

    const id = req.params.id;
    const parcel = myGrid.getParcel( id );
    if ( parcel ) {
        myGrid.deleteParcel( parcel.id );
        res.status(200).json( { message: `Parcel ${id} deleted` } );
    } else {
        res.status(404).json( { message: `Parcel ${id} not found` } );
    }
  
});



module.exports = router;
