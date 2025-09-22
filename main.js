import * as THREE from "./three/three.module.js";
import { VRButton } from './three/webxr/VRButton.js';
import { OrbitControls } from './three/controls/OrbitControls.js';
import HoloCube from "./HoloCube.js";
import { GUI } from './three/libs/lil-gui.module.min.js'; 
import HoloMaterial from "./HoloMaterial.js";
import HoloCubeDisplay from "./HoloCubeDisplay.js";
import { remoteScene } from "./remoteScene.js";
import Stats from './three/libs/stats.module.js';
import { InteractiveGroup } from './three/interactive/InteractiveGroup.js';
import { HTMLMesh } from './three/interactive/HTMLMesh.js';
import { XRControllerModelFactory } from './three/webxr/XRControllerModelFactory.js';

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
camera.position.set( 1.5, 1.5, 2 );

const orbitControls = new OrbitControls( camera, renderer.domElement );

const gridHelper = new THREE.GridHelper();
scene.add( gridHelper );



const textureWidth = 2048;
const textureHeight = 2048;
const renderSettings = {
	minFilter: THREE.NearestFilter,
	magFilter: THREE.NearestFilter,
	format: THREE.RGBAFormat,
	type: THREE.FloatType,
}

const renderTargets = {};
const screenTextures = {};
const cameras = {};


for( const face of ["x", "y", "z"] ) {
	renderTargets[face] = new THREE.WebGLRenderTarget(textureWidth, textureHeight, renderSettings);
	renderTargets[face].depthTexture = new THREE.DepthTexture(textureWidth, textureHeight);
	renderTargets[face].depthTexture.format = THREE.DepthFormat;
	renderTargets[face].depthTexture.type = THREE.FloatType;

	screenTextures[face] = {
		texture: renderTargets[face].texture,
		depthTexture: renderTargets[face].depthTexture,
	}

	cameras[face] = new THREE.PerspectiveCamera();
	cameras[face].matrixAutoUpdate = false;
}

const holoCube = new HoloCube();
const holoCubeDisplay = new HoloCubeDisplay( holoCube, screenTextures );
scene.add(holoCubeDisplay.display);
scene.add(holoCubeDisplay.screens);

// camera.layers.disable(1);

const renderTargetsR = {};
const screenTexturesR = {};
const camerasR = {};


for( const face of ["x", "y", "z"] ) {
	renderTargetsR[face] = new THREE.WebGLRenderTarget(textureWidth, textureHeight, renderSettings);
	renderTargetsR[face].depthTexture = new THREE.DepthTexture(textureWidth, textureHeight);
	renderTargetsR[face].depthTexture.format = THREE.DepthFormat;
	renderTargetsR[face].depthTexture.type = THREE.FloatType;

	screenTexturesR[face] = {
		texture: renderTargetsR[face].texture,
		depthTexture: renderTargetsR[face].depthTexture,
	}

	camerasR[face] = new THREE.PerspectiveCamera();
	camerasR[face].matrixAutoUpdate = false;
}

const holoCubeDisplayR = new HoloCubeDisplay( holoCube, screenTexturesR );

// console.log(renderer.xr.getRenderTarget())







let xrRenderTarget;

function animate ( ) {
	holoCubeDisplay.update();
	holoCubeDisplayR.update();

	const currentRT = renderer.getRenderTarget();
	const VRenabled = renderer.xr.enabled;

	renderer.xr.enabled = false;
	if(renderer.xr.isPresenting) {
		const stereoCameras = renderer.xr.getCamera().cameras;

		holoCube.computeCameraMatrices( stereoCameras[0].position, cameras );
		holoCubeDisplay.updateScreens( stereoCameras[0].position );

		for( const face of ["x", "y", "z"] ) {
			renderer.setRenderTarget( renderTargets[face] );
			renderer.render( remoteScene, cameras[face] );
		}

		holoCube.computeCameraMatrices( stereoCameras[1].position, camerasR );
		holoCubeDisplayR.updateScreens( stereoCameras[1].position );

		for( const face of ["x", "y", "z"] ) {
			renderer.setRenderTarget( renderTargetsR[face] );
			renderer.render( remoteScene, camerasR[face] );
		}
	}

	else {
		holoCube.computeCameraMatrices( camera.position, cameras );
		holoCubeDisplay.updateScreens( camera.position );

		for( const face of ["x", "y", "z"] ) {
			renderer.setRenderTarget( renderTargets[face] );
			renderer.render( remoteScene, cameras[face] );
		}
	}







	renderer.setRenderTarget( null );

	renderer.render( scene, camera );

	renderer.xr.enabled = VRenabled;
	renderer.setRenderTarget( currentRT );

	renderer.render( scene, camera );
}

