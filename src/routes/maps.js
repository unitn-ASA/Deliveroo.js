const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Maps directory
const mapsDirectory = path.join(__dirname, '..','..','levels','maps')


// Get all maps as a json
router.get('/', (req, res) => {

    fs.readdir(mapsDirectory, async (err, fileNames) => {
        
        if (err) {
            console.error('Errore nella lettura della directory:', err);
            res.status(500).send('Errore nella lettura della directory');
            return;
        }

        const maps = []; 
        for ( let fileNmae of fileNames.filter( file => path.extname(file) === '.js' ) ) {
            const map = await readMapFromJs(fileNmae).catch( console.error );
            if ( map && map.map && map.name )
                maps.push(map);
        }
        
        res.json(maps); // Invia i dati delle mappe come risposta JSON

    });
 
});

// Upload a new map. receive a json matrix and savo to a json file locally
router.post('/', (req, res) => {
    const mapName = req.body.name;
    const mapMap = req.body.map;

    const mapPath = path.join(mapsDirectory, `${mapName}.json`);

    fs.writeFile(mapPath, JSON.stringify(mapMap, null, 2), (error) => {
        if (error) {
            console.error('Errore nella scrittura del file:', error);
            res.status(500).send('Errore nella scrittura del file');
            return;
        }

        res.status(201).send('Mappa creata con successo');
    });

});

// Get a specific map as a png (eg /maps/1.png)
router.get('/:mapName.png', async (req, res) => {
    const mapName = req.params.mapName;

    try {
        
        var json = await readMapFromJs( mapName.split('.')[0] );

        var png = generatePng( json.map );
        savePng( mapName, png );

        res.contentType('image/png');
        res.send(png);

    } catch (err) {
        console.error(err);
        res.status(404).send('Map not found. Error: ' + err);
    }

});

// Get a specific map as a json (eg /maps/1)
router.get('/:mapName', async (req, res) => {
    const mapName = req.params.mapName;

    const json = await readMapFromJs( mapName ).catch( err => {
        console.error(err);
        res.status(404).send('Map not found. Error: ' + err);
    } );

    res.json(json);
});

// Read map from json file
async function readMapFromJson( mapName ) {
    return new Promise((resolve, reject) => {
        // aggiungo eventuale estensione
        if ( mapName.split('.').pop() != 'json' ) {
            mapName = mapName + '.json';
        }

        const jsonPath = path.join(mapsDirectory, `${mapName}`);
        fs.readFile(jsonPath, 'utf8', (err, data) => {
            if (err) {
                reject( "Cannot read map json file, no such file or directory " + jsonPath );
            } else {
                const map = JSON.parse(data);
                if ( !map.map || !map.name ) {
                    reject( "Invalid map json file " + jsonPath );
                } else {
                    resolve( map );
                }
            }
        });
        
    });
    
}

// Read map from .js file
async function readMapFromJs( mapName ) {
    return new Promise((resolve, reject) => {
        // rimuovo eventuale estensione
        {
            let tmp = mapName.split('.');
            if ( tmp.pop() == 'js' )
                mapName = tmp;
        }

        const jsonPath = path.join(mapsDirectory, `${mapName}`);
        try {
            var map = require(jsonPath);
        } catch (error) {
            reject( "Cannot read map .js file, no such file or directory " + jsonPath );
            return;
        }
        resolve( {
            self: '/api/maps/'+mapName,
            png: '/api/maps/'+mapName+'.png',
            name: mapName,
            map: map
        } );
        
    });
    
}

// Read map png file
function readMapFromPng( mapName ) {
    const pngPath = path.join(mapsDirectory, `${mapName}.png`);
    return new Promise((resolve, reject) => {
        fs.readFile(pngPath, (err, data) => {
            if (err) {
                resolve(null);
            }
            resolve(data);
        });
    });
}

async function readMapFromPngOrGenerate( mapName, json ) {
    var png = await readMapFromPng( mapName );
    
    if (png == null) {
        var json = await readMapFromJson( mapName );    
        if (json == null) {
            // res.status(404).send('Map not found');
            return;
        }
        png = generatePng( json.map );
        savePng( mapName, png );
    }

    if (png == null) {
        // res.status(500).send('Error reading map');
        return;
    }

    return png;
}



const DOT_PER_TILE = 10;
const PADDING = 1;

// Generate png from map
function generatePng( matrix ) {

    var width = matrix[0].length;
    var height = matrix.length;

    const canvas = createCanvas( width * DOT_PER_TILE, height * DOT_PER_TILE );
    const ctx = canvas.getContext('2d');

    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {

            // get the value of the current cell
            let value = matrix[x][y];
            
            ctx.globalAlpha = 1;
            // set the color of the rectangle
            if ( value == 0 ) {
                ctx.fillStyle = 'grey';
                ctx.globalAlpha = 0.1;
                // continue;
            } else if ( value == 1 ) {
                ctx.fillStyle = 'green';
            } else if ( value == 2 ) {
                ctx.fillStyle = 'red';
            } else if ( value == 3 ){
                ctx.fillStyle = 'lightgreen';
            } else {
                ctx.fillStyle = 'purple';
            }

            // calculate the position and size of the rectangle
            var _left = x * DOT_PER_TILE + PADDING;
            var _top = (height-1-y) * DOT_PER_TILE + PADDING;
            var _width = DOT_PER_TILE - 2*PADDING;
            var _height = DOT_PER_TILE - 2*PADDING;

            // draw the rectangle
            ctx.fillRect( _left, _top, _width, _height );

        }
    }
    
    return canvas.toBuffer("image/png");
}

// Save png on file
function savePng( mapName, buffer ) {
    const mapPath = path.join(mapsDirectory, `${mapName}.png`);
    fs.writeFileSync( mapPath, buffer );
}

module.exports = router;
