let map = [];

for (let x = 0; x < 60; x++) {
    map[x] = [];
    for (let y = 0; y < 60; y++) {
        let left = x > 0 ? map[x-1][y] : 0
        let down = y > 0 ? map[x][y-1] : 0
        if ( left && down ) {
            let value = Math.floor( Math.random()*2 ); // either 0: blocked (no tile); or 1: tile
            if ( value && Math.floor( Math.random()*50 ) == 0 ) value = 2; // delivery
            map[x].push( value )
        } else
            map[x].push( 1 )
    }
}

module.exports = map;