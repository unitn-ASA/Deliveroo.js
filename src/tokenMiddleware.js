

/**
 * Decode token and save in req.user And allow access to next middlewares only if token is valid
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
function decodeAndVerifyToken (req, res, next) {

    var token = req.headers['x-token'] || req.headers.authorization || req.query.token || req.body.token || req.params.token;

    if ( !token ) {
        return next(new Error(`Token not provided.`));
    }
    
    jwt.verify(token, SUPER_SECRET, (err, decoded) => {
        if (err) {
            return next(new Error(`Token verification failure.`));
        } else if ( decoded.id && decoded.name ) {
            const id = decoded.id
            const name = decoded.name
            const teamId = decoded.teamId || null;
            const teamName = decoded.teamName || null;
            const admin = decoded.admin || false;
            req.user = { id, name, teamId, teamName, admin, token };
            console.log( `${req.method}${admin?' ADMIN':''} ${name}-${id}-${teamName} @ /${req.path} With token: ...${token.slice(-30)}` );
            next();
        }
        else {
            return next(new Error(`Token verified but missing id or name are missing.`));
        }
    });

}

/**
 * Allow access to next middlewares only if current user is an admin 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
function verifyAdmin (req, res, next) {
    if ( req.user.admin )
        next();
    else
        res.status(403).send({ auth: false, message: 'No Token in headers.authorization.' });
}



module.exports = {verifyAdminToken};