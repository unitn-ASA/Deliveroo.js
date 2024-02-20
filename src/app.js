const express = require('express');
const Path = require('path');
const app = express();
const {generateToken,decodeToken} = require('./deliveroo/Token');

const matchsRoutes = require('./routes/match');
const mapsRoutes = require('./routes/maps');

// Middleware per gestire i dati JSON e form-urlencoded
app.use(express.json());

app.use('/', express.static( Path.join(__dirname, '..', 'packages', '\@unitn-asa', 'deliveroo-js-webapp', 'home') ));
app.use('/game', express.static( Path.join(__dirname, '..', 'packages', '\@unitn-asa', 'deliveroo-js-webapp','dist/game') ));

app.use('/matchs', matchsRoutes);
app.use('/maps', mapsRoutes);

app.get('/token', (req, res) => {
    const token = generateToken(req.headers['nome'], req.headers['team']); 
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