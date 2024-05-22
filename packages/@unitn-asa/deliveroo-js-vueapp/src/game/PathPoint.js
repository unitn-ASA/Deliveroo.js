import * as THREE from 'three';



class PathPoint {

    show () {
        this.sphere.material.opacity = 1;
    }
    hide () {
        this.sphere.material.opacity = 0;
    }
    
    sphere;

    constructor (x, y) {
        const geometry = new THREE.SphereGeometry( 0.1, 5, 5 );
        const material = new THREE.MeshBasicMaterial( { color: 0xffffff, transparent: true, opacity: 0 } );
        this.sphere = new THREE.Mesh( geometry, material );
        this.sphere.position.set( x * 1.5, 0.1, - y * 1.5 );
    }

}



export { PathPoint };