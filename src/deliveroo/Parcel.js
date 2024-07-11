const Observable =  require('./Observable')
const Entity =  require('./Entity')
const myClock =  require('./Clock')
const config =  require('../../config')


const PARCEL_REWARD_AVG = process.env.PARCEL_REWARD_AVG || config.PARCEL_REWARD_AVG || 30;
const PARCEL_REWARD_VARIANCE = process.env.PARCEL_REWARD_VARIANCE ?? config.PARCEL_REWARD_VARIANCE ?? 10;
const PARCEL_DECADING_INTERVAL = process.env.PARCEL_DECADING_INTERVAL || config.PARCEL_DECADING_INTERVAL || 'infinite';



class Parcel extends Entity {
    
    static #lastId = 0;
    
    // #grid;
    reward;
    carriedBy;
    
    /**
     * @constructor Parcel
     */
    constructor (x, y, carriedBy = null, reward ) {

        let id = 'p' + Parcel.#lastId++;

        let color =  Math.random() * 0xffffff ;
        let style = {shape:'box', params:{width:0.5, height: 0.5, depth:0.5}, color: color}     
        
        super(id, x, y, 'parcel');

        this.metadata.style = style;

        this.carriedBy = carriedBy;
        this.interceptValueSet('carriedBy');

        // Follow carrier
        var lastCarrier = null;
        const followCarrier = (agent) => {
            this.x = agent.x;
            this.y = agent.y;
        }
        this.on( 'carriedBy', (parcel) => {
            if ( lastCarrier ){
                lastCarrier.off( 'xy', followCarrier )
                this.metadata.carriedBy = false 
            }

            if ( this.carriedBy ){
                this.carriedBy.on( 'xy', followCarrier )
                this.metadata.carriedBy = this.carriedBy.id
            }

            lastCarrier = this.carriedBy;
        } )      

        this.interceptValueSet('reward');
        this.reward = reward || Math.floor( Math.random()*PARCEL_REWARD_VARIANCE*2 + PARCEL_REWARD_AVG-PARCEL_REWARD_VARIANCE );
        this.metadata.label = this.reward;

        const decay = () => {
            this.reward = Math.floor( this.reward - 1 );
            this.metadata.label = this.reward;
            if ( this.reward <= 0) {
                this.emitOnePerTick( 'expired', this );
                myClock.off( PARCEL_DECADING_INTERVAL, decay );
            }
        };
        myClock.on( PARCEL_DECADING_INTERVAL, decay );
        
    }

}



module.exports = Parcel;