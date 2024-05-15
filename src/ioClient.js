const myClock = require('./deliveroo/Clock');
const Config = require('./deliveroo/Config');
const { InputInterface, SensorInterface } = require('./deliveroo/InterfaceController');
const { Server, Socket, BroadcastOperator } = require('socket.io');



/**
 * @typedef { { me:{id,name,team,x,y}, agents:[{id,name,team,x,y,score}], parcels:[{x,y,type}] } } Status
 */


class ioSensor extends SensorInterface {

    /** @type {BroadcastOperator} */
    #ioAgent;


    
    /**
     * @param {...{id:string, name:string, x:number, y:number, score:number}} agent 
     */
    agents ( ...{id, name, x, y, score} ) {
        this.#ioAgent.emit( 'agents', [ ...{id, name, x, y, score} ] );
    }

    /**
     * @param {...{id:string, x:number, y:number, carriedBy:string, reward:number}} parcel 
     */
    parcels ( ...{id, x, y, carriedBy, reward} ) {
        this.#ioAgent.emit( 'parcels', [ ...{id, x, y, carriedBy, reward} ] );
    }

    /**
     * @param {...{x, y, type:string}} tile blocked, walkable, spawner, delivery
     */
    map ( ...{x, y, type} ) {
        this.#ioAgent.emit( 'map', [ ...{x, y, type} ])
    }

    /**
     * @param {{x, y, type:string}} tile blocked, walkable, spawner, delivery
     */
    tile ( {x, y, type} ) {
        this.#ioAgent.emit( 'tile', {x, y, type} );
    }
    
    /**
     * @param {{id:string, name:string, x:number, y:number, score:number}} you
     */
    you ( {id, name, team, x, y, score} ) {
        this.#ioAgent.emit( 'you', {id, name, team, x, y, score} );
    }

    /**
     * @param {...{id:string, name:string, score:number, team:string, teamScore:number}} leaderboard agents own score and teams'score
     */
    leaderboard ( ...{id, name, score, team, teamScore} ) {
        this.#ioAgent.emit( 'leaderboard', [ ...{id, name, score, team, teamScore} ] );
    }



    /**
     * @param {BroadcastOperator<DecorateAcknowledgementsWithMultipleResponses<DefaultEventsMap>, any>} ioAgent
     */
    constructor( ioAgent ) {
        
        this.#ioAgent = ioAgent;

    }



}



module.exports = ioSensor;