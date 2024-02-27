import { Client } from './Client.js';



class Controller {

    /** @type {Client} */
    #client; 

    /**
     * Controller constructor
     * @param {Client} client
     */
    constructor( client ) {

        this.#client = client;
        const socket = client.socket;
        
        var action = null;
        async function start_doing ( ) {
            while ( action ) {
                let res = await action();
                // if failed stop doing until keyup reset the action
                if ( ! res )
                    break;
            }
        }

        document.onkeyup = function(evt) {
            action = null;
        }
        document.onkeydown = function(evt) {
            if ( action == null) {
                // do the rest of this function and then call start_doing
                setTimeout( start_doing );
            }
            switch (evt.code) {
                case 'KeyQ':// Q pickup
                    action = () => {
                        return new Promise( (res) => {
                            // console.log('emit pickup');
                            socket.emit('pickup', (picked) => {
                                // console.log( 'pickup', picked, 'parcels' );
                                // for ( let p of picked ) {
                                //     parcels.get( p.id ).pickup(me);
                                // }
                                res(picked.length>0);
                            } );
                        } );
                    };
                    break;
                case 'KeyE':// E putdown
                    action = () => {
                        return new Promise( (res) => {
                            // console.log('emit putdown');
                            socket.emit('putdown', null, (dropped) => {
                                // console.log( 'putdown', dropped, 'parcels' );
                                // for ( let p of dropped ) {
                                //     parcels.get( p.id ).putdown();
                                // }
                                res(dropped.length>0);
                            } );
                        } );
                    };
                    break;
                case 'KeyW':// W up
                    action = () => {
                        // console.log( ('KeyW') );
                        return new Promise( (res, rej) => {
                            // console.log('emit move up');
                            socket.emit('move', 'up', (status) => {
                                // console.log( (status ? 'move up done' : 'move up failed') );
                                res(status);
                            } );
                        } );
                    };
                    break;
                case 'KeyA':// A left
                    action = () => {
                        return new Promise( (res, rej) => {
                            // console.log('emit move left');
                            socket.emit('move', 'left', (status) => {
                                // console.log( (status ? 'move left done' : 'move left failed') );
                                res(status);
                            } );
                        } );
                    };
                    break;
                case 'KeyS':// S down 
                    action = () => {
                        return new Promise( (res, rej) => {
                            // console.log('emit move down');
                            socket.emit('move', 'down', (status) => {
                                // console.log( (status ? 'move down done' : 'move down failed') );
                                res(status);
                            } );
                        } );
                    };
                    break;
                case 'KeyD':// D right
                    action = () => {
                        return new Promise( (res, rej) => {
                            // console.log('emit move right');
                            socket.emit('move', 'right', (status) => {
                                // console.log( (status ? 'move right done' : 'move right failed') );
                                res(status);
                            } );
                        } );
                    };
                    break;
                default:
                    break;
            }
        };
    
    
    
    }

}



export { Controller };