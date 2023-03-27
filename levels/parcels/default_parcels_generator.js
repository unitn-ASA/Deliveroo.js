const myClock = require('../../src/deliveroo/Clock');



module.exports = function ( myGrid ) {

    myClock.on( '2s', () => {

        let x = Math.floor(Math.random()*8) + 1;
        let y = Math.floor(Math.random()*8) + 1;
        let parcel = myGrid.createParcel(x, y);
        // if (parcel)
        //     console.log('parcel created at', x, y, parcel.reward)

    } )
    
}

