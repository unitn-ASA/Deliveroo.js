const express = require('express');
const { homedir } = require('os');
const Path = require('path');
const app = express();

/**
 * Serve front-end static files
 */
// app.use('/', express.static('packages/\@unitn-asa/vite-project/dist/'));
// app.use('/', express.static(Path.join(__dirname, '..', 'packages', '\@unitn-asa', 'vite-project', 'dist')));
app.use('/', express.static( Path.join(__dirname, '..', 'node_modules', '\@unitn-asa', 'deliveroo-js-webapp', 'home') ));
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

module.exports = app;