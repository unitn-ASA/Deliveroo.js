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
async function verifyTokenMiddleware ( req, res, next ) {

    const token = req.headers.authorization || req.headers['x-access-token'] || req.headers['token'] || req.query.token;
    
    if ( token ) {

        try {
    
            let payload = await asyncVerifyToken( token.toString() );
            
            req['token'] = token.toString();
            req['payload'] = payload;
            
        } catch (error) {
        
            req['error'] = error;

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
 */
async function signTokenMiddleware ( req, res, next ) {

    // if name is provided start login process else skip
    const name = req.headers['name'] || req.query.name;
    if ( ! name ) {
        next();
        return;
    }
    const id = uid(6);

    // if password is provided, check if it is the admin password
    let password = req.headers['password'] || req.query.passsword;
    const role = password == ADMIN_PASSWORD ? 'admin' : 'user';

    // if req.token is already verified use to join the same team
    var teamId = req['payload']?.teamId || uid(6);
    var teamName = (req['payload']?.teamName || req.headers['team'] || req.query.teamName || name).toString();

    // generate a new token
    const payload = {id: uid(6), name, teamId, teamName, role};
    const token = await asyncSignToken( payload );

    console.log( `${req.method} ${req.url} - New token: ...${token.slice(-10)} with attributes: id=${id} name=${name} teamId=${teamId} teamName=${teamName} role=${role}` );

    req['payload'] = payload;
    req['token'] = token;
    next();
    
}



async function asyncVerifyToken (token) {

    return new Promise( (resolve, reject) => {

        // Check and decode the token
        jwt.verify ( token, SUPER_SECRET, (err, /**@type {Object}*/payload) => {
    
            if ( err ) {
                reject('Invalid signature');
            }
            
            else if ( ! payload.id || ! payload.name || ! payload.teamId || ! payload.teamName ) {
                reject('Invalid payload');
            }

            else {
                resolve(payload);
            }
            
        });
    });

}

async function asyncSignToken (payload) {

    return new Promise( (resolve, reject) => {

        // Check and decode the token
        jwt.sign ( payload, SUPER_SECRET, (err, token) => {
            
            if (err) console.error(err);
            
            resolve(token);
            
        });
    });

}



module.exports = {verifyTokenMiddleware, authorizeUser, authorizeAdmin, signTokenMiddleware};


