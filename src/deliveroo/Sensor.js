const Observable =  require('../utils/Observable')
const Xy =  require('./Xy')
const Grid =  require('./Grid')
const Tile =  require('./Tile');
const Game = require('./Game');
const Agent = require('./Agent');



/**
 * @class Sensor
 * @extends Observable
 * @property {Set<Agent>} sensing agents in the sensed area
 */
class Sensor extends Observable {
    
    sensing = new Set();
    
    /**
     * @constructor Sensor
     * @param {Agent} agent
     * @param {Grid} grid
     */
    constructor ( agent, grid ) {
        super();
        
        // Observe agents xy (incluse mine) and update sensing
        Game.dispatcher.observe( (events) => {
            for ( const ev of events ) {
                const it = ev.object;
                if ( it.xy.distance(agent.xy) < 3 ) {
                    if ( !this.sensing.has(it) ) {
                        console.log('start sensing agent', it.id, it.xy.toString() )
                        this.triggerEvent( new Observable.Event('start sensing agent', it.id, agent) )
                        // this.sensing.add(it);
                    }
                    this.triggerEvent( new Observable.Event('sensing agent', 'xy', it) )
                    // this.triggerEvent(it);
                }
                else {
                    if ( this.sensing.has(it) ) {
                        console.log('no more sensing agent', it.id, it.xy.toString() )
                        this.triggerEvent( new Observable.Event('no more sensing agent', it.id, agent) )
                        // this.triggerEvent(it);
                        this.sensing.delete(it);
                    }
                }
            }
        }, ev => ev.field == 'xy' && ev.object instanceof Agent && ev.object.xy %1 == 0 );
                
    }

}



module.exports = Sensor;