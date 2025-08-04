import * as THREE from "./three/three.module.js";
import { VRButton } from './three/webxr/VRButton.js';
import { OrbitControls } from './three/controls/OrbitControls.js';

const renderer = new THREE.WebGLRenderer();
renderer.autoClear = false;
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
renderer.xr.enabled = true;

document.body.appendChild( renderer.domElement );
document.body.appendChild( VRButton.createButton( renderer ) );


const scene = new THREE.Scene();
scene.background = new THREE.Color( 0xaaaaaa );
const camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.01, 50 );
camera.position.set( 2, 2, 6 );

const orbitControls = new OrbitControls( camera, renderer.domElement );


const gridHelper = new THREE.GridHelper();
scene.add( gridHelper );

function animate ( ) {
	renderer.render( scene, camera );
}

renderer.xr.addEventListener('sessionstart', ( event ) => {
	console.log(`session start`);

	const baseReferenceSpace = renderer.xr.getReferenceSpace();
	const offsetRotation = new THREE.Quaternion();
	const offsetPosition = camera.position;

	const transform = new XRRigidTransform( offsetPosition.multiplyScalar(-1), offsetRotation ); 
	const teleportSpaceOffset = baseReferenceSpace.getOffsetReferenceSpace( transform );

  renderer.xr.setReferenceSpace( teleportSpaceOffset );
});

renderer.xr.addEventListener('sessionend', ( event ) => {
	console.log(`session end`);
});