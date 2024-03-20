const jwt = require('jsonwebtoken');
const { uid } = require('uid'); 

const SUPER_SECRET = process.env.SUPER_SECRET || 'default_token_private_key';
const SUPER_SECRET_ADMIN = process.env.SUPER_SECRET_ADMIN || 'default_admin_token_private_key';

function generateToken( name, teamNameOrToken = 'no-team' ) {

    var id = uid();
    var teamId;
    var teamName;
    try {
        let teamToken = decodeToken(teamNameOrToken);
        teamId = teamToken.teamId;
        teamName = teamToken.teamName;
        console.log( 'Joining existing team, teamId='+teamId, 'teamName='+teamNameOrToken );
    } catch (error) {
        teamId = uid();
        teamName = teamNameOrToken;
        console.log( 'Joining new team, teamId='+teamId, 'teamName='+teamNameOrToken );
    }
    const token = jwt.sign( {id, name, teamId, teamName}, SUPER_SECRET );
    // console.log( 'Generated new token:', '...'+token.slice(-30), decodeToken(token) );
    return token;
    
}

function generateTokenAdmin(){
    
    const token = jwt.sign({user:'admin', password:'god1234'}, SUPER_SECRET_ADMIN );
    console.log( 'Generated new token:', '...'+token.slice(-30), decodeToken(token) );
    return token

}

function decodeToken(token){
    return jwt.verify( token, SUPER_SECRET );
}

module.exports = { generateToken, generateTokenAdmin, decodeToken} 