import * as THREE from "./three/three.module.js";

const TEXTURE_WIDTH = 1024;
const TEXTURE_HEIGHT = 1024;

class HoloCube {
	#displayGroup = new THREE.Group( );

	constructor ( ) {
		console.log( `HoloCube - constructor` );

	}



	get display ( ) {
		console.log( `HoloCube - get display` );

		return this.#displayGroup;
	}

	set camera ( camera ) {

	}

	set stereoCamera ( stereoCamera ) {

	}
	
}