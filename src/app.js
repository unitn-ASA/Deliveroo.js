const express = require('express');
const cors = require('cors');
const Path = require('path');
const app = express();
const {generateToken,decodeToken} = require('./deliveroo/Token');

const matchesRoutes = require('./routes/matches');
const mapsRoutes = require('./routes/maps');
const leaderboardRoutes = require('./routes/leaderboard');

// Middleware per gestire i dati JSON e form-urlencoded
app.use(express.json());
// Middleware per chiamate cors
app.use(cors());

app.use('/', express.static( Path.join(__dirname, '..', 'packages', '\@unitn-asa', 'deliveroo-js-webapp', 'home') ));
app.use('/game', express.static( Path.join(__dirname, '..', 'packages', '\@unitn-asa', 'deliveroo-js-webapp','dist/game') ));

app.use('/matches', matchesRoutes);
app.use('/maps', mapsRoutes);
app.use('/leaderboard', leaderboardRoutes);

app.get('/token', (req, res) => {
    const token = generateToken(
        req.headers['name'] || req.query.name,
        req.headers['team'] || req.query.team
    );
    res.json({ token: token });
})


module.exports = app;





/**
 * Serve front-end static files
 */
// app.use('/', express.static('packages/\@unitn-asa/vite-project/dist/'));
// app.use('/', express.static(Path.join(__dirname, '..', 'packages', '\@unitn-asa', 'vite-project', 'dist')));
// app.use('/', express.static( Path.join(__dirname, '..', 'node_modules', '\@unitn-asa', 'deliveroo-js-webapp','home') ));
// app.use('/', express.static('static'));
// app.use("/", express.static(Path.join(__dirname, '..', 'static')));

// /**
//  * Agent id
//  */ls 
// app.use('/:id', (req, res) => {
//     // now use socket.io in your routes file
//     var io = req.app.get('socketio');
//     io.emit('hi!');
// } );