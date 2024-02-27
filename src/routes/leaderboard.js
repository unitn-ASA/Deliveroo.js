const router = require('express').Router();
const Leaderboard = require('../deliveroo/Leaderboard');

// Detailed leaderboard of current Arena
router.get('/', async (req, res) => {

    // get query parameters for filtering given: team agent or match
    const matchId = req.query.matchId;
    const teamId = req.query.teamId;
    const agentId = req.query.agentId;
    const aggregateBy = req.query.aggregateBy;

    // filter
    const filter = {};
    if ( matchId ) filter.matchId = matchId;
    if ( teamId ) filter.teamId = teamId;
    if ( agentId ) filter.agentId = agentId;
    
    // get query parameters for aggregation by: team agent or match
    const aggregate = [];
    if ( aggregateBy ) aggregate.push( aggregateBy );
    // if req.query has matchId as empty string '', then add to 'matchId' aggregateBy
    if ( matchId === '' ) aggregate.push('matchId');
    // if req.query has teamId as empty string '', then add to 'teamId' aggregateBy
    if ( teamId === '' ) aggregate.push('teamId');
    // if req.query has agentId as empty string '', then add to 'agentId' aggregateBy
    if ( agentId === '' ) aggregate.push('agentId');

    // Log
    console.log('GET leaderboard'+req.url, `RewardModel.aggregate().match(`, filter ,`).group(`, aggregate, `)` );

    // getting aggregated leaderboard
    let results = await Leaderboard.get( filter, aggregate ).catch( console.error );

    // return results
    res.status(200).json( results );
});

module.exports = router;
