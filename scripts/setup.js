require('dotenv').config();
var {RewardModel} = require('../src/models/RewardModel'); // get our mongoose model
var Leaderboard = require('../src/models/LeaderboardView');
var mongoose = require('mongoose');



// connect to database
mongoose.connect(process.env.DB_URL, {})
.then ( async () => {
	console.log("Connected to Database");

	// delete all from mongoose collection RewardModel
	await RewardModel.deleteMany({});	

	console.log( await Leaderboard.read() );

});

