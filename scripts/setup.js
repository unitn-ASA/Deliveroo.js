require('dotenv').config();
var RewardModel = require('../src/models/RewardModel'); // get our mongoose model
var Leaderboard = require('../src/deliveroo/Leaderboard');
var mongoose = require('mongoose');



// connect to database
mongoose.connect(process.env.DB_URL, {})
.then ( async () => {
	console.log("Connected to Database");

	// delete all from mongoose collection RewardModel
	await RewardModel.deleteMany({});

	var leaderboard = new Leaderboard( );
	leaderboard.addReward( 'match1', 'team1', 'agent1', 100 );
	leaderboard.addReward( 'match1', 'team1', 'agent2', 200 );
	leaderboard.addReward( 'match1', 'team2', 'agent3', 300 );
	leaderboard.addReward( 'match2', 'team1', 'agent1', 400 );

	console.log( await leaderboard.get() );

});

