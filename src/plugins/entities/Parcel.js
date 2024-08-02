const Entity =  require('../../deliveroo/Entity')
const PluginEntity = require('../PluginEntity')

const myClock =  require('../../deliveroo/Clock')
const config =  require('../../../config')

      
class Parcel extends Entity {
            
    /**
     * @constructor Parcel
     */
    constructor (tile, grid, carriedBy = null, reward ) { 

        super(tile.x, tile.y, 'parcel', grid);

        let color =  Math.random() * 0xffffff ;
        let style = {shape:'box', params:{width:0.5, height: 0.5, depth:0.5}, color: color}  

        this.set('style', style)
        this.set('cariedBy', carriedBy)

        let rewardParcel = reward || Math.floor( Math.random() * config.PARCEL_REWARD_VARIANCE*2 + config.PARCEL_REWARD_AVG- config.PARCEL_REWARD_VARIANCE );
        this.set('reward', rewardParcel)
        this.set('label', rewardParcel)

        const decay = () => {
            let rewardParcel = Math.floor( this.get('reward') - 1 );
            this.set('reward', rewardParcel)  
            this.set('label', rewardParcel)
            if ( rewardParcel <= 0) {
                this.delete()
                myClock.off( config.PARCEL_DECADING_INTERVAL, decay );
            }
        };
        myClock.on( config.PARCEL_DECADING_INTERVAL, decay );
        
    }

    followCarrier = (agent) => {
        this.x = agent.x;
        this.y = agent.y;
    }

    // implement the event when a parcel is picked up. 
    pickedUp(agent){
        if ( this.get('carriedBy') == null ) {
            this.set('carriedBy', agent.id)
            agent.on( 'xy', this.followCarrier )
            return true;
        }
        return false;
    }

    putDown(agent, tile){
        
        this.set('carriedBy', null)
        agent.off('xy', this.followCarrier)
        
        if ( tile.type == 'delivery') {
            try {   agent.scoring(this.get('reward'))  } 
            catch (error) { /* console.log('agent has not the scoring ability ') */ }
        
            this.delete();
        }

        return true;
    }
     

}


const ParcelPlugin = new PluginEntity(
    'Parcel',
    Parcel,
    { 
        PARCEL_GENERATION_INTERVAL: '2s',  
        PARCEL_MAX: '5',
        
        PARCEL_REWARD_AVG: 30,          // default is 30
        PARCEL_REWARD_VARIANCE: 10,     // default is 10
        PARCEL_DECADING_INTERVAL: '1s', // options are '1s', '2s', '5s', '10s', 'infinite' 
    }
)



module.exports = ParcelPlugin;