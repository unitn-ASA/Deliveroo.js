const jwt = require('jsonwebtoken');
const { uid } = require('uid'); 

const SUPER_SECRET = process.env.SUPER_SECRET || 'default_token_private_key';
const SUPER_SECRET_ADMIN = process.env.SUPER_SECRET_ADMIN || 'default_admin_token_private_key';

function generateToken( name, teamNameOrToken = 'no-team' ) {

    var teamId;
    var teamName;
    try {
        let teamToken = decodeToken(teamNameOrToken);
        teamId = teamToken.teamId;
        teamName = teamToken.teamName;
    } catch (error) {
        console.log('Team not found, creating new one', error, '-'+teamNameOrToken+'-');
        teamId = uid();
        teamName = teamNameOrToken;
    }

    id = uid();

    console.log('name: ', name + ' team: ', teamName);
    const token = jwt.sign( {id, name, teamId, teamName}, SUPER_SECRET );

    let decode = decodeToken(token)

    console.log( 'Generated new token:', token.slice(-30));
    console.log( 'New token decoded:',decode);
    return token;

}

function generateTokenAdmin(){

    token = jwt.sign({user:'admin', password:'god1234'}, SUPER_SECRET_ADMIN );

    console.log( 'Generate new toke: ', token.slice(-30));
    return token

}

function decodeToken(token){
    return jwt.verify( token, SUPER_SECRET );
}

module.exports = { generateToken, generateTokenAdmin, decodeToken} 