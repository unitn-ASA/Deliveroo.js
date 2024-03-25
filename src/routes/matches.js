const express = require('express');
const router = express.Router();
const Match = require('../deliveroo/Match');
const Arena = require('../deliveroo/Arena');
const fs = require('fs');
const path = require('path');
const Config = require('../deliveroo/Config');
const jwt = require('jsonwebtoken');

// Chiave segreta o chiave pubblica per la verifica della firma
const SUPER_SECRET_ADMIN = process.env.SUPER_SECRET_ADMIN || 'default_admin_token_private_key';

// Directory that contain maps file
const mapsDirectory = path.join(__dirname, '..','..','levels','maps')

// Middleware to check admin token
function verifyToken(req, res, next) {
  
  const token = req.headers.authorization;
  if (!token) {
    return res.status(403).send({ auth: false, message: 'No Token in headers.authorization.' });
  }

  // Check and decode the token
  jwt.verify(token, SUPER_SECRET_ADMIN, (err, decoded) => {
    if ( err || decoded.user != 'admin' || decoded.password != 'god1234' ) {
      return res.status(500).send({ auth: false, message: 'Autenticatione failed.' });
    }
    next();
  });
}

// Endpoint for the cration of a new match
router.post('/', verifyToken, async (req, res) => {
  
  var config = new Config( req.body );
  console.log("POST match: creation of the new Match: ", config)
  var newMatch = Arena.getOrCreateMatch({config});


  let mapPath = mapsDirectory + '/' + config.MAP_FILE +'.json';

  fs.promises.readFile(mapPath, 'utf8')
    .then(data => {
      const dataJson = JSON.parse(data);
      const map = dataJson.map;

      res.status(200).json({
        message: 'Data received successfully',
        id: newMatch.id,
        config: newMatch.config,
        map: map
      });
    })
    .catch(error => {
      console.error('POST match: error in the reading of the map file:', error);
      res.status(500).json({ error: 'Error in the reading of the map file:' });
    });

});

router.post('/:id', verifyToken, (req, res) => {
  const matchId = req.params.id;      // get id of the match
  
  let match = Arena.matches.get(matchId);

  if(!match){
    console.log('POST match: match', matchId, ' requested not found')
    res.status(400).json({ message: `Match ${matchId} not found` });
    return
  }
  
  match.startStop();
  console.log(`POST match: match ${matchId} status update to ${match.status}.`)

  res.status(200).json({ message: `Stato del match ${matchId} aggiornato a ${match.status}.` });
});


// Endpoint per eliminare un gioco
router.delete('/:id', verifyToken, async (req, res) => {
  const matchId = req.params.id;
  if( await Arena.deleteMatch(matchId) ){
    console.log("DELETE match:  match: ", matchId, " deleted")
    res.status(200).json({
      message: 'Match eliminato con successo!',
      id: matchId
    });
  }else{
    console.log("DELETE match: error, match: ", matchId, " not found")
    res.status(500).json({ message: 'Error during the elimination of the match' });
  }
  
  
});



router.get('/', (req, res) => {
    const matches = Array.from(Arena.matches.values()).map( match => {
        return {
            id: match.id,
            remainingTime: match.timer.remainingTime,
            status: match.status,
            config: match.config
        }
    } );
    res.status(200).json( matches );
});

// Endpoint per ottenere la lista dei match attivi
router.get('/:id/status', (req, res) => {
  const matchId = req.params.id;
  const match = Arena.getMatch(matchId);
  let status
   
  if(match){
    //console.log(match, match.status);
    status = match.status
  }else{
    //console.log('Match ', matchId + ' not find')
    res.status(400).send('Match not find')
    return
  }
 
  res.status(200).json({
    status: status
  });
});



router.get('/:id', (req, res) => {
    const matchId = req.params.id;
    const match = Arena.getMatch(matchId);
    if ( ! match ) {
        res.status(404).json({ message: `Match with id ${matchId} not found` });
        return;
    }
    const json = {
        id: match.id,
        remainingTime: match.timer.remainingTime,
        status: match.status,
        config: match.config
    }
    res.status(200).json( json );
});



module.exports = router;
