


/**
 * @interface InterfaceClient
 */
class InterfaceClient {

    /**
     * @param {...{id:string, name:string, x:number, y:number, score:number}} agent 
     */
    agents ( ...{id, name, x, y, score} ) {
        throw new Error('Abstract method');
    }

    /**
     * @param {...{id:string, x:number, y:number, carriedBy:string, reward:number}} parcel 
     */
    parcels ( ...{id, x, y, carriedBy, reward} ) {
        throw new Error('Abstract method');
    }

    /**
     * @param {...{x, y, type:string}} tile blocked, walkable, spawner, delivery
     */
    map ( ...{x, y, type} ) {
        throw new Error('Abstract method');
    }

    /**
     * @param {{x, y, type:string}} tile blocked, walkable, spawner, delivery
     */
    tile ( {x, y, type} ) {
        throw new Error('Abstract method');
    }

    /**
     * @param {{id:string, name:string, x:number, y:number, score:number}} you
     */
    you ( {id, name, team, x, y, score} ) {
        throw new Error('Abstract method');
    }

    /**
     * @param {...{id:string, name:string, score:number, team:string, teamScore:number}} leaderboard agents own score and teams'score
     */
    leaderboard ( ...{id, name, score, team, teamScore} ) {
        throw new Error('Abstract method');
    }

    /**
     * @param {...{}} config
     */
    config ( config ) {
        throw new Error('Abstract method');
    }

}


module.exports = InterfaceClient;