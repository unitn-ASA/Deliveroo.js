var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// set up a mongoose model
module.exports = mongoose.model('Reward', new Schema({ 
	roomId: String,
	matchId: String,
	teamId: String,
	teamName: String,
	agentId: String,
	agentName: String,
	score: Number,
	time: Date
}), 'rewards' );

