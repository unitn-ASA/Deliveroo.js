const jwt = require('jsonwebtoken');
const { uid } = require('uid'); 

const SUPER_SECRET = process.env.SUPER_SECRET || 'default_token_private_key';

function generateToken(name, team) {

    id = uid();
    token = jwt.sign( {id, name, team}, SUPER_SECRET );

    console.log( 'Generated new token:', token.slice(-30));
    return token;

}

function decodeToken(token) {
    return jwt.verify( token, SUPER_SECRET );
}

module.exports = { generateToken, decodeToken } 