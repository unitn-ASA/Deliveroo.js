const express = require('express');
const router = express.Router();
const Match = require('../deliveroo/Match')
const fs = require('fs');
const path = require('path');
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
router.post('/', verifyToken, (req, res) => {

  const formData = req.body;              // data coming from the client
  console.log("\nAsk for a new Match")
  
  var newMatch = new Match(formData)

  const filePath = path.join(mapsDirectory, newMatch.options.mappa);
  const mapContent = require(filePath);

  res.status(200).json({
    message: 'Data received sucsessfully',
    id: newMatch.id,
    data: newMatch.options,
    mappa: mapContent
  });

});

router.post('/:id', verifyToken, (req, res) => {
  const matchId = req.params.id;      // get id of the match
  const newStatus = req.body.status;  // get the new state of the match

  
  let match = Match.mapMatch.get(matchId);
  match.status = newStatus;
  console.log(`Stato del match ${matchId} aggiornato a ${newStatus}.`)

  res.status(200).json({ message: `Stato del match ${matchId} aggiornato a ${newStatus}.` });
});


// Endpoint per eliminare un gioco
router.delete('/:id', verifyToken, (req, res) => {
  const matchId = req.params.id;
  console.log("\nRichiesta eliminazione Match: ", matchId)
  Match.mapMatch.delete(matchId)
  //TODO: eliminare anche i socket associati al match
  //TODO: eliminare anche i listener associati al match (workers, ...)
  res.status(200).json({
    message: 'Match eliminato con successo!',
    id: matchId
  });
});


// Endpoint per ottenere la lista dei match attivi
router.get('/', (req, res) => {
  const matchs = Array.from(Match.mapMatch.keys())
  res.status(200).json({
    message: 'Lista match attivi',
    data: matchs
  });
});


module.exports = router;
