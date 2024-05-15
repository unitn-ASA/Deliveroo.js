require('dotenv').config();
var {RewardModel} = require('../src/models/RewardModel'); // get our mongoose model
var mongoose = require('mongoose');



// connect to database
mongoose.connect(process.env.DB_URL, {})
.then ( async () => {
	console.log("Connected to Database");

	console.log( await RewardModel.find().exec() );

});

