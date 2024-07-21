const Entity =  require('../../deliveroo/Entity')
const myClock =  require('../../deliveroo/Clock')
const config =  require('../../../config')


const PARCEL_REWARD_AVG = process.env.PARCEL_REWARD_AVG || config.PARCEL_REWARD_AVG || 30;
const PARCEL_REWARD_VARIANCE = process.env.PARCEL_REWARD_VARIANCE ?? config.PARCEL_REWARD_VARIANCE ?? 10;
const PARCEL_DECADING_INTERVAL = process.env.PARCEL_DECADING_INTERVAL || config.PARCEL_DECADING_INTERVAL || 'infinite';


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

        let rewardParcel = reward || Math.floor( Math.random() * PARCEL_REWARD_VARIANCE*2 + PARCEL_REWARD_AVG-PARCEL_REWARD_VARIANCE );
        this.set('reward', rewardParcel)
        this.set('label', rewardParcel)

        const decay = () => {
            let rewardParcel = Math.floor( this.get('reward') - 1 );
            this.set('reward', rewardParcel)  
            this.set('label', rewardParcel)
            if ( rewardParcel <= 0) {
                this.delete()
                myClock.off( PARCEL_DECADING_INTERVAL, decay );
            }
        };
        myClock.on( PARCEL_DECADING_INTERVAL, decay );
        
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



module.exports = Parcel;