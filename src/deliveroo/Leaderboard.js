const RewardModel = require('../models/RewardModel.js'); // get our mongoose model



// class Reward {
    
//     /** @type {string} match */
//     #match;
//     get match () { return this.#match; }

//     /** @type {string} team */
//     #team;
//     get team () { return this.#team; }

//     /** @type {string} id */
//     #id;
//     get id () { return this.#id; }

//     /** @type {number} score */
//     #score;
//     get score () { return this.#score; }
//     set score ( score ) { this.#score = score; }

//     /** @type {number} time */
//     #time;
//     get time () { return this.#time; }

//     constructor ( match, team, id, score, time ) {
//         this.#match = match;
//         this.#team = team;
//         this.#id = id;
//         this.#score = score;
//         this.#time = time;
//     }

// }



// /**
//  * @function predicate
//  * @param {Reward} value
//  * @param {number} index
//  * @param {Rewards} array
//  * @returns {boolean}
//  */
// const predicate = function ( value, index, array ) {
//     return true;
// }



// /**
//  * @extends {Array<Reward>}
//  */
// class Rewards extends Array {

//     constructor( ...rewards ) {
//         super( ...rewards );
//     }

//     /**
//      * @param {predicate} predicate A function that accepts up to three arguments. The filter method calls the predicate function one time for each element in the array.
//      */
//     filter ( predicate ) {
//         return new Rewards( super.filter( predicate ) );
//     }

//     /**
//      * @param {string} match 
//      * @returns {Rewards}
//      */
//     filterByMatch ( match ) {
//         return new Rewards( this.filter( r => r.match == match ) );
//     }

//     /**
//      * @param {string} match 
//      * @returns {Rewards}
//      */
//     filterByTeam ( team ) {
//         return new Rewards( this.filter( r => r.team == team ) );
//     }

//     /**
//      * @param {string} match 
//      * @returns {Rewards}
//      */
//     filterByAgent ( id ) {
//         return new Rewards( this.filter( r => r.id == id ) );
//     }

//     /**
//      * @param {...string} keys 
//      * @returns {Rewards}
//      */
//     aggregateBy ( ...keys ) {
//         const aggregated = new Rewards();
//         for ( let entry of this ) {
//             let find = aggregated.find( a => keys.every( k => a[k] == entry[k] )  );
//             for ( k of keys ) {
//                 if ( find )
//                     find.score += entry.score;
//                 else
//                     aggregated.push( entry );
//             }
//         }
//         return this.aggregated;
//     }

//     /** @returns {Rewards} */
//     aggregateByMatchTeamAgent () {
//         return this.aggregateBy( 'match', 'team', 'id' );
//     }

//     /** @returns {Rewards} */
//     aggregateByTeam () {
//         return this.aggregateBy( 'team' );
//     }

//     /** @returns {Rewards} */
//     aggregateByMatch () {
//         return this.aggregateBy( 'match' );
//     }

//     /** @returns {Rewards} */
//     aggregateByAgent () {
//         return this.aggregateBy( 'id' );
//     }

//     /** @returns {Rewards} */
//     aggregateByMatchTeam () {
//         return this.aggregateBy( 'match', 'team' );
//     }

//     /** @returns {Rewards} */
//     aggregateByMatchAgent () {
//         return this.aggregateBy( 'match', 'id' );
//     }

// }



class Leaderboard {

    /**
     * @param {{matchId:string, teamId:string, agentId:string}} filter e.g. {matchId: '123', teamId: 'team1', agentId: 'agent1'}
     * @param {string[]} groupByKeys if undef or empty array is passed, the following will be used ['matchId', 'teamId', 'agentId']
     * @returns { [RewardModel] }
     **/
    // get rewards () { return this.#rewards; }
    static async get ( {matchId, teamId, agentId} = {}, groupByKeys = [] ) {
        // match expression
        let matchExpression = {};
        if ( matchId ) matchExpression.matchId = { $eq: matchId };
        if ( teamId ) matchExpression.teamId = { $eq: teamId };
        if ( agentId ) matchExpression.agentId = { $eq: agentId };

        // group expression
        if ( groupByKeys.length == 0 ) groupByKeys = ['matchId', 'teamId', 'agentId'];
        let groupExpression = {}
        groupExpression._id = groupByKeys.map( k => '$' + k );
        if ( groupByKeys.includes('matchId') ) groupExpression.matchId = { $first: '$matchId' };
        if ( groupByKeys.includes('teamId') ) groupExpression.teamId = { $first: '$teamId' };
        if ( groupByKeys.includes('agentId') ) groupExpression.agentId = { $first: '$agentId' };
        groupExpression.score = { $sum: '$score' };
        groupExpression.history = { $push: { score: '$score', time: '$time' } };

        // console.log( 'Leaderboard.get()', 'matchExpression:', matchExpression, 'groupExpression:', groupExpression );
        
        // query mongoose with aggregation api
        let queried = await RewardModel        
            // aggregate results
            .aggregate()
            // filter results
            .match( matchExpression )
            // group results
            .group( groupExpression )
            // hide _id
            // .project( '-_id matchId teamId agentId score history' )
            .exec();

        // return results
        return queried;
    }

    /**
     * @param {string} matchId
     * @param {string} teamId
     * @param {string} agentId
     * @param {number} score
     */
    static async addReward ( matchId, teamId, agentId, score ) {
        // const reward = new Reward( matchId, teamId, agentId, score, Date.now() );
        // this.#rewards.push( reward );
        const reward = new RewardModel( {matchId, teamId, agentId, score, time: Date.now()} );
        return await reward.save();
    }

}



module.exports = Leaderboard;