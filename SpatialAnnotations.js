import * as THREE from "./three/three.module.js";

const geometry = new THREE.BoxGeometry(0.025, 0.025, 0.025);
const material = new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: true});

export default class SpatialAnnotations {
	#holoCube;

	#data = [];
	#meshs = [];
	#annotationGroup = new THREE.Group( );

	constructor ( holoCube ) {
		console.log( `SpatialAnnotations - constructor` );
	
		this.#holoCube = holoCube;
	}

	addAnnotation ( position ) { /// local world space coordinates
		const modelPosition = this.#holoCube.worldToModel( position.clone() );
		const remotePosition = this.#holoCube.modelToView( modelPosition.clone() );
		
		const annotationData = {
			modelPosition: modelPosition,
			remotePosition: remotePosition,
		}
		this.#data.push( annotationData );

		const annotationMesh = new THREE.Mesh( geometry, material );
		annotationMesh.position.copy( position );
		this.#meshs.push( annotationMesh );
		this.#annotationGroup.add( annotationMesh );
		console.log(position)
	}

	get annotations ( ) {
		return this.#annotationGroup;
	}

	update ( ) {
		for ( let i = 0; i < this.#data.length ; ++i ) {
			const modelPosition = this.#holoCube.viewToModel( this.#data[i].remotePosition.clone() );
			// if( !)
			this.#meshs[i].visible = this.#holoCube.filterModel( modelPosition );
			this.#meshs[i].position.copy( this.#holoCube.modelToWorld( modelPosition.clone() ) );
		}
	}
}