renderer.xr.addEventListener('sessionstart', ( event ) => {
	console.log(`session start`);

	const baseReferenceSpace = renderer.xr.getReferenceSpace();
	const offsetRotation = new THREE.Quaternion();
	const offsetPosition = camera.position;

	const transform = new XRRigidTransform( offsetPosition.multiplyScalar(-1), offsetRotation ); 
	const teleportSpaceOffset = baseReferenceSpace.getOffsetReferenceSpace( transform );

	xrRenderTarget = renderer.getRenderTarget();
	renderer.xr.setReferenceSpace( teleportSpaceOffset );

	scene.add(holoCubeDisplayR.screens);
	holoCubeDisplay.setScreenLayers(1);
	holoCubeDisplayR.setScreenLayers(2);

});

renderer.xr.addEventListener('sessionend', ( event ) => {
	console.log(`session end`);
	scene.remove(holoCubeDisplayR.screens);
	holoCubeDisplay.setScreenLayers(0);

});




function updateHoloCubeTransform ( ) {
	holoCube.position = guiParams.holoCubeTransforms.position;
	holoCube.scale = guiParams.holoCubeTransforms.scale;
	// const axisH = new THREE.Vector3().set(guiParams.holoCubeTransforms.rotation.x, guiParams.holoCubeTransforms.rotation.y, guiParams.holoCubeTransforms.rotation.z)
	// const rotationHoloCube = new THREE.Quaternion().setFromAxisAngle(axisH, guiParams.holoCubeTransforms.rotation.w);
	// holoCube.rotation = rotationHoloCube;

	holoCube.viewPosition = guiParams.remoteTransforms.position;
	holoCube.viewScale = guiParams.remoteTransforms.scale;
	const axisV = new THREE.Vector3().set(guiParams.remoteTransforms.rotation.x, guiParams.remoteTransforms.rotation.y, guiParams.remoteTransforms.rotation.z)
	const rotationRemote = new THREE.Quaternion().setFromAxisAngle(axisV, guiParams.remoteTransforms.rotation.w);
	holoCube.viewRotation = rotationRemote;
}

function normalizeLockedX ( vector ) {
	const length = vector.length();
	
	const lengthRemain = Math.sqrt(length - vector.x*vector.x);
	const lengthOther = Math.hypot(vector.y, vector.z);
	if(lengthOther != 0) {
		vector.y = vector.y / lengthOther * lengthRemain; 
		vector.z = vector.z / lengthOther * lengthRemain; 
	} else {
		vector.y = lengthRemain; 
		vector.z = 0; 
	}
	vector.normalize();
}

function updateAxisH ( a0, a1, a2 ) {
	const axis = guiParams.holoCubeTransforms.rotation;
	updateAxes ( axis, a0, a1, a2 );
	updateHoloCubeTransform();
}

function updateAxisV ( a0, a1, a2 ) {
	const axis = guiParams.remoteTransforms.rotation;
	updateAxes ( axis, a0, a1, a2 );
	updateHoloCubeTransform();
}

function updateAxes ( axis, a0, a1, a2 ) {
	const nAxis = new THREE.Vector3(axis[a0], axis[a1], axis[a2])
	normalizeLockedX(nAxis);
	axis[a0] = nAxis.x;
	axis[a1] = nAxis.y;
	axis[a2] = nAxis.z;
}



























const gui = new GUI({ width: 300 });
const guiParams = {
	holoCubeTransforms : {
		position: new THREE.Vector3(0, 0, 0),
		scale: new THREE.Vector3(1, 1, 1),
		rotation: new THREE.Vector4(1, 0, 0, 0),
	},
	remoteTransforms : {
		position: new THREE.Vector3(0, 0, 0),
		scale: new THREE.Vector3(1, 1, 1),
		rotation: new THREE.Vector4(1, 0, 0, 0),
	},
}




