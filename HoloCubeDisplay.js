import * as THREE from "./three/three.module.js";

export default class HoloCubeDisplay extends THREE.Object3D {
	#holoCube;
	
	constructor ( holoCube ) {
		console.log( `HoloCubeDisplay - constructor` );

		this.#holoCube = holoCube;
	}

}