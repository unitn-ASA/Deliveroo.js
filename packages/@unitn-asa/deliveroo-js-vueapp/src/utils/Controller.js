import { watch } from 'vue';
import { keys } from '@/states/keyboard.js';

export class Controller {

    /** @type {import("@/Connection.js").Connection} */
    connection;

    /**
     * Controller constructor
     * @param {import("@/Connection.js").Connection} connection
     */
    constructor( connection ) {

        this.connection = connection;
        
        async function emit( ...args ) {
            return new Promise( (res, rej) => {
                connection.socket.emit( ...args, (status) => {
                    res(status);
                } );
            } );
        }
        
        var moving = Promise.resolve(true);

        async function waitAndDo ( ...args ) {
            // console.log(direction);
            let previous = moving;
            do {
                previous = moving;
                // wait for previous move to finishs
                await moving;
                // postpone so to read other keyboard events
                await new Promise( res => setTimeout(res) );
            // check if no one else already setup another move
            } while ( moving != previous );
            // start and set new move
            moving = emit( ...args );
            return moving;
        } 

        watch ( () => keys.KeyW, async () => {
            while ( keys.KeyW )
                if ( ! await waitAndDo('move', 'up') )
                    keys.KeyW = false;
        } );

        watch ( () => keys.KeyA, async () => {
            while ( keys.KeyA )
                if ( ! await waitAndDo('move', 'left') )
                    keys.KeyA = false;
        } );

        watch ( () => keys.KeyS, async () => {
            while ( keys.KeyS )
                if ( ! await waitAndDo('move', 'down') )
                    keys.KeyS = false;
        } );

        watch ( () => keys.KeyD, async () => {
            while ( keys.KeyD )
                if ( ! await waitAndDo('move', 'right') )
                    keys.KeyD = false;
        } );

        watch ( () => keys.KeyQ, async () => {
            while ( keys.KeyQ )
                if ( ! await waitAndDo('pickup') )
                    keys.KeyQ = false;
        } );

        watch ( () => keys.KeyE, async () => {
            if ( keys.KeyE )
                emit('putdown');
            // postpone so to read other keyboard events
            await new Promise( res => setTimeout(res, 50) );
            keys.KeyE = false;
        } );

        watch ( () => keys.Space, async () => {
            if ( keys.Space )
                emit('create parcel', connection.grid.hoovered.value?.x, connection.grid.hoovered.value?.y);
        } );

        watch ( () => keys.Digit0, async () => {
            while ( keys.Digit0 ) {
                emit( 'tile', connection.grid.hoovered.value?.x, connection.grid.hoovered.value?.y, 0 );
                await new Promise( res => setTimeout(res) );
            }
        } );

        watch ( () => keys.Digit1, async () => {
            while ( keys.Digit1 ) {
                emit( 'tile', connection.grid.hoovered.value?.x, connection.grid.hoovered.value?.y, 1 );
                await new Promise( res => setTimeout(res) );
            }
        } );

        watch ( () => keys.Digit2, async () => {
            while ( keys.Digit2 ) {
                emit( 'tile', connection.grid.hoovered.value?.x, connection.grid.hoovered.value?.y, 2 );
                await new Promise( res => setTimeout(res) );
            }
        } );

        watch ( () => keys.Digit3, async () => {
            while ( keys.Digit3 ) {
                emit( 'tile', connection.grid.hoovered.value?.x, connection.grid.hoovered.value?.y, 3 );
                await new Promise( res => setTimeout(res) );
            }
        } );

        watch ( () => keys.Digit4, async () => {
            while ( keys.Digit4 ) {
                emit( 'tile', connection.grid.hoovered.value?.x, connection.grid.hoovered.value?.y, 4 );
                await new Promise( res => setTimeout(res) );
            }
        } );

        watch ( () => keys.Digit5, async () => {
            while ( keys.Digit5 ) {
                emit( 'tile', connection.grid.hoovered.value?.x, connection.grid.hoovered.value?.y, 5 );
                await new Promise( res => setTimeout(res) );
            }
        } );
        
    }

}
