const express = require('express');
const router = express.Router();
const Match = require('../deliveroo/Match');
const Arena = require('../deliveroo/Arena');
const fs = require('fs');
const path = require('path');
const Config = require('../deliveroo/Config');



// Endpoint per la creazione di un nuovo gioco
router.post('/', (req, res) => {
  
  var config = new Config( req.body );
  console.log("\nCreazione nuovo Match");

  var newMatch = new Match( config );

  res.status(200).json({
    message: 'Dati ricevuti con successo!',
    id: newMatch.id,
    config: config,
    map: newMatch.map
  });

});

// Endpoint per eliminare un gioco
router.delete('/:id', (req, res) => {
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
  const matchs = Array.from( Arena.matches.keys() )
  res.status(200).json({
    message: 'Lista match attivi',
    data: matchs
  });
});

module.exports = router;
