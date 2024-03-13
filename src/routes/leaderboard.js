const express = require('express');
const router = express.Router();
const Leaderboard = require('../deliveroo/Leaderboard');

// Detailed leaderboard of current Arena
router.get('/', async (req, res) => {

    /* get query parameters for filtering given: team agent or match
    const matchId = req.query.matchId;
    const teamId = req.query.teamId;
    const agentId = req.query.agentId;
    const aggregateBy = req.query.aggregateBy; */

    // get query parameters for filtering given: team agent or match
    const matchId = req.headers['matchid'];
    const teamId = req.headers['teamid'];
    const agentId = req.headers['agentid'];
    const agentName = req.headers['agentname'];
    const aggregateBy = req.headers['aggregateby'];

    // filter
    const filter = {};
    if ( matchId ) filter.matchId = matchId;
    if ( teamId ) filter.teamId = teamId;
    if ( agentId ) filter.agentId = agentId;
    if ( agentName ) filter.agentName = agentName;
    
    // get query parameters for aggregation by: team agent or match
    const aggregate = [];
    console.log(aggregateBy)
    // if req.query has matchId as empty string '', then add to 'matchId' aggregateBy
    if ( matchId === '' && aggregateBy === 'true' ) aggregate.push('matchId');
    // if req.query has teamId as empty string '', then add to 'teamId' aggregateBy
    if ( teamId === '' && aggregateBy === 'true' ) aggregate.push('teamId');
    // if req.query has agentId as empty string '', then add to 'agentId' aggregateBy
    if ( agentId === '' && aggregateBy === 'true' ) aggregate.push('agentId');

    // Log
    console.log('GET leaderboard'+req.url, `RewardModel.aggregate().match(`, filter ,`).group(`, aggregate, `)` );

    try {
        let results = await Leaderboard.get(filter, aggregate).catch(console.error);
        //console.log(results)
        res.status(200).json(results); // return results
    } catch (error) {
        console.error(error);     // Log any errors occurred during the process
        res.status(500).json({ error: 'Internal Server Error' }); // Return a generic error response
    }
    
});

module.exports = router;
