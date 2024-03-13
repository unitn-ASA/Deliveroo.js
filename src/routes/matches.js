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
    return res.status(403).send({ auth: false, message: 'Token not find.' });
  }

  // Check and decode the token
  jwt.verify(token, SUPER_SECRET_ADMIN, (err, decoded) => {
    if (err) {
      return res.status(500).send({ auth: false, message: 'Autenticatione feiled.' });
    }

    if(decoded.user != 'admin' || decoded.password != 'god1234'){
      return res.status(500).send({ auth: false, message: 'Autenticatione feiled.' });
    }

    next();
  });
}

// Endpoint for the cration of a new match
router.post('/', verifyToken, async (req, res) => {

  console.log("\nAsk for a new Match")
  
  var config = new Config( req.body );
  var newMatch = Arena.getOrCreateMatch({config});
  console.log("Creation of the new Match: ", newMatch.config);

  let mapPath = mapsDirectory + '/' + config.MAP_FILE +'.json';

  fs.promises.readFile(mapPath, 'utf8')
    .then(data => {
      const dataJson = JSON.parse(data);
      const map = dataJson.map;

      res.status(200).json({
        message: 'Data received successfully',
        id: newMatch.matchId,
        config: newMatch.config,
        map: map
      });
    })
    .catch(error => {
      console.error('Error in the reading of the map file:', error);
      res.status(500).json({ error: 'Error in the reading of the map file:' });
    });

});

router.post('/:id', verifyToken, (req, res) => {
  const matchId = req.params.id;      // get id of the match
  
  let match = Arena.matches.get(matchId);
  match.strtStopMatch();
  console.log(`Stato del match ${matchId} aggiornato a ${match.status}.`)

  res.status(200).json({ message: `Stato del match ${matchId} aggiornato a ${match.status}.` });
});


// Endpoint per eliminare un gioco
router.delete('/:id', verifyToken, (req, res) => {
  const matchId = req.params.id;
  console.log("\nRichiesta eliminazione Match: ", matchId)
  Arena.delete(matchId)
  //TODO: eliminare anche i socket associati al match
  //TODO: eliminare anche i listener associati al match (workers, ...)
  res.status(200).json({
    message: 'Match eliminato con successo!',
    id: matchId
  });
});


// Endpoint per ottenere la lista dei match attivi
router.get('/', (req, res) => {
  const matchs = Array.from(Arena.matches.keys());
  const status = Array.from(Arena.matches.values()).map(match => match.status);

  console.log(matchs);  
  console.log(status);

  res.status(200).json({
    message: 'Lista match attivi',
    matches: matchs,
    status: status
  });
});


module.exports = router;
