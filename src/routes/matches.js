const express = require('express');
const router = express.Router();
const Arena = require('../deliveroo/Arena');
const { RewardModel } = require('../models/RewardModel');
const {createMatch, getCurrentMatchByRoomId, MatchModel} = require('../models/MatchModel');
const Room = require('../deliveroo/Room');
const { authorizeAdmin, authorizeUser } = require('../middlewares/tokens');

const matchDoc = new MatchModel();
/**
 * @typedef {typeof matchDoc} MatchDocType
*/



/**********************************************/
/*                  :roomId                   */
/**********************************************/
router.use('/', async ( /**@type {express.Request & {roomId:string, room:Room}}*/ req, res, next ) => {

    const roomId = req.roomId;
    const room = req.room;
    next();

});



/**********************************************/
/*                     GET                    */
/**********************************************/
router.get('/', async ( /**@type {express.Request & {roomId:string, room:Room}}*/ req, res ) => {
    
    const filter = {};
    var path = ``;

    if ( req.room ) {

        filter.roomId = req.room.id;
        var path = `/rooms/${req.room.id}`;
    
    } else if ( req.query.roomId ) {
    
        filter.roomId = req.query.roomId;
    
    }
    
    console.log( `GET ${req.originalUrl} - MatchModel.find( ${filter} )` );

    res.status(200).json( await MatchModel.find( filter ).exec() );

});



/**********************************************/
/*                    POST                    */
/**********************************************/
// Endpoint to start a new match in the room 
router.post('/', authorizeAdmin, async ( /**@type {express.Request & {roomId:string, room:Room}}*/ req, res ) => {

    console.log( `POST ${req.url}: ${req.body}` );

    // get Title of the match
    const matchTitle = req.body.matchTitle;
    
    // get the start time of the match
    const startTime = req.body.startTime;
    
    // get the end time of the match
    const endTime = req.body.endTime;
    
    // get the configuration of the match
    const config = req.body.config;

    // get roomId
    const roomId = req.roomId || req.params?.roomId || req.body.roomId;
    if ( ! roomId ) {
        console.error(`POST ${req.url} - Cannot create match, required param "roomId" not in req.params.roomId || req.body.roomId`)
        res.status(400).json({ message: `Cannot create match, roomId is required` });
        return;
    }

    // get the room
    let room = req.room || Arena.rooms.get(roomId);
    if ( ! room ) {
        console.log(`POST ${req.url} - Cannot create match, Room ${roomId} does not exist`)
        res.status(400).json({ message: `Cannot create match, Room ${roomId} does not exist` });
        return;
    }

    const match = await createMatch(
        roomId,
        matchTitle || 'match_room'+roomId+'_'+(new Date()).toLocaleDateString()+'_'+(new Date()).toLocaleTimeString(),
        startTime,
        endTime,
        config
    );
    
    res.status(201).location( `\\matches\\${match._id}` ).json( match );
});



/**********************************************/
/*                  :matchId                  */
/**********************************************/
/**
 * Middleware to check if match exists
 */
router.use('/:matchId', async ( /**@type {express.Request & {room:Room}}*/ req, res, next ) => {

    // :current not valid when room not specified
    if ( req.params.matchId == 'current' && ! req.room ) {
        
        console.log(`${req.method} ${req.url} - No room specified to resolve ":current" match`);
        res.status(404).send(`No room specified to resolve ":current" match`);
        return;

    }

    // when room specified resolves :current to the current matchId in the room
    if ( req.params.matchId == 'current' && req.room ) {

        var match = await getCurrentMatchByRoomId(req.room.id);
        
        if ( ! match ) {
            console.log(`${req.method} ${req.url} - No :current match in room ${req.room.id}`);
            res.status(404).send(`No :current match in room ${req.room.id}`);
            return;
        }

        req.params.matchId = match._id.toString();

    }

    // if both room specified and :matchId
    else if ( req.room ) {
        
        var match = await MatchModel.findOne({ roomId: req.room.id, _id: req.params.matchId }).exec();

        if ( ! match ) {
            console.log(`${req.method} ${req.url} - No match ${req.params.matchId} in room ${req.room.id}`);
            res.status(404).send(`No match ${req.params.matchId} in room ${req.room.id}`);
            return;
        }
        
        req.params.matchId = match._id.toString();

    }
    
    // if only :matchId
    else {
        
        var match = await MatchModel.findById( req.params.matchId ).exec();

        if ( ! match ) {
            console.log(`${req.method} ${req.url} - Match ${req.params.matchId} does not exist`);
            res.status(404).send(`Match ${req.params.matchId} does not exist`);
            return;
        }

    }
        
    // dynamically declare property in req object
    req['match'] = match;
    req['matchId'] = match._id.toString();
    next();

});



/**********************************************/
/*                    GET                     */
/**********************************************/
router.get('/:matchId', async ( /**@type {express.Request & {match:MatchDocType}}*/ req, res ) => {
    
    console.log( `GET ${req.originalUrl}` );

    res.status(200).json( req.match );

});



/**********************************************/
/*                   DELETE                   */
/**********************************************/
router.delete('/:matchId', authorizeAdmin, async ( /**@type {express.Request & {match:MatchDocType}}*/ req, res ) => {
  
    console.log( "DELETE /matches/"+req.params.matchId, req.body );

    const matchId = req.params.matchId;
    const match = req.match;
    
    await Promise.all([
        RewardModel.deleteMany( { matchId } ).exec(),
        MatchModel.deleteOne( { _id: matchId } ).exec()
    ])

    res.status(204).send();
  
});



/********************************************* */
/*                   STOP                      */
/********************************************* */
router.patch('/:matchId', authorizeAdmin, async ( /**@type {express.Request & {match:MatchDocType}}*/ req, res ) => {
  
    console.log( "PATCH /matches/"+req.params.matchId, req.body );

    const matchId = req.params.matchId;
    const match = req.match;

    if ( req.body?.status == 'end' ) {

        // set endTime to now
        match.endTime = new Date();
        await match.save();

    }
    
    res.status(200).json( match );

});



module.exports = router;
