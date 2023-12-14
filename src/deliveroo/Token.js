const jwt = require('jsonwebtoken');
const { uid } = require('uid'); 

const SUPER_SECRET = process.env.SUPER_SECRET || 'default_token_private_key';

function generateToken(gname){

    gid = uid();
    token = jwt.sign( {id:gid, name:gname}, SUPER_SECRET );

    console.log('gg ', token);

    return token

}

function decodeToken(token){
    return jwt.verify( token, SUPER_SECRET );
}

module.exports = { generateToken, decodeToken } 