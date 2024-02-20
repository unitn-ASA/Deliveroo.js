const express = require('express');
const router = express.Router();
const Match = require('../deliveroo/Match')
const fs = require('fs');
const path = require('path');

// Directory contenente i file delle mappe
const mapsDirectory = path.join(__dirname, '..','..','levels','maps')

// Endpoint per la creazione di un nuovo gioco
router.post('/', (req, res) => {
  // Ricevi i dati inviati dal client
  const formData = req.body;
  console.log("\nRichiesta nuovo Match")
  
  var newMatch = new Match(formData)

  const filePath = path.join(mapsDirectory, newMatch.config.mappa);
  const mapContent = require(filePath);

  res.status(200).json({
    message: 'Dati ricevuti con successo!',
    id: newMatch.id,
    data: newMatch.config,
    mappa: mapContent
  });

});

// Endpoint per eliminare un gioco
router.delete('/:id', (req, res) => {
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
