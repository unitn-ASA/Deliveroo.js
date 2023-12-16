const express = require('express');
const router = express.Router();

// Endpoint per la creazione di un nuovo gioco
router.post('/', (req, res) => {
  // Ricevi i dati inviati dal client
  const formData = req.body;
  console.log("\nNuovo Game: ", formData)

  res.status(200).json({
    message: 'Dati ricevuti con successo!',
    data: formData
  });

});

module.exports = router;
