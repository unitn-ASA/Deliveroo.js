const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { uid } = require('uid'); 

const SUPER_SECRET = process.env.SUPER_SECRET || 'default_token_private_key';

router.get('/', (req, res) => {

    let name = req.headers['name'] || false
    let team = req.headers['team'] || false

    if (!name) {
        console.log('GET toke: request refiused becouse name parameter is void');
        res.status(400).send('The "name" parameter is required.');
        return;
    }

    // if the parameter name is longher than 20 caracter it is considered a token
    if(name.length > 20){
        try { 
            let decode = decodeToken(name);
            console.log('GET toke: token provided is valid; id:', decode.id +' name:', decode.name + ' teamId:', decode.teamId + ' teamName:', decode.teamName );
            res.status(200)
            res.json({ 
                id: decode.id,
                name: decode.name,
                teamId: decode.teamId,
                teamName: decode.teamName,
                token: name 
            });  
            return;
        } catch (error) {
            console.log('GET toke: token provided is invalid', error );
            res.status(400).send('The token provided is invalid.');
            return;
        }
    }

    let teamId
    let teamName
    id = uid();

    // now check the team parameter, if it is a token we extraxt the team credential
    try {
        let decode = decodeToken(team);
        if(decode.teamName != false){
            teamId = decode.teamId;
            teamName = decode.teamName;
        }else{
            // if decode.teamName is false means that the agent associated has no team, so will be inpossible to join a team of an agent without team
            console.log('GET toke: the token provided for team has no team');
            res.status(400).send('The token provided for team has no team')
            return;
        }
        
    } catch (error) {
        console.log('GET toke: team not found, creating new one: ', team );
        teamId = uid();
        teamName = team;
    }


    const token = jwt.sign( {id, name, teamId, teamName}, SUPER_SECRET );

    let decode = decodeToken(token)

    console.log( 'GET toke: generated new token: ...', token.slice(-10) + ' with attributes: id:', decode.id +' name:', decode.name + ' teamId:', decode.teamId + ' teamName:', decode.teamName);
    res.status(200)
    res.json({ 
        id: decode.id,
        name: decode.name,
        teamId: decode.teamId,
        teamName: decode.teamName,
        token: token 
    });  

})


function decodeToken(token){
    return jwt.verify( token, SUPER_SECRET );
}


module.exports = router;
