import { onGrid } from './onGrid.js';
import { PathPoint } from './PathPoint.js';
import * as THREE from 'three';
import { Gui } from './Gui.js';


class Tile extends onGrid {

    pathPoint;

    #delivery = false;
    get delivery () {
        return this.#delivery;
    }
    set delivery ( value ) {
        this.#delivery = value;
        if ( value )
            this.color = 0xff0000
        else
            this.color = 0x00ff00
    }

    #parcelSpawner = false;
    get parcelSpawner () {
        return this.#parcelSpawner;
    }
    set parcelSpawner ( value ) {
        this.#parcelSpawner = value?true:false;
        if ( value )
            this.color = 0x00ff00
        else if ( ! this.delivery )
            this.color = 0x55dd55
    }
    
    #blocked = false;
    get blocked () {
        return this.#blocked;
    }
    set blocked ( value ) {
        this.#blocked = value;
        if ( value )
            this.color = 0x000000
        else
            this.delivery = this.#delivery;
    }
    
    /**
     * @param {Gui} gui 
     * @param {number} x 
     * @param {number} y 
     * @param {boolean} delivery 
     */
    constructor (gui, x, y, delivery=false) {
        const geometry = new THREE.BoxGeometry( 1, 0.1, 1 );
        const color = delivery ? 0xff0000 : 0x00ff00;
        const material = new THREE.MeshBasicMaterial( { color, transparent: true, opacity: 1 } );
        const cube = new THREE.Mesh( geometry, material );

        super(gui, cube, x, y);
        
        cube.position.y = 0;
        this.#delivery = delivery;

        this.pathPoint = new PathPoint(x, y);
        gui.scene.add( this.pathPoint.sphere );
    }




}



window.getMap = function () {
    const map = [];
    for ( let x=0; x<WIDTH; x++ ) {
        const row = []
        for ( let y=0; y<HEIGHT; y++ ) {
            if ( tiles.has(x + y*1000) ) {
                /**@type {Tile}*/
                let tile = tiles.get( x + y*1000 );
                if ( tile.blocked )
                    row.push(0);
                else if ( tile.delivery )
                    row.push(2);
                else if ( tile.parcelSpawner )
                    row.push(1);
                else
                    row.push(3);
            }
            else {
                row.push(0);
            }
        }
        map.push(row);
    }
    var string = "[\n";
    string += map.map( row => '\t[' + row.join(', ') + ']' ).join( ',\n' )
    // for (const row of map) {
    //     string += '\t[' + row.join(', ') + '],\n';
    // }
    string += "\n]";
    console.log( string );
    return map;
};



export { Tile };