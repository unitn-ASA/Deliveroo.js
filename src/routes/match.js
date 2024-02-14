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

  const filePath = path.join(mapsDirectory, newMatch.options.mappa);
  const mapContent = require(filePath);

  res.status(200).json({
    message: 'Dati ricevuti con successo!',
    id: newMatch.id,
    data: newMatch.options,
    mappa: mapContent
  });

});

module.exports = router;
