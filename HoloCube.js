import * as THREE from "./three/three.module.js";

export default class HoloCube {
    #displayTransform = {
        position: new THREE.Vector3( ),
        rotation: new THREE.Quaternion( ),
        scale: new THREE.Vector3( 1, 1, 1 ),
    }
    #displayMatrix = new THREE.Matrix4( );
    #invDisplayMatrix = new THREE.Matrix4( );

    #viewTransform = {
        position: new THREE.Vector3( ),
        rotation: new THREE.Quaternion( ),
        scale: new THREE.Vector3( 1, 1, 1 ),
    }
    #viewTransformMatrix = new THREE.Matrix4( );
    #invViewTransformMatrix = new THREE.Matrix4( );

	#normalizedViewScale = new THREE.Vector3( 1, 1, 1 );
	#normalizedDisplayScale = new THREE.Vector3( 1, 1, 1 );
	#invNormalizedDisplayScale = new THREE.Vector3( 1, 1, 1 );

	#scalingFactor = 1;

	#visibleFaces = new THREE.Vector3( 1, 1, 1 );

	#planes = {
		x: [new THREE.Vector3(0.5, -0.5, 0.5), new THREE.Vector3(0.5, -0.5, -0.5), new THREE.Vector3(0.5, 0.5, 0.5)],
		y: [new THREE.Vector3(-0.5, 0.5, 0.5), new THREE.Vector3(0.5, 0.5, 0.5), new THREE.Vector3(-0.5, 0.5, -0.5)],
		z: [new THREE.Vector3(-0.5, -0.5, 0.5), new THREE.Vector3(0.5, -0.5, 0.5), new THREE.Vector3(-0.5, 0.5, 0.5)],
	}
	#_planes = {
		x: [new THREE.Vector3(-0.5, -0.5, -0.5), new THREE.Vector3(-0.5, -0.5, 0.5), new THREE.Vector3(-0.5, 0.5, -0.5)],
		y: [new THREE.Vector3(-0.5, -0.5, -0.5), new THREE.Vector3(0.5, -0.5, -0.5), new THREE.Vector3(-0.5, -0.5, 0.5)],
		z: [new THREE.Vector3(0.5, -0.5, -0.5), new THREE.Vector3(-0.5, -0.5, -0.5), new THREE.Vector3(0.5, 0.5, -0.5)],
	}

	constructor ( ) {
		console.log( `HoloCube - constructor` );
	}

	set scale ( scale ) {
		// console.log( `HoloCube - set scale` );

		this.#displayTransform.scale.copy( scale );

		this.#normalizeScale( );
	}

	set position ( position ) {
		// console.log( `HoloCube - set position` );

		this.#displayTransform.position.copy( position );
	}

	get position ( ) {
		// console.log( `HoloCube - get position` );

		return this.#displayTransform.position.clone( );
	}

	set rotation ( rotation ) {
		// console.log( `HoloCube - set rotation` );

		this.#displayTransform.rotation.copy( rotation );
	}

	get rotation (  ) {
		// console.log( `HoloCube - get rotation` );

		return this.#displayTransform.rotation.clone( );
	}


	set viewScale ( scale ) {
		// console.log( `HoloCube - set viewScale` );

		this.#viewTransform.scale.copy( scale );
		
		this.#normalizeScale( );
	}

	set viewPosition ( position ) {
		// console.log( `HoloCube - set viewPosition` );

		this.#viewTransform.position.copy( position );
	}

	set viewRotation ( rotation ) {
		// console.log( `HoloCube - set viewrotation` );

		this.#viewTransform.rotation.copy( rotation );
	}

	#normalizeScale ( ) {
		// console.log( `HoloCube - #normalizeScale` );

		this.#scalingFactor = Math.max( this.#viewTransform.scale.x, Math.max( this.#viewTransform.scale.y, this.#viewTransform.scale.z ) );
		this.#normalizedViewScale.copy( this.#viewTransform.scale ).divideScalar( this.#scalingFactor );
	
		this.#normalizedDisplayScale.copy( this.#normalizedViewScale );
		this.#normalizedDisplayScale.multiply( this.#displayTransform.scale );
		this.#invNormalizedDisplayScale.set( 1, 1, 1 ).divide( this.#normalizedDisplayScale );
	}

	get displayScale ( ) {
		// console.log( `HoloCube - get displayScale` );

		return this.#normalizedDisplayScale;
	}

	get displayPosition ( ) {
		// console.log( `HoloCube - get displayPosition` );

		return this.#displayTransform.position;
	}

	get viewTransformMatrix ( ) {
		return this.#viewTransformMatrix.clone( );
	}
	get displayMatrix ( ) {
		return this.#displayMatrix.clone( );
	}

	worldVisibleFaces ( eye ) {
		return this.visibleFaces( this.worldToModel(eye.clone()));
	}

	visibleFaces ( mEye ) {
		const box = new THREE.Vector3( 0.5, 0.5, 0.5 );

		const x = ( mEye.x > box.x ? 1 : ( mEye.x < -box.x ? -1 : 0 )); 
		const y = ( mEye.y > box.y ? 1 : ( mEye.y < -box.y ? -1 : 0 )); 
		const z = ( mEye.z > box.z ? 1 : ( mEye.z < -box.z ? -1 : 0 )); 
		return { x, y, z };
	}

	computeScreenSpace ( screen ) {
		const ss = [ new THREE.Vector3( ), new THREE.Vector3( ), new THREE.Vector3( ) ]
		ss[0].subVectors( screen[1], screen[0] ).normalize( );
		ss[1].subVectors( screen[2], screen[0] ).normalize( );
		ss[2].crossVectors( ss[0], ss[1] ).normalize( );
	
		return ss;
	}

	computeMatrix ( eye, screen, ss, scale = 1 ) {
		const projection = new THREE.Matrix4();
		const view = new THREE.Matrix4();
		const eyes = [
			screen[0].clone( ).sub( eye ),
			screen[1].clone( ).sub( eye ),
			screen[2].clone( ).sub( eye )
		]
	
		const dist = -eyes[0].dot( ss[2] );
	
		const nearCP = dist;
		const farCP = nearCP + scale;
		const ND = nearCP / dist;
	
		const l = ss[0].dot( eyes[0] ) * ND;
		const r = ss[0].dot( eyes[1] ) * ND;
		const b = ss[1].dot( eyes[0] ) * ND;
		const t = ss[1].dot( eyes[2] ) * ND;
	
		projection.set(
			( 2.0 * nearCP ) / ( r - l ), 0.0, ( r + l ) / ( r - l ), 0.0,
			0.0, ( 2.0 * nearCP ) / ( t - b ), ( t + b ) / ( t - b ), 0.0, 
			0.0, 0.0, -( farCP + nearCP ) / ( farCP - nearCP ), -( 2.0 * farCP * nearCP ) / ( farCP - nearCP ),
			0.0, 0.0, -1.0, 0.0
		);
	
		const E = new THREE.Matrix4( ).makeTranslation( -eye.x, -eye.y, -eye.z );
	
		const ssRotation = new THREE.Matrix4(
			ss[0].x, ss[0].y, ss[0].z, 0.0,
			ss[1].x, ss[1].y, ss[1].z, 0.0,
			ss[2].x, ss[2].y, ss[2].z, 0.0,
			0.0, 0.0, 0.0, 1.0
		);
		view.multiplyMatrices( ssRotation, E );
	
		return { projection, view, nearCP, farCP };
	}

	#updateTransformMatrices () {
		// console.log( `HoloCube - #updateTransformMatrices` );

		this.#displayMatrix.compose(
			this.#displayTransform.position,
			this.#displayTransform.rotation,
			this.#displayTransform.scale,
		);

		this.#invDisplayMatrix.copy( this.#displayMatrix ).invert();
		
		this.#viewTransformMatrix.compose(
			this.#viewTransform.position,
			this.#viewTransform.rotation,
			this.#viewTransform.scale,
		);
		this.#invViewTransformMatrix.copy( this.#viewTransformMatrix ).invert();
	}

	get normalizedViewScale ( ) {
		return this.#normalizedViewScale.clone();
	}

	worldToModel ( point ) {
		const transform = new THREE.Matrix4( );
		transform.makeScale( ...(new THREE.Vector3( 1, 1, 1 ).divide( this.#normalizedViewScale )) );
		point.applyMatrix4( transform );
		point.applyMatrix4( this.#invDisplayMatrix );
		return point;
	}

	modelToWorld ( point ) {
		const transform = new THREE.Matrix4( );
		transform.makeScale( ...this.#normalizedViewScale );
		point.applyMatrix4( transform );
		point.applyMatrix4( this.#displayMatrix );
		return point;
	}

	modelToView ( point ) {
		point.applyMatrix4( this.#viewTransformMatrix );
		return point;
	}

	viewToModel ( point ) {
		point.applyMatrix4( this.#invViewTransformMatrix );
		return point;
	}

	worldToView ( point ) {
		this.worldToModel(point);
		this.modelToView(point);
		return point;
	}

	viewToWorld ( point ) {
		this.viewToModel(point);
		this.modelToWorld(point);
		return point;
	}

	filterModel ( point ) {
		if( Math.abs( point.x ) >= 0.5 || Math.abs( point.y ) >= 0.5  || Math.abs( point.z ) >= 0.5 )
			return false;

		return true;
	}

	filterWorld ( point ) {
		const mPoint = this.worldToModel( point.clone() );
		return this.filterModel( mPoint );
	}

	filterView( point ) {
		const mPoint = this.viewToModel(point.clone());
		return this.filterModel( mPoint );
	}

	computeCameraMatrices ( eye, cameras = {} ) {
		// console.log( `HoloCube - computeCameraMatrices` );

		this.#updateTransformMatrices( );

		const mEye = this.worldToModel(eye.clone());
		const visible = this.visibleFaces( mEye );
		const tEye = this.modelToView(mEye.clone());
		
		const matrices = {};
		for ( const [ face, value ] of Object.entries( visible ) ) {
			/// change to handle case 0 == disable
			const positive = value > -1 ? 1 : -1;
			const plane = positive == 1 ? this.#planes[face] : this.#_planes[face];
			const screen = plane.map( corner => {
				const c = corner.clone();
				c.applyMatrix4(this.#viewTransformMatrix)
				return c; 
			});
			const ss = this.computeScreenSpace( screen );
			matrices[face] = this.computeMatrix( tEye, screen, ss, this.#viewTransform.scale[face] );

			
			cameras[face]?.matrixWorld.copy(matrices[face].view.clone().invert());
			cameras[face]?.projectionMatrix.copy(matrices[face].projection.clone());
			cameras[face]?.matrixWorldInverse.copy(matrices[face].view.clone()); /// debug
			cameras[face]?.projectionMatrixInverse.copy(matrices[face].projection.clone().invert()); /// debug
		}
		return matrices;
	}
}