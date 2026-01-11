import express from 'express';
// import serverRouter from './config/server.js';
import gameRouter from './config/game.js';

const router = express.Router();

// // Mount sub-routers
// router.use('/server', serverRouter);
// router.use('/game', gameRouter);

// /**
//  * Legacy GET endpoint (deprecated)
//  * GET /api/configs → GET /api/config/server
//  */
// router.get('/', (_req, res) => {
//     res.redirect(301, '/api/config/server');
// });

// /**
//  * Legacy PATCH endpoint (deprecated)
//  * Returns 501 - use PATCH /api/config/server instead
//  */
// router.patch('/', (_req, res) => {
//     res.status(501).json({
//         error: 'Legacy PATCH endpoint deprecated. Use PATCH /api/config/server instead.'
//     });
// });

export default router;
