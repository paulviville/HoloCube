import DepthMaterial from "./DepthMaterial.js";
import PickingMaterial from "./PickingMaterial.js";
import * as THREE from "./three/three.module.js";

export default class HoloCubeDisplay {
	#holocube;

	#display = {
		faces: undefined,
		edges: undefined,
		group: new THREE.Group( ),
	};

	#screens = {
		x: undefined,
		y: undefined,
		z: undefined,
		group: new THREE.Group( ),
	};

	#screenMaterials = {};

	constructor ( holoCube, screenTextures ) {
		console.log( `HoloCubeDisplay - constructor` );

		this.#holocube = holoCube;

		this.#initializeDisplay( );
		this.#initializeScreens( screenTextures );
	}

	#initializeDisplay ( ) {
		const displayGeometry = new THREE.BoxGeometry( 1, 1, 1 );
		const displayMaterial = new THREE.MeshLambertMaterial({ color: 0xDDDDDD, transparent: true, opacity: 0.1 });

		const displayEdgeGeometry = new THREE.EdgesGeometry( displayGeometry );
		const displayEdgeMaterial = new THREE.LineBasicMaterial({color: 0x0000ff})

		this.#display.faces = new THREE.Mesh( displayGeometry, displayMaterial );
		this.#display.edges = new THREE.LineSegments( displayEdgeGeometry, displayEdgeMaterial );

		this.#display.group.add( this.#display.faces );
		this.#display.group.add( this.#display.edges );
	}

	#initializeScreens ( screenTextures ) {
		const screenGeometry = new THREE.PlaneGeometry( 1, 1 );

		for ( const [ face, st ] of Object.entries( screenTextures ) ) {
			this.#screenMaterials[face] = {
				depth: new DepthMaterial( st.texture, st.depthTexture ),
				picking: new PickingMaterial( st.depthTexture ),
			}
			this.#screens[face] = new THREE.Mesh( screenGeometry, this.#screenMaterials[face].depth );
			this.#screens.group.add( this.#screens[face] );
		}
	}
	
	get display ( ) {
		return this.#display.group;
	}

	get screens ( ) {
		return this.#screens.group;
	}

	set picking ( bool ) {
		for ( const [ face, materials ] of Object.entries( this.#screenMaterials ) ) {
			this.#screens[face].material = bool ? materials.picking : materials.depth;
		}
	}

	setDisplayLayer ( layer ) {
		this.#display.group.layers.set(layer);
		this.#display.faces.layers.set(layer);
		this.#display.edges.layers.set(layer);
	}

	setScreenLayers ( layer ) {
		this.#screens.x.layers.set(layer);
		this.#screens.y.layers.set(layer);
		this.#screens.z.layers.set(layer);
		this.#screens.group.layers.set(layer);
	}

	update ( ) {
		this.#display.group.scale.copy( this.#holocube.displayScale );
		this.#display.group.position.copy( this.#holocube.displayPosition );
		this.#display.group.quaternion.copy( this.#holocube.rotation );

		this.#screens.group.scale.copy( this.#holocube.displayScale );
		this.#screens.group.position.copy( this.#holocube.displayPosition );
		this.#screens.group.quaternion.copy( this.#holocube.rotation );
	}

	updateScreens ( eye ) {
		const visible = this.#holocube.worldVisibleFaces( eye );
		const direction = new THREE.Vector3();

		for ( const [ face, value ] of Object.entries( visible ) ) {
			/// change to handle 0 case == disable
			const positive = value > -1 ? 1 : -1; 
			this.#screens[face].position[face] = positive * 0.5;
			direction.copy( this.#screens[face].position );
			direction[face] += positive * 100;  // do it in world space instead of model
			direction.add( this.#screens.group.position );
			this.#screens[face].lookAt( direction );
		}

		const matrices = this.#holocube.computeCameraMatrices( eye );
		const uniforms = { };

		const invTransform = this.#holocube.viewTransformMatrix.invert();
		const transform = this.#holocube.displayMatrix;
		const scalingFactor = this.#holocube.normalizedViewScale;

		for ( const [ face, value ] of Object.entries( matrices ) ) {
			uniforms[face] = {};
			uniforms[face].invTransform = invTransform;
			uniforms[face].transform = transform;
			uniforms[face].scalingFactor = scalingFactor;
			uniforms[face].invOAView = value.view.clone().invert();
			uniforms[face].invOAProj = value.projection.clone().invert();
		}
		this.setScreenUniforms( uniforms );
	}

	setScreenUniforms ( uniforms ) {
		for ( const [ face, value ] of Object.entries( uniforms ) ) {
			// this.#screens[face].material.setUniforms( value );
			// this.#screens[face].material.setUniforms( value );
			this.#screenMaterials[face].depth.setUniforms( value );
			this.#screenMaterials[face].picking.setUniforms( value );
		}
	}

	setPickingRay ( ray ) {
		for ( const face of [ "x", "y", "z" ] ) {
			this.#screenMaterials[face].picking.setUniforms( ray );
		}
	}

	set displayVisible ( value ) {
		this.#display.group.visible = value;
	}

	set screensVisible ( value ) {
		this.#screens.group.visible = value;
	}
}