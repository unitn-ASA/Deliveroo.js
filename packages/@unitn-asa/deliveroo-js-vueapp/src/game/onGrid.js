import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import * as THREE from 'three';
import { Gui } from './Gui.js';



class onGrid {

    /**
     * @type {Gui}
     */
    #gui
        
    #mesh
    /** @return {THREE.Mesh} */
    get mesh () {
        return this.#mesh;
    }

    #x
    get x () {
        return this.#x
    }
    set x (x) {
        this.#x = x
        // this.#mesh.position.x = x * 1.5
    }

    #y
    get y () {
        return this.#y
    }
    set y (y) {
        this.#y = y
        // this.#mesh.position.z = -y * 1.5
    }

    #carriedBy
    pickup ( agent ) {
        this.#carriedBy = agent;
        this.#carriedBy.#mesh.add( this.#mesh );
        this.#carriedBy.carrying.set(this.id, this);
        this.#gui.scene.remove( this.#mesh );
        this.x = 0;
        this.y = 0;
        this.#mesh.position.x = 0;
        this.#mesh.position.z = 0;
        this.#mesh.position.y = this.#carriedBy.carrying.size * 0.5;
    }
    putdown ( x, y ) {
        this.#carriedBy.#mesh.remove( this.#mesh );
        this.#carriedBy.carrying.delete(this.id);
        this.opacity = 1;
        this.x = x // this.#agent.x;
        this.y = y // this.#agent.y;
        this.#mesh.position.x = this.#carriedBy.#mesh.position.x;
        this.#mesh.position.z = this.#carriedBy.#mesh.position.z;
        this.#mesh.position.y = 0.5;
        this.#carriedBy = undefined;
        this.#gui.scene.add( this.#mesh );
    }
    get carriedBy () {
        return this.#carriedBy;
    }

    set opacity (opacity) {
        this.#mesh.material.opacity = opacity;
        this.#label.element.style.visibility  = ( opacity == 0 ? "hidden" : "visible" );
    }

    set color (color) {
        this.#mesh.material.color.setHex( color );
    }

    #text
    get text () {
        return this.#text
    }
    set text (text) {
        this.#text = text
        this.#div.textContent = text
    }

    #div
    #label

    /**
     * onGrid constructor
     * @param {Gui} gui
     * @param {THREE.Mesh} mesh
     * @param {integer} x
     * @param {integer} y
     * @param {string} text
     */
    constructor ( gui, mesh, x, y, text = null ) {

        gui.scene.add( mesh );
        this.#gui = gui;

        this.#mesh = mesh;
        this.#mesh.position.y = 0.5

        this.x = x
        this.y = y

        this.#mesh.position.set( x * 1.5, 0.5, - y * 1.5 );

        this.#gui.animator.on( 'animate', this.animate.bind(this) );
    
        const div = this.#div = document.createElement( 'div' );
        div.className = 'label';
        div.textContent = text;
        div.style.marginTop = '-1em';
    
        const label = this.#label = new CSS2DObject( div );
        label.position.set( 0, 0, 0 );
        label.layers.set( 0 );
        if ( text ) mesh.add( label );
    }

    animate () {
        let x = Math.round( this.x );
        let y = Math.round( this.y );
        let targetVector3 = new THREE.Vector3( x * 1.5, this.#mesh.position.y, - y * 1.5 );

            // // Move directly to x and y
            // targetVector3 = new THREE.Vector3( this.x * 1.5, this.#mesh.position.y, - this.y * 1.5 );
            // this.#mesh.position.copy( targetVector3 );

        if ( x == this.x && y == this.y ) { // if arrived
            this.#mesh.position.lerp( targetVector3, 0.5 );
        } else { // if still moving
            // targetVector3 = new THREE.Vector3( this.x * 1.5, this.#mesh.position.y, - this.y * 1.5 );
            this.#mesh.position.lerp( targetVector3, 0.08 );
        }
    } 

    removeMesh () {
        this.#mesh.remove( this.#label );
        this.#mesh.geometry.dispose();
        this.#mesh.material.dispose();
        this.#gui.scene.remove( this.#mesh );
        if (this.#carriedBy) {
            this.#carriedBy.#mesh.remove( this.#mesh );
            this.#carriedBy.carrying.delete(this.id);
        }
        this.#gui.renderer.renderLists.dispose();
    }

}

export { onGrid };