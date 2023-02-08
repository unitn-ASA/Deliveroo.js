const server = require('./src/server.js');
// const mongoose = require('mongoose');

/**
 * https://devcenter.heroku.com/articles/preparing-a-codebase-for-heroku-deployment#4-listen-on-the-correct-port
 */
const port = process.env.PORT || 8080;

server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

/**
 * Configure mongoose
 */
// mongoose.Promise = global.Promise;
// app.locals.db = mongoose.connect(process.env.DB_URL, {useNewUrlParser: true, useUnifiedTopology: true})
// .then ( () => {
    
//     console.log("Connected to Database");
    
//     server.listen(port, () => {
//         console.log(`Server listening on port ${port}`);
//     });
    
// });