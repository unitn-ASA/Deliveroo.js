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
	

	console.log( await leaderboard.get() );

});

