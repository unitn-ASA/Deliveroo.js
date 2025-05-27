const express = require('express');
const cors = require('cors');
const Path = require('path');
const serveIndex = require('serve-index');
const swaggerUi = require('swagger-ui-express');
const fs = require("fs")
const YAML = require('yaml')
const app = express();

const apiRoutes = require('./routes/api');
const configRoutes = require('./routes/configs');
const mapsRoutes = require('./routes/maps');
const agentsRoutes = require('./routes/agents');
const levelsRoutes = require('./routes/levels');
const npcsRoutes = require('./routes/npcs');
const parcelsRoutes = require('./routes/parcels');
const { tokenMiddleware, verifyTokenMiddleware, signTokenMiddleware } = require('./middlewares/token');


/**
 * Serve front-end static files
 */

// Serve URLs like /ftp/thing as public/ftp/thing
// The express.static serves the file contents
// The serveIndex is this module serving the directory
app.use('/ftp', serveIndex('../', {'icons': true}));
app.use('/ftp', express.static('../'));

// Local monorepo build of frontend
app.use( '/',
    express.static( Path.join(__dirname, '..', '..', 'frontend', 'dist'), {
        setHeaders: (res, path) => {
            res.set('X-Frontend', '../frontend/dist;');
        }
    } )
);

// Remote frontend package, as installed from npmjs registry
app.use( '/',
    express.static( Path.join(__dirname, '../node_modules/@unitn-asa/deliveroo-js-webapp-dist'), {
        setHeaders: (res, path) => {
            res.set('X-Frontend', 'deliveroo-js-webapp-dist;');
        }
    } )
);



// Serve Swagger API documentation
const oas3  = fs.readFileSync('./oas3.yaml', 'utf8')
const swaggerDocument = YAML.parse(oas3)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup( swaggerDocument ));



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

// app.get('/api', (req, res) => {
//     res.status(200).json({
//         message: 'Welcome to the API'
//     });
// })
app.use('/api', apiRoutes);

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
app.use('/api/agents', agentsRoutes);           // api/agents       GET, POST, GET/:id, PATCH/:id agents on the grid
app.use('/api/levels', levelsRoutes);           // api/levels       GET levels
app.use('/api/npcs', npcsRoutes);               // api/npcs         GET, GET/:id, PATCH, POST
app.use('/api/parcels', parcelsRoutes);         // api/parcels      GET, GET/:id, POST

app.use( (req, res, next) => { 
    console.error(`${req.method} ${req.url} - Not Found`);
    res.status(404).json({
        message: 'Not Found'
    }); 
})

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