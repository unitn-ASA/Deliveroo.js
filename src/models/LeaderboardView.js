const {readReward} = require('./RewardModel.js');



/**
 * @typedef {Object} LeaderboardView
 * @property {string} matchId
 * @property {{agentId: string, agentName: string, score: number}[]} agents
 * @property {{teamId: string, teamName: string, score: number}[]} teams
 */



class Leaderboard {



    /**
     * Get score of a team in a match or overall in the server
     * @param {{roomId:string, matchId:string, teamId:undefined, agentId:undefined}} filter
     * @returns {Promise<Leaderboard>}
     */
    static async read ( filter = {roomId: undefined, matchId: undefined, agentId: undefined, teamId: undefined} ) {
        
        const agents = await readReward( filter, ['agentId'] );
        const teams = await readReward( filter, ['teamId'] );
        
        return {
            matchId: filter?.matchId,
            roomId: filter?.roomId,
            agents: agents.map( a => {
                return {
                    agentId: a.agentId,
                    agentName: a.agentName,
                    score: a.score
                }
            }),
            teams: teams.map( t => {
                return {
                    teamId: t.teamId,
                    teamName: t.teamName,
                    score: t.score
                }
            })
        };

    }

    // /**
    //  * Get score of a team in a match
    //  * @param {string} matchId
    //  * @param {string} teamId
    //  * @returns {Promise<number>}
    //  */
    // static async getTeamScore ( matchId, teamId ) {
    //     const reward = await readReward( {matchId, teamId, agentId: undefined}, ['matchId'] );
    //     if ( reward.length == 0 ) return 0;
    //     return reward[0].score;
    // }

    // /**
    //  * Get score of an agent in a match
    //  * @param {string} matchId
    //  * @param {string} agentId
    //  * @returns {Promise<number>}
    //  **/
    // static async getAgentScore ( matchId, agentId ) {
    //     const reward = await readReward( {matchId, teamId: undefined, agentId}, ['agentId'] );
    //     if ( reward.length == 0 ) return 0;
    //     return reward[0].score;
    // }



    // /**
    //  * Return all matches in the database
    //  * @returns {Promise<mongoose.Document<unknown,{},MatchDocType>[]>}
    //  */
    // static async getMatches() {
    //     const matches = await MatchModel.find().exec();
    //     return matches;
    // }

}



module.exports = Leaderboard;