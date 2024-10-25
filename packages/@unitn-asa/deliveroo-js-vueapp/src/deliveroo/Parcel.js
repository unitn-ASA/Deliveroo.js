import { onGrid } from './onGrid.js'
import { Agent } from './Agent.js'
import * as THREE from 'three';



class Parcel extends onGrid {

    id

    #reward
    get reward () {
        return this.#reward
    }
    set reward (reward) {
        this.#reward = reward
        this.text = reward;
    }

    /**
     * Parcel constructor
     * @param {THREE.Scene} scene 
     * @param {string} id 
     * @param {number} x 
     * @param {number} y 
     * @param {string} carriedBy 
     * @param {number} reward 
     */
    constructor ( game, id, x, y, carriedBy, reward ) {
        const geometry = new THREE.BoxGeometry( 0.5, 0.5, 0.5 );
        var color = new THREE.Color( 0xffffff );
        color.setHex( Math.random() * 0xffffff );
        const material = new THREE.MeshBasicMaterial( { color, transparent: true, opacity: 1 } );
        const parcel = new THREE.Mesh( geometry, material );

        super( game.gui, parcel, x, y, reward );

        this.id = id;
        this.#reward = reward;

        if (carriedBy) {
            this.pickup( game.getOrCreateAgent( carriedBy ) );
        }

        // console.log('created parcel', id)
    }



}



export { Parcel };