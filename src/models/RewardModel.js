var mongoose = require('mongoose');
const { MatchModel, getCurrentMatchByRoomId } = require('./MatchModel');
var Schema = mongoose.Schema;

// create the model using the schema
const RewardModel = mongoose.model('Reward', new Schema({
	match: mongoose.Types.ObjectId,
	roomId: String,
	matchId: String,
	teamId: String,
	teamName: String,
	agentId: String,
	agentName: String,
	score: Number,
	time: Date
}), 'rewards');



const findPromise = RewardModel.find().exec; // do not call this! Here only to get the type of the query
/**
 * @param {{matchId:string, roomId:string, teamId:string, agentId:string}} filter e.g. {matchId: '123', teamId: 'team1', agentId: 'agent1'}
 * @param {string[]} groupByKeys if undef or empty array is passed, the following will be used ['matchId', 'teamId', 'agentId']
 * @returns { ReturnType<typeof findPromise> }
 **/
async function readReward ( {matchId, roomId, teamId, agentId} = {matchId:undefined, roomId:undefined, teamId:undefined, agentId:undefined}, groupByKeys = [] ) {     

	// match expression
	let matchExpression = {};
	if ( matchId ) matchExpression.matchId = { $eq: matchId };
	if ( roomId ) matchExpression.roomId = { $eq: roomId };
	if ( teamId ) matchExpression.teamId = { $eq: teamId };
	if ( agentId ) matchExpression.agentId = { $eq: agentId };
	

	// group expression
	if ( groupByKeys.length == 0 ) groupByKeys = ['matchId', 'roomId', 'teamId', 'agentId'];
	let groupExpression = {}
	groupExpression._id = groupByKeys.map( k => '$' + k );
	if ( groupByKeys.includes('matchId') ) {
		groupExpression.matchId = { $first: '$matchId' };
	}
	if ( groupByKeys.includes('roomId') ) {
		groupExpression.roomId = { $first: '$roomId' };
	}
	if ( groupByKeys.includes('teamId') || groupByKeys.includes('agentId') ) {
		groupExpression.teamId = { $first: '$teamId' };
		groupExpression.teamName = { $first: '$teamName' };
	}
	if ( groupByKeys.includes('agentId') ) {
		groupExpression.agentId = { $first: '$agentId' };
		groupExpression.agentName = { $first: '$agentName' };
	}
	groupExpression.score = { $sum: '$score' };
	groupExpression.history = { $push: { score: '$score', time: '$time' } };
	
	// console.log( 'Leaderboard.get()', 'matchExpression:', matchExpression, 'groupExpression:', groupExpression );
	
	// query mongoose with aggregation api
	try {
		var queried = await RewardModel        
		// aggregate results
		.aggregate()
		// filter results
		.match( matchExpression )
		// group results
		.group( groupExpression )
		// hide _id
		// .project( '-_id matchId teamId agentId score history' )
		.exec();
	} catch (error) {
		console.error(error); // Log any errors occurred during the process
		return [];
	}
	
	// return results
	return queried;
}



/**
 * @param {{roomId:string, teamId:string, teamName:string, agentId:string, agentName:string, score:number}} param0
 */
async function addReward ( {roomId, teamId, teamName, agentId, agentName, score} ) {

	// console.log(`/${roomId}/${agentName}-${teamName}-${agentId} Leaderboard.addReward(${score})`);

	// retrieve matchId
	const match = await getCurrentMatchByRoomId(roomId);
	const matchId = match?._id;
	
	try{

		var reward = new RewardModel( {roomId, matchId, teamId, teamName, agentId, agentName, score, time: Date.now()} );
		await reward.save();
	
	} catch (error) {
		console.error(error);
	}

}

module.exports = { RewardModel, readReward, addReward};