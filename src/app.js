const express = require('express');
const cors = require('cors');
const Path = require('path');
const app = express();

const configRoutes = require('./routes/configs');
const mapsRoutes = require('./routes/maps');
const agentsRoutes = require('./routes/agents');
const { tokenMiddleware, verifyTokenMiddleware, signTokenMiddleware } = require('./middlewares/token');



/**
 * Serve front-end static files
 */
app.use('/', express.static( Path.join(__dirname, '..', 'packages', '\@unitn-asa', 'deliveroo-js-vueapp', 'dist') ));


// Middleware per gestire i dati JSON
app.use(express.json());

// Middleware per chiamate cors
app.use(cors({
    origin: '*',
    credentials: false, // https://socket.io/docs/v4/handling-cors/#credential-is-not-supported-if-the-cors-header-access-control-allow-origin-is-
    allowedHeaders: '*'
}));

//Middleware to login with a name
app.use( verifyTokenMiddleware ); // Decode token if any

/**********************************************/
/*                     API                    */
/*                                            */

app.get('/api', (req, res) => {
    res.status(200).json({
        message: 'Welcome to the API'
    });
})

// return the generated token
app.use('/api/tokens', signTokenMiddleware, (req, res) => {

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
app.use('/api/agents', agentsRoutes);           // api/agents       GET agents on the grid

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