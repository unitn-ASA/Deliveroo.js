import express from 'express';
import cors from 'cors';
import Path from 'path';
import { fileURLToPath } from 'url';
import serveIndex from 'serve-index';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import { default as YAML } from 'yaml';

const app = express();

import apiRoutes from './routes/api.js';
import configsRoutes from './routes/configs.js';
import { gamesRouter } from '@unitn-asa/deliveroo-js-assets';
import agentsRoutes from './routes/agents.js';
import npcsRoutes from './routes/npcs.js';
import parcelsRoutes from './routes/parcels.js';
import { tokenMiddleware, verifyTokenMiddleware, signTokenMiddleware, authorizeAdmin } from './middlewares/token.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = Path.dirname(__filename);



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
const oas3Path = Path.join(__dirname, '..', 'oas3.yaml');
const oas3 = fs.readFileSync(oas3Path, 'utf8');
const swaggerDocument = YAML.parse(oas3);
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

// Game server routes (core game logic)
app.use('/api/configs', configsRoutes);          // api/configs      GET configs, PATCH configs
app.use('/api/agents', agentsRoutes);           // api/agents       GET, POST, GET/:id, PATCH/:id agents on the grid
app.use('/api/npcs', npcsRoutes);               // api/npcs         GET, GET/:id, PATCH, POST
app.use('/api/parcels', parcelsRoutes);         // api/parcels      GET, GET/:id, POST

// Content API routes (static content delivery - mounted at /api/content/*)
// GET requests are public, POST requests require admin authorization
app.post('/api/games', authorizeAdmin, gamesRouter);
app.use('/api/games', gamesRouter);

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



export default app;