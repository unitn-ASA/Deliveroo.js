const jwt = require('jsonwebtoken');
const { uid } = require('uid'); 

const SUPER_SECRET = process.env.SUPER_SECRET || 'default_token_private_key';

function generateToken(gname, gteam){

    gid = uid();
    token = jwt.sign( {id:gid, name:gname, team:gteam}, SUPER_SECRET );

    console.log( 'Generate new toke: ', token.slice(-30));
    return token

}

function decodeToken(token){
    return jwt.verify( token, SUPER_SECRET );
}

module.exports = { generateToken, decodeToken } 