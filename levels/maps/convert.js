const fs = require('fs');
const { createCanvas } = require('canvas');
const DOT_PER_TILE = 10;

var fileNames = [
    'challenge_21',
    'challenge_22',
    'challenge_23',
    'challenge_24',
    'challenge_31',
    'challenge_32',
    'challenge_33',
    'default_map',
    'empty_10',
    'empty_map',
    'level_5',
    'loops',
    'map_20',
    'map_30'
]

for ( let fileName of fileNames ) {

    var file = require('./'+fileName+'.js')

    var output = {
        name: fileName,
        map: file
    }

    fs.writeFile('./'+fileName+'.json', JSON.stringify(file, null, 2), (error) => {
        if (error) {
            console.log('An error has occurred ', error);
            return;
        }
        console.log(fileName, 'written successfully to', './'+fileName+'.json');
    });

    var canvas = createMapImage(file[0].lenght, file.lenght, file);

    // save canvas to png file
    // canvas.createPNGStream().pipe( fs.createWriteStream('./'+fileName+'.png') );
    
    // Write the image to file
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync('./'+fileName+'.png', buffer);
}
  




function createMapImage(width, height, map) {

    const canvas = createCanvas( width * DOT_PER_TILE, height * DOT_PER_TILE );
    const ctx = canvas.getContext('2d');

    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {

            let value = map[x][y];
            let color;
            if ( value == 0 ) {
                color = 'black';
            } else if ( value == 1 ) {
                color = 'green';
            } else if ( value == 2 ) {
                color = 'red';
            } else if ( value == 3 ){
                color = 'yellow';
            } else {
                color = 'white';
            }

            ctx.fillStyle = color;
            ctx.fillRect( x * DOT_PER_TILE, (height-1-y) * DOT_PER_TILE, DOT_PER_TILE, DOT_PER_TILE);

        }
    }
    
    return canvas;
}