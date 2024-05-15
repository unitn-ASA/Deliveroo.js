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
        
        let currEvt = new Map();
        document.onkeydown = async (evt) => {
            if (evt.repeat) return; // ignore key continuosly pressed
            currEvt.set(evt.code, evt);
            if ( currEvt.size == 1 && ! doing )
                startDoing();
        }
        document.onkeyup = async (evt) => {
            currEvt.delete(evt.code);
        }

        var doing = false;
        var startDoing = async () => {
            // if doing nothing, start doing
            if ( ! doing ) {
                doing = true;
                while (currEvt.size > 0) {
                    // get the first keydown event
                    let evt = currEvt.values().next().value;
                    
                    // wait for doing to finish
                    let res = await this.evaluateKeyAndDoAct(evt);

                    // if failed give up, restart only at next keydown
                    if ( ! res ) {
                        console.log( 'Action failed, waiting for keyup and then retry!' );
                        currEvt.delete(evt.code);
                        break;
                    }
                    
                    // postpone to being able to read keyboard events
                    await new Promise( res => setTimeout(res()) );
                }
                doing = false;
            }
        }
        
    }

    /**
     * @param {KeyboardEvent} evt 
     * @returns {Promise}
     */
    async evaluateKeyAndDoAct ( evt ) {
        const socket = this.#client.socket;
        switch ( evt.code ) {
            case 'KeyQ':// Q pickup
                return new Promise( (res) => {
                    // console.log('emit pickup');
                    socket.emit('pickup', (picked) => {
                        // console.log( 'pickup', picked, 'parcels' );
                        // for ( let p of picked ) {
                        //     parcels.get( p.id ).pickup(me);
                        // }
                        res(picked);
                    } );
                } );
            case 'KeyE':// E putdown
                return new Promise( (res) => {
                    // console.log('emit putdown');
                    socket.emit('putdown', null, (dropped) => {
                        // console.log( 'putdown', dropped, 'parcels' );
                        // for ( let p of dropped ) {
                        //     parcels.get( p.id ).putdown();
                        // }
                        res(dropped);
                    } );
                } );
            case 'KeyW':// W up
                return new Promise( (res, rej) => {
                    // console.log('emit move up');
                    socket.emit('move', 'up', (status) => {
                        res(status);
                    } );
                } );
            case 'KeyA':// A left
                return new Promise( (res, rej) => {
                    // console.log('emit move left');
                    socket.emit('move', 'left', (status) => {
                        res(status);
                    } );
                } );
            case 'KeyS':// S down
                return new Promise( (res, rej) => {
                    // console.log('emit move down');
                    socket.emit('move', 'down', (status) => {
                        res(status);
                    } );
                } );
            case 'KeyD':// D right
                return new Promise( (res, rej) => {
                    // console.log('emit move right');
                    socket.emit('move', 'right', (status) => {
                        res(status);
                    } );
                } );
            default:
                break;
        }
    };

}



export { Controller };