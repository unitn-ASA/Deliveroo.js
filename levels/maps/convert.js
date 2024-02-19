const fs = require('fs');
const { createCanvas } = require('canvas');
const DOT_PER_TILE = 10;
const PADDING = 1;

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

    fs.writeFile('./'+fileName+'.json', JSON.stringify(output, null, 2), (error) => {
        if (error) {
            console.log('An error has occurred ', error);
            return;
        }
        console.log(fileName, 'written successfully to', './'+fileName+'.json');
    });

    var width = file[0].length;
    var height = file.length;

    var canvas = createMapImage(width, height, file);

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

            // get the value of the current cell
            let value = map[x][y];
            
            ctx.globalAlpha = 1;
            // set the color of the rectangle
            if ( value == 0 ) {
                ctx.fillStyle = 'grey';
                ctx.globalAlpha = 0.4;
                // continue;
            } else if ( value == 1 ) {
                ctx.fillStyle = 'green';
            } else if ( value == 2 ) {
                ctx.fillStyle = 'red';
            } else if ( value == 3 ){
                ctx.fillStyle = 'yellow';
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
    
    return canvas;
}