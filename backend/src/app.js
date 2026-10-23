import express from 'express';
import cors from 'cors';
import fs from 'fs';
import Path from 'path';
import { fileURLToPath } from 'url';
import serveIndex from 'serve-index';
import swaggerUi from 'swagger-ui-express';
import { pluginRegistry } from './plugins/runtime.js';

const app = express();

import apiRoutes from './routes/api.js';
import configsRoutes from './routes/configs.js';
import { gamesRouter } from '@unitn-asa/deliveroo-js-assets';
import agentsRoutes from './routes/agents.js';
import npcsRoutes from './routes/npcs.js';
import parcelsRoutes from './routes/parcels.js';
import missionsRoutes from './routes/missions.js';
import { tokenMiddleware, verifyTokenMiddleware, signTokenMiddleware, authorizeAdmin } from './middlewares/token.js';
import { createPluginRoutes } from './routes/plugins.js';

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



// Serve Swagger API documentation, generated at build time by 'npm run build:swagger'
const swaggerPath = Path.join(__dirname, '..', 'swagger.json');
let swaggerSpec;
try {
    swaggerSpec = JSON.parse( fs.readFileSync( swaggerPath, 'utf8' ) );
} catch ( error ) {
    console.warn( `API documentation unavailable, ${swaggerPath} not loaded (${error.message}). Run 'npm run build:swagger' in backend/` );
    swaggerSpec = {
        openapi: '3.0.4',
        info: {
            title: 'Deliveroo.js API',
            version: 'unavailable',
            description: "The OpenAPI spec has not been generated: run `npm run build:swagger` in backend/ and restart the server.",
        },
        paths: {},
    };
}
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Deliveroo.js API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
}));

// Serve TypeDoc documentation: SDK docs for agent developers, mounted before /docs to take precedence
app.use('/docs/sdk', express.static(Path.join(__dirname, '..', 'docs', 'typedoc-sdk'), {
    dotfiles: 'ignore',
    index: 'index.html'
}));
// Developer docs (all packages)
app.use('/docs', express.static(Path.join(__dirname, '..', 'docs', 'typedoc'), {
    dotfiles: 'ignore',
    index: 'index.html'
}));



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
app.use('/api/missions', missionsRoutes);       // api/missions     GET missions of the game script

// Plugin management routes
app.use('/api/plugins', createPluginRoutes(pluginRegistry));

// Content API routes (static content delivery - mounted at /api/content/*)
// GET requests are public, POST requests require admin authorization
app.post('/api/games', authorizeAdmin, gamesRouter);
app.use('/api/games', (req, res, next) => {
    if (req.method !== 'GET' || req['user']?.role === 'admin') {
        next();
        return;
    }

    const json = res.json.bind(res);
    res.json = (body) => {
        const stripMissions = (game) => {
            if (!game || typeof game !== 'object') return game;
            const { missions, ...publicGame } = game;
            return publicGame;
        };
        return json(Array.isArray(body) ? body.map(stripMissions) : stripMissions(body));
    };
    next();
}, gamesRouter);

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



export { pluginRegistry };

export default app;
