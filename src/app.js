const express = require('express');
const cors = require('cors');
const Path = require('path');
const app = express();

const configRoutes = require('./routes/config');
const rewardsRoute = require('./routes/rewards');
const matchesRoutes = require('./routes/matches')
const mapsRoutes = require('./routes/maps');
const roomRoutes = require('./routes/rooms');
const {verifyTokenMiddleware, signTokenMiddleware} = require('./middlewares/tokens');



// Middleware per gestire i dati JSON e form-urlencoded
app.use(express.json());

// Middleware per chiamate cors
app.use(cors({
    origin: '*',
    credentials: false, // https://socket.io/docs/v4/handling-cors/#credential-is-not-supported-if-the-cors-header-access-control-allow-origin-is-
    allowedHeaders: '*'
}));

// Middleware to redirect / to /game
app.use('/', (req, res, next) => {
    if (req.originalUrl === '/') { 
        req.url += 'game'; 
    }
    next() 
});



/**
 * Serve front-end static files
*/
// app.use('/', express.static( Path.join(__dirname, '..', 'node_modules', '\@unitn-asa', 'deliveroo-js-webapp','home') ));
app.use('/game', express.static(Path.join(__dirname, '..', 'packages', '\@unitn-asa', 'deliveroo-js-webapp', 'dist', 'game')));
app.use('/home', express.static( Path.join(__dirname, '..', 'packages', '\@unitn-asa', 'deliveroo-js-webapp', 'home') ));
app.use('/old_matches', express.static( Path.join(__dirname, '..', 'packages', '\@unitn-asa', 'deliveroo-js-webapp', 'old_matches') ));



/**
 * Middleware to login with a name
 */
app.use( verifyTokenMiddleware );               // Verify token and expose req.payload and req.token
app.use( signTokenMiddleware );                 // Generate token and joining existing req.payload.team or new team



/**********************************************/
/*                     API                    */
/*                                            */

// return the generated token
app.post('/api/tokens', (req, res) => {

    if ( ! req['token'] ) {
        console.error(`${req.method} ${req.url} - Login failed, no name specified.`);
        res.status(401).json({
            message: 'Login failed, no name specified.'
        });
        return;
    }

    res.status(200).json({
        message: 'Login successful',
        token: req['token'],
        payload: req['payload']
    });

});

app.use('/api/configs', configRoutes);          // api/configs      GET config by roomId
app.use('/api/maps', mapsRoutes);               // api/maps         GET, POST, GET/:id as json, GET/:id.png as png
app.use('/api/rewards', rewardsRoute);          // api/rewards      GET ? roomId, matchId, teamId Name, agentId Name, aggregateBy

app.use('/api/rooms', roomRoutes);              // POST api/rooms create a new room, DELETE api/rooms/:id delete the room :id
app.use('/api/matches', matchesRoutes);         // POST api/matches/:id start new match in room :id, PUT api/matches/:id/status switch on/off the match in room :id DELETE api/matches/:id delete the match in room :id, GET api/matches ???

app.use( (err, req, res, next) => { 
    console.error(err.stack); 
    res.status(500).json({
        message: 'Something went wrong!',
        error: err.message
    }); 
})

/*                                            */
/*                                            */
/**********************************************/



module.exports = app;



// /**
//  * Agent id
//  */
// app.use('/:id', (req, res) => {
//     // now use socket.io in your routes file
//     var io = req.app.get('socketio');
//     io.emit('hi!');
// } );

