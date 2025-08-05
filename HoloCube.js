import * as THREE from "./three/three.module.js";

const TEXTURE_WIDTH = 1024;
const TEXTURE_HEIGHT = 1024;

export default class HoloCube {
	#VR = false;

	#displayScale = new THREE.Vector3( 2, 2, 2 );
	#displayRotation = new THREE.Quaternion( 0, 0, 0, 1 );
	#displayPosition = new THREE.Vector3( 0, 0, 0 );

	#viewPosition = new THREE.Vector3( 0, 0, 0);
	#viewRotation = new THREE.Quaternion( 0, 0, 0, 1 );
	#viewScale = new THREE.Vector3( 1, 1, 1 );

	#normalizedViewScale = new THREE.Vector3( 1, 1, 1 );
	#invNormalizedViewScale = new THREE.Vector3( 1, 1, 1 );

	/// move out to display classes
	#displayGroup = new THREE.Group();
	#screensGroup = new THREE.Group();
	
	constructor ( ) {
		console.log( `HoloCube - constructor` );
		this.#initializeViewer();
	}

	#initializeViewer ( ) {
		console.log( `HoloCube - #initializeViewer` );

		const boxGeometry = new THREE.BoxGeometry( 1, 1, 1 );
		const hologramBoxOutline = new THREE.LineSegments(
			new THREE.EdgesGeometry( boxGeometry ),
			new THREE.LineBasicMaterial({
				color: 0xFFFFFF,
			}),
		);

		const hologramBoxFaces = new THREE.Mesh(
			boxGeometry,
			new THREE.MeshLambertMaterial({
				color: 0xDDDDDD,
				transparent: true,
				opacity: 0.3,
			}),
		);

		//hologramBoxFaces.layers.disable(0);
		//hologramBoxFaces.layers.enable(1);

		this.#displayGroup.add( hologramBoxFaces, hologramBoxOutline );
	}

	#initializeScreens ( ) {

	}

	#normalizeScale ( ) {
		console.log( `HoloCube - #normalizeScale` );

		const scalingFactor = Math.max( this.#viewScale.x, Math.max( this.#viewScale.y, this.#viewScale.z ) );
		this.#normalizedViewScale.set( 1, 1 , 1 ).multiplyScalar( scalingFactor );
		this.#invNormalizedViewScale.copy( this.#viewScale ).divideScalar( scalingFactor );
	}

	#updateDisplay ( ) {
		console.log( `HoloCube - #updateDisplay` );

		this.#displayGroup.scale.copy( this.#invNormalizedViewScale );
		this.#displayGroup.scale.multiply( this.#displayScale );
	}

	visibleFaces ( eye ) {
		console.log( `HoloCube - #updateDisplay` );


	}



	get display ( ) {
		console.log( `HoloCube - get display` );

		return this.#displayGroup;
	}

	get screens ( ) {
		console.log( `HoloCube - get screens` );

		return this.#screensGroup;
	}

	//set camera ( camera ) {

	//}

	//set stereoCamera ( stereoCamera ) {

	//}

	set scale ( scale ) {
		console.log( `HoloCube - set scale` );

		this.#displayScale.copy( scale );
	}

	set rotation ( rotation ) {

	}

	set position ( position ) {

	}

	set viewPosition ( position ) {

	}

	set viewRotation ( rotation ) {

	}

	set viewScale ( scale ) {
		console.log( `HoloCube - set viewScale` );
		
		this.#viewScale.copy( scale );

		this.#normalizeScale();
		this.#updateDisplay();
	}
}