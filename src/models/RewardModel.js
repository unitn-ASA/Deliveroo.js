var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// set up a mongoose model
module.exports = mongoose.model('Reward', new Schema({ 
	matchId: String,
	teamId: String,
	agentId: String,
	score: Number,
	time: Date
}), 'rewards' );

