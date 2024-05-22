const express = require('express');
const router = express.Router();

const Arena = require('../deliveroo/Arena');
const Config = require('../deliveroo/Config');
const Room = require('../deliveroo/Room');
const Grid = require('../deliveroo/Grid');

const {authorizeAdmin, authorizeUser} = require('../middlewares/tokens');
const {MatchModel} = require('../models/MatchModel');

const matchDoc = new MatchModel();
/**
 * @typedef {typeof matchDoc} MatchDocType
*/


/**
 * https://stackoverflow.com/questions/27266857/how-to-annotate-express-middlewares-with-jsdoc
*/


/**
 * Middleware to check if the room exists
 */
router.use('/:roomId', async (req, res, next) => {

    const roomId = req.params.roomId;
    const room = Arena.getRoom(roomId);
    
    if ( room ) {

        // dynamically declare property in req object
        req['room'] = room;
        req['roomId'] = roomId;
        next();
    
    } else {

        console.log(`${req.method} /rooms/${roomId} - Room ${roomId} does not exist`)
        res.status(404).send(`Room ${roomId} does not exist`)
    
    }

});



/**
 * @typedef {Object} RoomJson
 * @property {string} roomId
 * @property {Config} config
 * property {Object|undefined} match
 * property {string} match.matchTitle
 * property {Date} match.startDate
 * property {Date} match.endDate
 * @property {boolean} freezed
 * 
 * @param {Room} room 
 * @returns {RoomJson} restRoom 
 */
function roomToJson( room ) {

    return {
        roomId: room.id,
        config: room.grid.config,
        // match: room.match ? {
        //   matchTitle: room.match.matchTitle,
        //   startDate: room.match.startTime,
        //   endDate: room.match.endTime
        // } : null,
        freezed: room.grid.freezed
    };

}



/********************************************* */
/*                     GET                     */
/********************************************* */

// GET all the rooms
router.get('/', async ( req, res ) => {
  
    console.log( `GET /rooms` );

    const rooms = Array.from( Arena.rooms.values() ).map( room => roomToJson(room) );
    res.status(200).json( rooms );

});

// GET one room
router.get('/:roomId', ( /**@type {express.Request & {room:Room}}*/req, res ) => {

    console.log( `GET /rooms/ ${req.params.roomId}` );

    const room = req.room;
    res.status(200).json( roomToJson( room ) );

});



/********************************************* */
/*                    POST                     */
/********************************************* */

// POST /room new room with a start match
router.post('/', authorizeAdmin, async (req, res) => {

    console.log( "POST /rooms", req.body );
    
    const config = new Config( req.body.config );

    try {
        
        const newRoom = Arena.createRoom( config );
        res.status( 200 ).location( newRoom.id ).json( roomToJson(newRoom) );

    } catch (error) {

            console.error( `POST /rooms - Error in the creation of the room with config ${config}.` );
            console.error( error );
            res.status(500).json({
                message: `Error in the creation of the room with config ${config}`,
                error: error
            });
    }
  
});



/********************************************* */
/*             Freeze / Reload Config          */
/********************************************* */

// PATCH /room/id
router.patch('/:roomId', authorizeAdmin, async ( /**@type {express.Request & {room:Room}}*/req, res ) => {
    
    const roomId = req.params.roomId;
    const room = req.room;
    const grid = req.room.grid;
    
    console.log( `PATCH /rooms/${roomId}`, req.body );

    // change the grid configuration and reload the grid
    if ( req.body?.config ) {

        await room.changeGrid( req.body.config );
        console.log(`PATCH /rooms/${roomId} - Grid reloaded with config ${room.grid.config}`);
    
    }

    // freeze or unfreeze the grid
    if ( req.body?.freezed === true ) {

        await grid.freeze();
        console.log(`PATCH /rooms/${room.id} - Grid freezed`);

    }
    else if ( req.body?.freezed === false ) {

        grid.unfreeze();
        console.log(`PATCH /rooms/${room.id} - Grid unfreezed`);

    }

    res.status(200).json( roomToJson(req.room) );

});



/********************************************* */
/*                   DELETE                    */
/********************************************* */

// DELETE /room/id
router.delete('/:roomId', authorizeAdmin, async (req, res) => {
  
    const roomId = req.params.roomId;

    console.log( `DELETE /rooms/${roomId}` );
    
    await Arena.deleteRoom( roomId );

    res.status(204).send();
  
});



/**********************************************/
/*                 SUB-RESOURCES              */
/**********************************************/



// GET /rooms/id/agents get the list of all the agents on the grid
router.get('/:roomId/agents', async (/**@type {express.Request & {room:Room}}*/req, res) => {

    console.log( `GET /rooms/${req.params.roomId}/agents` );

    const /** @type {Grid} */ grid = req.room.grid;

    const agents = Array.from( await grid.getAgents() ).map( agent => {
        return {
            id: agent.id,
            name: agent.name
        };
    });
    res.status(200).json( agents );
  
});



router.use('/:roomId/matches', require('./matches'));



module.exports = router;
