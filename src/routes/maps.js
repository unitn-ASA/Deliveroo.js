const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Directory contenente i file delle mappe
const mapsDirectory = path.join(__dirname, '..','..','levels','maps')


// Endpoint per l'invio delle mappe
router.get('/', (req, res) => {

    fs.readdir(mapsDirectory, (err, files) => {
        if (err) {
            console.error('Errore nella lettura della directory:', err);
            res.status(500).send('Errore nella lettura della directory');
            return;
        }

        const mapFiles = files.filter(file => path.extname(file) === '.js');
        const mapsData = mapFiles.map(file => {
            const filePath = path.join(mapsDirectory, file);
            const mapName = path.parse(file).name;

            try {
                // Carica il contenuto del file JS 
                const mapContent = require(filePath);

                return {
                    mapId: mapName, 
                    matrix: mapContent
                };

            } catch (error) {
                console.error(`Errore nella lettura del file ${file}:`, error);
                return null;
            }
        });

        const validMapsData = mapsData.filter(map => map !== null);

        res.json(validMapsData); // Invia i dati delle mappe come risposta JSON
    });
 
});

module.exports = router;
