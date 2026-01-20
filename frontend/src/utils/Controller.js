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

        const socket = connection.ioClient;
        
        // async function emit( ...args ) {
        //     return new Promise( (res, rej) => {
        //         connection.socket.emit( ...args, (status) => {
        //             res(status);
        //         } );
        //     } );
        // }
        
        var moving = Promise.resolve(true);

        /**
         * @param  { 'move'|'pickup'|'putdown' } action
         * @param  { 'up'|'down'|'left'|'right' = } direction 
         * @returns 
         */
        async function waitAndDo ( action, direction ) {
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
            moving = action == 'move' ? socket.emitAndResolveOnAck( action, direction ) : socket.emitAndResolveOnAck( action );
            let movingResult = await moving;
            // console.log( moving, movingResult );
            return movingResult;
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
                socket.emit( 'putdown' );
            // postpone so to read other keyboard events
            await new Promise( res => setTimeout(res, 50) );
            keys.KeyE = false;
        } );

        watch ( () => keys.Space, async () => {
            if ( keys.Space && connection.grid.hoovered.value ) {
                const hoovered = connection.grid.hoovered.value;
                const { x, y } = connection.grid.hoovered.value;

                // Check if this is a type "5" tile (crate sliding tile)
                const tile = connection.grid.getTile(x, y);
                if (tile && tile.type && tile.type.toString().startsWith('5')) {
                    // Handle crate on type 5 tiles
                    const cratesOnTile = connection.grid.getCratesAt(x, y);
                    if (cratesOnTile && cratesOnTile.length > 0) {
                        // Dispose the first crate on this tile
                        const crate = cratesOnTile[0];
                        socket.emit('crate', 'dispose', { x, y });
                    } else {
                        // Create a new crate
                        socket.emit('crate', 'create', { x, y });
                    }
                } else {
                    // Handle parcel on other tiles
                    const parcel = connection.grid.getParcelByMeshUUID(hoovered.mesh?.uuid);
                    if (parcel) {
                        socket.emit('parcel', 'dispose', parcel);
                    } else {
                        socket.emit('parcel', 'create', { x, y });
                    }
                }
            }
        } );

        watch ( () => keys.Digit0, async () => {
            while ( keys.Digit0 ) {
                if ( connection.grid.hoovered.value ) {
                    var { x, y } = connection.grid.hoovered.value;
                    socket.emit( 'tile', { x, y, type: '0' } );
                }
                await new Promise( res => setTimeout(res) );
            }
        } );

        watch ( () => keys.Digit1, async () => {
            while ( keys.Digit1 ) {
                if ( connection.grid.hoovered.value ) {
                    var { x, y } = connection.grid.hoovered.value;
                    socket.emit( 'tile', { x, y, type: '1' } );
                }
                await new Promise( res => setTimeout(res) );
            }
        } );

        watch ( () => keys.Digit2, async () => {
            while ( keys.Digit2 ) {
                if ( connection.grid.hoovered.value ) {
                    var { x, y } = connection.grid.hoovered.value;
                    // console.log( 'emit tile', { x, y, type: '2' });
                    socket.emit( 'tile', { x, y, type: '2' } );
                }
                await new Promise( res => setTimeout(res) );
            }
        } );

        watch ( () => keys.Digit3, async () => {
            while ( keys.Digit3 ) {
                if ( connection.grid.hoovered.value ) {
                    var { x, y } = connection.grid.hoovered.value;
                    socket.emit( 'tile', { x, y, type: '3' } );
                }
                await new Promise( res => setTimeout(res) );
            }
        } );

        watch ( () => keys.Digit4, async () => {
            if ( keys.Digit4 && connection.grid.hoovered.value ) {
                var { x, y } = connection.grid.hoovered.value;
                const currentTile = connection.grid.getTile(x, y);
                const directionalTiles = ['↑', '→', '↓', '←'];

                // Find current index or start at -1
                let currentIndex = directionalTiles.indexOf(currentTile.type);
                if (currentIndex === -1) {
                    currentIndex = -1; // Not a directional tile, start from beginning
                }

                // Cycle to next direction
                const nextIndex = (currentIndex + 1) % directionalTiles.length;
                socket.emit( 'tile', { x, y, type: directionalTiles[nextIndex] } );

                // Prevent rapid cycling
                keys.Digit4 = false;
                await new Promise( res => setTimeout(res, 200) );
            }
        } );

        watch ( () => keys.Digit5, async () => {
            if ( keys.Digit5 && connection.grid.hoovered.value ) {
                var { x, y } = connection.grid.hoovered.value;
                const currentTile = connection.grid.getTile(x, y);
                const crateTiles = ['5', '5!'];

                // Find current index or start at -1
                let currentIndex = crateTiles.indexOf(currentTile.type);
                if (currentIndex === -1) {
                    currentIndex = -1; // Not a crate tile, start from beginning
                }

                // Cycle to next crate tile type
                const nextIndex = (currentIndex + 1) % crateTiles.length;
                // @ts-ignore - '5!' is a valid tile type but not in IOTileType definition
                socket.emit( 'tile', { x, y, type: crateTiles[nextIndex] } );

                // Prevent rapid cycling
                keys.Digit5 = false;
                await new Promise( res => setTimeout(res, 200) );
            }
        } );
        
    }

}
