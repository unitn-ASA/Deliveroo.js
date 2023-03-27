
var map
try {
    map = require( "./levels/maps/" + process.argv[2] || process.env.MAP || 'default_map' )
} catch (error) {
    map = require("./levels/maps/default_map")
}

var parcels_generator
try {
    parcels_generator = require( "./levels/parcels/" + process.argv[3] || process.env.PARCELS_GENERATOR || 'default_parcels_generator' )
} catch (error) {
    parcels_generator = require("./levels/parcels/default_parcels_generator")
}



module.exports = {
    key: 'mysecret',
    map,
    parcels_generator
};