const holoCubeTransformsFolder = gui.addFolder("Holocube transforms");
const holoCubePositionFolder = holoCubeTransformsFolder.addFolder("position");
holoCubePositionFolder.add(guiParams.holoCubeTransforms.position, "x").min(-10.0).max(10.0).step(0.01).onChange(updateHoloCubeTransform);
holoCubePositionFolder.add(guiParams.holoCubeTransforms.position, "y").min(0.0).max(10.0).step(0.01).onChange(updateHoloCubeTransform);
holoCubePositionFolder.add(guiParams.holoCubeTransforms.position, "z").min(-10.0).max(10.0).step(0.01).onChange(updateHoloCubeTransform);
const holoCubeScaleFolder = holoCubeTransformsFolder.addFolder("scale");
holoCubeScaleFolder.add(guiParams.holoCubeTransforms.scale, "x").min(0.1).max(10.0).step(0.01).onChange(updateHoloCubeTransform);
holoCubeScaleFolder.add(guiParams.holoCubeTransforms.scale, "y").min(0.1).max(10.0).step(0.01).onChange(updateHoloCubeTransform);
holoCubeScaleFolder.add(guiParams.holoCubeTransforms.scale, "z").min(0.1).max(10.0).step(0.01).onChange(updateHoloCubeTransform);
// const holoCubeRotationFolder = holoCubeTransformsFolder.addFolder("rotation");
// holoCubeRotationFolder.add(guiParams.holoCubeTransforms.rotation, "x").min(-1).max(1).step(0.01).onChange(() => { updateAxisH("x", "y", "z")}).listen();
// holoCubeRotationFolder.add(guiParams.holoCubeTransforms.rotation, "y").min(-1).max(1).step(0.01).onChange(() => { updateAxisH("y", "z", "x")}).listen();
// holoCubeRotationFolder.add(guiParams.holoCubeTransforms.rotation, "z").min(-1).max(1).step(0.01).onChange(() => { updateAxisH("z", "x", "y")}).listen();
// holoCubeRotationFolder.add(guiParams.holoCubeTransforms.rotation, "w").name("angle").min(-Math.PI).max(Math.PI).step(0.01).onChange(updateHoloCubeTransform);

const remoteTransformsFolder = gui.addFolder("Remote Scene transforms");
const remoteScenePositionFolder = remoteTransformsFolder.addFolder("position");
remoteScenePositionFolder.add(guiParams.remoteTransforms.position, "x").min(-10.0).max(10.0).step(0.01).onChange(updateHoloCubeTransform);
remoteScenePositionFolder.add(guiParams.remoteTransforms.position, "y").min(0.0).max(10.0).step(0.01).onChange(updateHoloCubeTransform);
remoteScenePositionFolder.add(guiParams.remoteTransforms.position, "z").min(-10.0).max(10.0).step(0.01).onChange(updateHoloCubeTransform);
const remoteSceneScaleFolder = remoteTransformsFolder.addFolder("scale");
remoteSceneScaleFolder.add(guiParams.remoteTransforms.scale, "x").min(0.1).max(10.0).step(0.01).onChange(updateHoloCubeTransform);
remoteSceneScaleFolder.add(guiParams.remoteTransforms.scale, "y").min(0.1).max(10.0).step(0.01).onChange(updateHoloCubeTransform);
remoteSceneScaleFolder.add(guiParams.remoteTransforms.scale, "z").min(0.1).max(10.0).step(0.01).onChange(updateHoloCubeTransform);
const remoteRotationFolder = remoteTransformsFolder.addFolder("rotation");
remoteRotationFolder.add(guiParams.remoteTransforms.rotation, "x").min(-1).max(1).step(0.01).onChange(() => { updateAxisV("x", "y", "z")}).listen();
remoteRotationFolder.add(guiParams.remoteTransforms.rotation, "y").min(-1).max(1).step(0.01).onChange(() => { updateAxisV("y", "z", "x")}).listen();
remoteRotationFolder.add(guiParams.remoteTransforms.rotation, "z").min(-1).max(1).step(0.01).onChange(() => { updateAxisV("z", "x", "y")}).listen();
remoteRotationFolder.add(guiParams.remoteTransforms.rotation, "w").name("angle").min(-Math.PI).max(Math.PI).step(0.01).onChange(updateHoloCubeTransform);





/// VR specific code


const interactiveGroup = new InteractiveGroup();
interactiveGroup.listenToPointerEvents( renderer, camera );
// interactiveGroup.listenToXRControllerEvents( controller1 );
// interactiveGroup.listenToXRControllerEvents( controller2 );
scene.add( interactiveGroup );

const guiMesh = new HTMLMesh( gui.domElement );
const statsMesh = new HTMLMesh( gui.domElement );
console.log(guiMesh)
guiMesh.position.x = - 0.75;
guiMesh.position.y = 1.5;
guiMesh.position.z = - 0.5;
guiMesh.rotation.y = Math.PI / 4;
guiMesh.scale.setScalar( 5 );
interactiveGroup.add( guiMesh );


const lineGeometry = new THREE.BufferGeometry();
lineGeometry.setFromPoints( [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, - 5 ) ] );

const controller1 = renderer.xr.getController( 0 );
controller1.add( new THREE.Line( lineGeometry ) );
scene.add( controller1 );

const controllerModelFactory = new XRControllerModelFactory();
const controllerGrip1 = renderer.xr.getControllerGrip( 0 );
controllerGrip1.add( controllerModelFactory.createControllerModel( controllerGrip1 ) );
scene.add( controllerGrip1 );

interactiveGroup.listenToPointerEvents( renderer, camera );
interactiveGroup.listenToXRControllerEvents( controller1 );