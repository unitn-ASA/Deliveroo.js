const express = require('express');
const app = express();

/**
 * Serve front-end static files
 */
app.use('/', express.static('packages/\@unitn-asa/vite-project/dist/'));
// app.use('/', express.static('static'));

// /**
//  * Agent id
//  */
// app.use('/:id', (req, res) => {
//     // now use socket.io in your routes file
//     var io = req.app.get('socketio');
//     io.emit('hi!');
// } );

module.exports = app;