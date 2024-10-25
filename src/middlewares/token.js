const jwt = require('jsonwebtoken');
const express = require('express');
const { uid } = require('uid/secure'); 



const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';
const SUPER_SECRET = process.env.SUPER_SECRET || 'default_token_private_key';



/**
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {*} next
 * @returns 
 */
async function authorizeUser ( req, res, next ) {

    const token = req['token'];
    const payload = req['payload'];
    const error = req['error'] || 'Token not found';

    if ( ! payload || ! token ) {

        res.status(403).json( {

            message: 'Authorization denied.',
            error: error
        
        } );
    }

    next();
    
}



/**
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {*} next
 */
const authorizeAdmin = express.Router().use( authorizeUser, (req, res, next) => {
    
    if ( req['payload'].role == 'admin' ) {

        next();
        
    } else {

        res.status(500).json( {

            message: 'Authorization denied.',
            error: 'Admin priviledges required.',
            payload: req['payload']
        
        });
    
    }

});



/**
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {*} next
 * @returns 
 */
async function verifyTokenMiddleware ( req, res, next ) {

    req['user'] = {};
    req['payload'] = {};
    req['token'] = null;

    const token = req.headers.authorization || req.headers['x-access-token'] || req.headers['x-token'] || req.headers['token'] || req.query.token;
    
    // Token provided
    if ( token && token != "" ) {

        try {
            
            const decoded = jwt.verify( token.toString(), SUPER_SECRET )

            // Valid token
            if ( decoded['id'] && decoded['name'] ) {

                const id = decoded['id'];
                const name = decoded['name'];
                const teamId = decoded['teamId'];
                const teamName = decoded['teamName'];
                const role = decoded['role'];
                
                req['user'] = { id, name, teamId, teamName, token };
                req['payload'] = { id, name, teamId, teamName, role };
                req['token'] = token;

                // console.log( `${connectionName} connected as ${name}(${id}). With token: ${providedToken.slice(0,10)}...` );

            } else { // Invalid token payload

                console.log( `${req.method} ${req.url} Token is verified but id or name are missing.` );

                res.status(401).json( {
                    message: 'Token is verified but id or name are missing.',
                    decoded
                } );

                return;
            }

        } catch (error) { // Invalid token signature

            console.log( `${req.method} ${req.url} Invalid token provided. Error:`, error.message, jwt.decode( token.toString() ) );

            if ( res.status )
                res.status(401).json( {
                    message: 'Invalid token provided.'
                } );

            return;
        }

    }

    next();
    
}



/**
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {*} next
 */
async function signTokenMiddleware ( req, res, next ) {

    let verifiedToken = req['token'];

    // Provided name or 'anonymous' if not even a token is provided
    let name = req.headers['name'] || req.query.name || ( ! verifiedToken ? 'anonymous' : undefined );

    // If name is specified, generate a new token
    if ( name && name != "" ) {

        const id = uid(6);
        const password = req.headers['password'] || req.query.passsword;
        const role = password == ADMIN_PASSWORD ? 'admin' : 'user';
        const teamId = req['user']?.teamId || uid(6); // hinerit team from provided token
        const teamName = ( req['user']?.teamName || req.headers['team'] || req.query.teamName || name ).toString(); // hinerit team from provided token

        // generate a new token
        try {

            const token = jwt.sign ( {id, name, teamId, teamName, role}, SUPER_SECRET );

            req['user'] = { id, name, teamId, teamName, role, token };
            req['payload'] = { id, name, teamId, teamName, role };
            req['token'] = token;

            console.log( `${req.method} ${req.url} New token: ${token.slice(0,10)}... ${name}-${teamName}-${id} as ${role}` );

        } catch (error) {

            console.error( `${req.method} ${req.url}`, error );

            return;

        }

    }
       
    next();
    
}



/**
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {*} next
 * @returns 
 */
async function tokenMiddleware ( req, res, next ) {
    
    verifyTokenMiddleware(req, res, () => {
        signTokenMiddleware(req, res, next);
    } );
    
}



module.exports = { authorizeUser, authorizeAdmin, tokenMiddleware, verifyTokenMiddleware, signTokenMiddleware };


