const myClock = require('../Clock');
const Grid = require('../Grid');
const Service = require('../Service');
const config =  require('../../../config');



const PARCELS_GENERATION_INTERVAL = process.env.PARCELS_GENERATION_INTERVAL || config.PARCELS_GENERATION_INTERVAL || '2s';



class ParcelsGeneratorService extends Service {
    
    myGrid;

    constructor ( /** @type {Grid} */ myGrid ) {
        super( 'ParcelsGeneratorService' )
        this.myGrid = myGrid;
    }

    do () {
        let myGrid = this.myGrid;
        let x = Math.floor( Math.random() * (myGrid.getMapSize().width-2) ) + 1;
        let y = Math.floor( Math.random() * (myGrid.getMapSize().height-2) ) + 1;
        let parcel = myGrid.createParcel(x, y);
        // if (parcel)
        //     console.log('parcel created at', x, y, parcel.reward)
    }

    start () {
        if ( super.start() )
            myClock.on( PARCELS_GENERATION_INTERVAL, this.do )
    }

    stop () {
        if ( super.stop() )
            myClock.off( PARCELS_GENERATION_INTERVAL, this.do )
    }

}



module.exports = ParcelsGeneratorService;
