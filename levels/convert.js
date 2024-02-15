const fs = require('fs/promises');

var fileNames = [
    'challenge_1',
    'challenge_21',
    'challenge_22',
    'challenge_23',
    'challenge_24',
    'challenge_31',
    'challenge_32',
    'challenge_33',
    'level_1',
    'level_2',
    'level_3',
    'level_4',
    'level_5',
    'level_empty_10',
    'map_random',
    'random'
]

for ( let fileName of fileNames ) {

    var file = require('./'+fileName+'.js')

    file.name = fileName

    fs.writeFile('./'+fileName+'.json',JSON.stringify(file, null, 2), (error) => {
        if (error) {
            console.log('An error has occurred ', error);
            return;
        }
        console.log(fileName, 'written successfully to', './'+fileName+'.json');
    });

}
  


