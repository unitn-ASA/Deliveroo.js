var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// https://mongoosejs.com/docs/subdocs.html
// https://mongoosejs.com/docs/schematypes.html



// setup a mongoose model
const MatchModel = mongoose.model('Match', new Schema({
	matchTitle: String,
	roomId: String,
	config: Object,
	// teams: [{
	// 	teamId: String,
	// 	teamName: String,
	// 	score: Number
	// }],
	// agents: [{
	// 	agentId: String,
	// 	agentName: String,
	// 	score: Number
	// }],
	startTime: Date,
	endTime: Date
}), 'matches');


const matchDoc = new MatchModel();
/**
 * @typedef {typeof matchDoc} MatchDocType
*/



const findPromise = MatchModel.find().exec; // do not call this! Here only to get the type of the query
/**
 * Return all matches in the database
 * @returns { ReturnType<typeof findPromise> }
*/
async function getMatches() {
	const matches = await MatchModel.find().exec();
	return matches;
}



/**
 * Return all matches in current room
 * @returns { ReturnType<typeof findPromise> }
*/
async function getMatchesByRoomId ( roomId ) {
	return await MatchModel.find({ roomId: roomId }).exec();
}



const findOnePromise = MatchModel.findById().exec; // do not call this! Here only to get the type of the query
/**
 * Return current or next match in the room
 * @param {*} roomId 
 * @returns { ReturnType<typeof findOnePromise> }
 */
async function getCurrentMatchByRoomId ( roomId ) {
	return await MatchModel
		.findOne({ roomId: roomId, endTime: { $gt: new Date() } })
		.sort({ startTime: 1 })
		.exec();
}



/**
 * Create a new match and stop current
 * @param {String} roomId
 * @param {String} matchTitle
 * @param {Date} startTime
 * @param {Date} endTime
 * @param {Object} config
 * @returns {Promise<ReturnType<typeof MatchModel.create[]>>}
 */
async function createMatch ( roomId, matchTitle, startTime, endTime, config ) {
	stopCurrentMatch( roomId );
	startTime = startTime > new Date() ? startTime : new Date( Date.now() + 1000 * 10 );
	endTime = endTime > startTime ? endTime : new Date( startTime.getTime() + 1000 * 60 * 5 );
	const match = new MatchModel({
		matchTitle: matchTitle,
		roomId: roomId,
		config: config,
		startTime: startTime,
		endTime: endTime
	});
	await match.save();
	return match;
}


async function stopCurrentMatch ( roomId ) {
	const currentMatch = await getCurrentMatchByRoomId( roomId );
	if ( currentMatch ) {
		currentMatch.endTime = new Date();
		await currentMatch.save();
	}
	return currentMatch;
}



module.exports =  {MatchModel, getMatches, getMatchesByRoomId, getCurrentMatchByRoomId, createMatch, stopCurrentMatch};


