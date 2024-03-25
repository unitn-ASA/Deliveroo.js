const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { uid } = require('uid/secure'); 

const SUPER_SECRET = process.env.SUPER_SECRET || 'default_token_private_key';

router.get('/', (req, res) => {

    let agentNameOrToken = req.headers['name'] || req.query.name || false;
    let teamNameOrToken = req.headers['team'] || req.query.teamName || false;

    if (!agentNameOrToken) {
        console.log('GET /token ERR: no name specified');
        res.status(400).send('The "name" parameter is required.');
        return;
    }
    
    var id = uid(6);
    var name = agentNameOrToken;
    var teamId;
    var teamName;
    var token;

    try {

        let decoded = decodeToken(agentNameOrToken);
        id = decoded.id;
        name = decoded.name;
        teamId = decoded.teamId;
        teamName = decoded.teamName;
        token = agentNameOrToken;
        console.log( `GET /token: "name" is a valid token: id=${id}, name=${name}, teamId=${teamId}, teamName=${teamName}`);
        
    } catch (error) {
        if ( error == INVALID_PAYLOAD_ERR ) {
            console.log( 'GET /token ERR: "name" is a token not valid');
            res.status(400).send('The "name" parameter was found to be a token but payload is not valid.');
            return;
        } // else: use it as a name...
    }

    if (agentNameOrToken.length > 20) {
        console.log('GET /token ERR: "name" cannot be longer than 20 chars.');
        res.status(400).send('The "name" parameter cannot be longer than 20 chars.');
        return;
    }

    if (!teamNameOrToken) {

        console.log('GET /token ERR: no team specified');
        res.status(400).send('The "team" parameter is required.');
        return;

    }

    try {

        let decoded = decodeToken(teamNameOrToken);
        if ( decoded.teamName && decoded.teamId ) {

            teamId = decoded.teamId;
            teamName = decoded.teamName;
            console.log( `GET /token: Joining existing team, teamId=${teamId}, teamName=${teamName}` );

        } else {

            console.log('GET /token ERR: the token provided for team has no team');
            res.status(400).send('The token provided for team has no team')
            return;

        }

    } catch (error) {
        
        teamId = uid(6);
        teamName = teamNameOrToken;
        console.log( `GET /token: Joining new team, teamId=${teamId}, teamName=${teamName}` );

    }

    if ( ! token ) {
        token = jwt.sign( {id, name, teamId, teamName}, SUPER_SECRET );
        console.log( `GET /token: generated new token: ...${token.slice(-10)} with attributes: id=${id} name=${name} teamId=${teamId} teamName=${teamName}` );
    }

    res.status(200).json( {id, name, teamId, teamName, token} );

})



const INVALID_PAYLOAD_ERR = new Error('Token payload is invalid')

function decodeToken(token){
    var decoded = jwt.verify( token, SUPER_SECRET );
    var { id, name, teamId, teamName } = decoded;
    if ( !id || !name || !teamId || !teamName ) {
        throw INVALID_PAYLOAD_ERR;
    }
    return decoded;
}



module.exports = router;
