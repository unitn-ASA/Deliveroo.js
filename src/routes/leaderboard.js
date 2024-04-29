const express = require('express');
const router = express.Router();
const Leaderboard = require('../deliveroo/Leaderboard');
const Arena = require('../deliveroo/Arena')

// Detailed leaderboard of current Arena
router.get('/', async (req, res) => {

    /* get query parameters for filtering given: team agent or match
    const matchId = req.query.matchId;
    const teamId = req.query.teamId;
    const agentId = req.query.agentId;
    const aggregateBy = req.query.aggregateBy; */

    // get query parameters for filtering given: team agent or match
    const roomId = req.headers['roomid'];
    let matchId = req.headers['matchid'];
    const teamId = req.headers['teamid'];
    const agentId = req.headers['agentid'];
    const agentName = req.headers['agentname'];
    const aggregateBy = req.headers['aggregateby'];

    // find the last game of the match 
    if(roomId){
        let room = await Arena.getRoom(roomId);
        if(!room){ 
            console.log('GET leaderbord: request for a non existing room, id:', roomId) 
            res.status(400).json({ error: 'Room non existing' })
            return
        }
        matchId = room.match.id
    }
    
    //console.log('MATCH ID: ', matchId)

    // filter
    const filter = {};
    if ( matchId ) filter.matchId = matchId;
    if ( teamId ) filter.teamId = teamId;
    if ( agentId ) filter.agentId = agentId;
    if ( agentName ) filter.agentName = agentName;
    
    // get query parameters for aggregation by: team agent or match
    const aggregate = [];
    // if req.query has matchId as empty string '', then add to 'matchId' aggregateBy
    if ( matchId === '' && aggregateBy === 'true' ) aggregate.push('matchId');
    // if req.query has teamId as empty string '', then add to 'teamId' aggregateBy
    if ( teamId === '' && aggregateBy === 'true' ) aggregate.push('teamId');
    // if req.query has agentId as empty string '', then add to 'agentId' aggregateBy
    if ( agentId === '' && aggregateBy === 'true' ) aggregate.push('agentId');

    // Log
    //console.log('GET leaderboard:'+ `RewardModel.aggregate().match(`, filter ,`).group(`, aggregate, `)` );

    try {
        let results = await Leaderboard.get(filter, aggregate).catch(console.error);
        res.status(200).json(results); // return results
    } catch (error) {
        console.error(error);     // Log any errors occurred during the process
        res.status(500).json({ error: 'Internal Server Error' }); // Return a generic error response
    }
    
});

module.exports = router;

